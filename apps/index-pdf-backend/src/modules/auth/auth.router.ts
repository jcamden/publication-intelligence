import { TRPCError } from "@trpc/server";
import { eventEmitter } from "../../events/emitter";
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
				});

				logEvent({
					event: "auth.user_created",
					context: {
						requestId: ctx.requestId,
						userId: user.id,
						metadata: {
							email: user.email,
							hasName: !!user.name,
						},
					},
				});

				await eventEmitter.emit({
					type: "user.created",
					timestamp: new Date(),
					userId: user.id,
					email: user.email,
					name: user.name ?? undefined,
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

				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: error instanceof Error ? error.message : "Failed to sign up",
				});
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

				logEvent({
					event: "auth.user_logged_in",
					context: {
						requestId: ctx.requestId,
						userId: user.id,
						metadata: {
							email: user.email,
						},
					},
				});

				await eventEmitter.emit({
					type: "user.logged_in",
					timestamp: new Date(),
					userId: user.id,
					email: user.email,
				});

				return {
					user,
					token,
				};
			} catch (error) {
				logEvent({
					event: "auth.login_failed",
					context: {
						requestId: ctx.requestId,
						error,
						metadata: {
							email: input.email,
							reason: error instanceof Error ? error.message : "Unknown error",
						},
					},
				});

				await eventEmitter.emit({
					type: "auth.failed_login_attempt",
					timestamp: new Date(),
					email: input.email,
					reason: error instanceof Error ? error.message : "Unknown error",
				});

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
		logEvent({
			event: "auth.user_logged_out",
			context: {
				requestId: ctx.requestId,
				userId: ctx.user.id,
				metadata: {
					email: ctx.user.email,
				},
			},
		});

		await eventEmitter.emit({
			type: "user.logged_out",
			timestamp: new Date(),
			userId: ctx.user.id,
			email: ctx.user.email,
		});

		return { message: "Signed out successfully" };
	}),
});
