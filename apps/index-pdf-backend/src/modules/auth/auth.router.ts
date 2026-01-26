import { TRPCError } from "@trpc/server";
import { gel } from "../../db/client";
import { eventEmitter } from "../../events/emitter";
import { logEvent } from "../../logger";
import { protectedProcedure, publicProcedure, router } from "../../trpc";
import {
	exchangeCodeForToken,
	generateCodeChallenge,
	generateCodeVerifier,
	getAuthToken,
	registerUser,
} from "./auth.service";
import { SignInSchema, SignUpSchema } from "./auth.types";

// ============================================================================
// Auth tRPC Router
// ============================================================================

export const authRouter = router({
	signUp: publicProcedure
		.input(SignUpSchema)
		.mutation(async ({ input, ctx }) => {
			try {
				const verifier = generateCodeVerifier();
				const challenge = generateCodeChallenge(verifier);

				const signupResult = await registerUser({
					email: input.email,
					password: input.password,
					challenge,
				});

				let authToken: string;
				if (signupResult.code?.trim()) {
					authToken = await exchangeCodeForToken({
						code: signupResult.code,
						verifier,
					});
				} else {
					authToken = await getAuthToken({
						email: input.email,
						password: input.password,
					});
				}

				const authenticatedClient = gel.withGlobals({
					"ext::auth::client_token": authToken,
				});

				const user = await authenticatedClient.querySingle<{
					id: string;
					email: string;
					name: string | null;
				}>(
					`
			INSERT User {
				email := <str>$email,
				name := <optional str>$name,
				identity := global ext::auth::ClientTokenIdentity
			}
			UNLESS CONFLICT ON .identity
			ELSE (
				SELECT User FILTER .identity = global ext::auth::ClientTokenIdentity
			)
		`,
					{
						email: input.email,
						name: input.name ?? null,
					},
				);

				if (user) {
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
				}

				return {
					authToken,
					message: "User created successfully",
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
				const authToken = await getAuthToken({
					email: input.email,
					password: input.password,
				});

				const authenticatedClient = gel.withGlobals({
					"ext::auth::client_token": authToken,
				});

				const user = await authenticatedClient.querySingle<{
					id: string;
					email: string;
				}>(
					`
				SELECT User {
					id,
					email
				}
				FILTER .identity = global ext::auth::ClientTokenIdentity
				LIMIT 1
			`,
				);

				if (user) {
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
				}

				return {
					authToken,
					message: "Signed in successfully",
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
