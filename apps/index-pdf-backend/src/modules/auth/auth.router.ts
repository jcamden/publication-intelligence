import { TRPCError } from "@trpc/server";
import { emitEvent } from "../../event-bus/emit-event";
import { logEvent } from "../../logger";
import { protectedProcedure, publicProcedure, router } from "../../trpc";
import { login, signup } from "./auth.service";
import { SignInSchema, SignUpSchema } from "./auth.types";

// ============================================================================
// Auth tRPC Router
// ============================================================================

export const authRouter = router({
	signUp: publicProcedure
		.input(SignUpSchema)
		.mutation(async ({ input, ctx }) => {
			try {
				const { user, token } = await signup({
					email: input.email,
					password: input.password,
					name: input.name ?? undefined,
					requestId: ctx.requestId,
				});

				return {
					user,
					token,
				};
			} catch (error) {
				logEvent({
					event: "auth.signup_failed",
					context: {
						requestId: ctx.requestId,
						error,
						metadata: {
							email: input.email,
						},
					},
				});

				// Check for unique constraint violation (duplicate email)
				if (error instanceof Error && error.message.includes("unique")) {
					throw new TRPCError({
						code: "CONFLICT",
						message: "Email already registered",
					});
				}

				// Re-throw to let middleware handle it
				throw error;
			}
		}),

	signIn: publicProcedure
		.input(SignInSchema)
		.mutation(async ({ input, ctx }) => {
			try {
				const { user, token } = await login({
					email: input.email,
					password: input.password,
				});

				await emitEvent(
					{
						type: "user.logged_in",
						metadata: {
							email: user.email,
						},
					},
					{ userId: user.id, requestId: ctx.requestId },
				);

				return {
					user,
					token,
				};
			} catch (error) {
				await emitEvent(
					{
						type: "auth.failed_login_attempt",
						metadata: {
							email: input.email,
							reason: error instanceof Error ? error.message : "Unknown error",
						},
					},
					{ requestId: ctx.requestId },
				);

				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "Invalid email or password",
				});
			}
		}),

	me: protectedProcedure.query(({ ctx }) => {
		return ctx.user;
	}),

	signOut: protectedProcedure.mutation(async ({ ctx }) => {
		await emitEvent(
			{
				type: "user.logged_out",
				metadata: {
					email: ctx.user.email,
				},
			},
			{ userId: ctx.user.id, requestId: ctx.requestId },
		);

		return { message: "Signed out successfully" };
	}),
});
