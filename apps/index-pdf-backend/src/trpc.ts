import { initTRPC, TRPCError } from "@trpc/server";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "./db/client";
import { users } from "./db/schema";

type Context = {
	authToken?: string;
	user?: {
		id: string;
		email: string;
		name: string | null;
	};
	requestId: string;
};

export const t = initTRPC.context<Context>().create();

export const router = t.router;

// ============================================================================
// Error Handling Middleware
// ============================================================================

const errorHandler = t.middleware(async ({ next }) => {
	try {
		return await next();
	} catch (error) {
		// Re-throw TRPCErrors as-is (from service layer or other middleware)
		if (error instanceof TRPCError) {
			throw error;
		}

		// Wrap unknown errors
		throw new TRPCError({
			code: "INTERNAL_SERVER_ERROR",
			message: error instanceof Error ? error.message : "Internal server error",
		});
	}
});

// ============================================================================
// Base Procedures
// ============================================================================

export const publicProcedure = t.procedure.use(errorHandler);

const isAuthenticated = t.middleware(async ({ ctx, next }) => {
	if (!ctx.user || !ctx.authToken) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "Not authenticated",
		});
	}

	// Verify user still exists in database and is not soft-deleted
	// This ensures deleted users' JWT tokens become invalid
	const [activeUser] = await db
		.select({ id: users.id })
		.from(users)
		.where(
			and(
				eq(users.id, ctx.user.id),
				isNull(users.deletedAt), // User must not be soft-deleted
			),
		)
		.limit(1);

	if (!activeUser) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "User account not found or has been deleted",
		});
	}

	// Note: RLS user context is set at the repository level via withUserContext()
	// This allows each database operation to run in its own transaction with proper isolation

	return next({
		ctx: {
			authToken: ctx.authToken,
			user: ctx.user,
			requestId: ctx.requestId,
		},
	});
});

export const protectedProcedure = publicProcedure.use(isAuthenticated);
