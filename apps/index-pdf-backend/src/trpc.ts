import { initTRPC, TRPCError } from "@trpc/server";
import type { verifyGelToken } from "./auth/verify-token";

type Context = {
	authToken?: string;
	user?: Awaited<ReturnType<typeof verifyGelToken>>["user"];
	requestId: string;
};

export const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

const isAuthenticated = t.middleware(async ({ ctx, next }) => {
	if (!ctx.user) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "Not authenticated",
		});
	}

	return next({
		ctx: {
			...ctx,
			user: ctx.user,
		},
	});
});

export const protectedProcedure = t.procedure.use(isAuthenticated);
