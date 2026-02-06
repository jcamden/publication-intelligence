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
export const publicProcedure = t.procedure;

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

export const protectedProcedure = t.procedure.use(isAuthenticated);
