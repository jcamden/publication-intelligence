import { createHash, randomBytes } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { gel } from "../db/client";
import { protectedProcedure, publicProcedure, router } from "../trpc";

// Get Gel Auth URL from environment or use the project instance default
const GEL_AUTH_URL =
	process.env.GEL_AUTH_URL ?? "http://localhost:10701/db/main/ext/auth";

// PKCE helper functions
function generateCodeVerifier(): string {
	return randomBytes(32).toString("base64url");
}

function generateCodeChallenge(verifier: string): string {
	return createHash("sha256").update(verifier).digest("base64url");
}

async function getAuthToken(email: string, password: string): Promise<string> {
	// Generate PKCE challenge
	const verifier = generateCodeVerifier();
	const challenge = generateCodeChallenge(verifier);

	const response = await fetch(`${GEL_AUTH_URL}/authenticate`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			provider: "builtin::local_emailpassword",
			email,
			password,
			challenge,
		}),
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(error || "Authentication failed");
	}

	const result = (await response.json()) as { code: string };
	return await exchangeCodeForToken(result.code, verifier);
}

async function exchangeCodeForToken(
	code: string,
	verifier: string,
): Promise<string> {
	// Token endpoint expects query parameters
	const url = new URL(`${GEL_AUTH_URL}/token`);
	url.searchParams.set("code", code);
	url.searchParams.set("verifier", verifier);

	const response = await fetch(url.toString(), {
		method: "GET",
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(error || "Token exchange failed");
	}

	const result = (await response.json()) as { auth_token: string };
	return result.auth_token;
}

export const authRouter = router({
	signUp: publicProcedure
		.input(
			z.object({
				email: z.string().email(),
				password: z.string().min(8),
				name: z.string().optional(),
			}),
		)
		.mutation(async ({ input }) => {
			try {
				// Generate PKCE challenge
				const verifier = generateCodeVerifier();
				const challenge = generateCodeChallenge(verifier);

				// Call Gel Auth HTTP API for signup
				const response = await fetch(`${GEL_AUTH_URL}/register`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						provider: "builtin::local_emailpassword",
						email: input.email,
						password: input.password,
						challenge,
						verify_url: "http://localhost:3000/auth/verify",
					}),
				});

				if (!response.ok) {
					const error = await response.text();
					throw new Error(error || "Signup failed");
				}

				const signupResult = (await response.json()) as {
					code?: string;
					email: string;
					provider: string;
				};

				console.log("Signup result:", JSON.stringify(signupResult));

				// Get auth token - if code is provided, exchange it; otherwise authenticate
				let authToken: string;
				if (signupResult.code?.trim()) {
					console.log("Exchanging code for token");
					authToken = await exchangeCodeForToken(signupResult.code, verifier);
				} else {
					console.log("No code - authenticating directly");
					// No verification required - authenticate directly
					authToken = await getAuthToken(input.email, input.password);
				}

				// Create authenticated client with the token
				// This automatically sets global ext::auth::ClientTokenIdentity
				const authenticatedClient = gel.withGlobals({
					"ext::auth::client_token": authToken,
				});

				// Create User record linked to the authenticated identity
				// Use raw EdgeQL since global isn't well-exposed in query builder
				await authenticatedClient.querySingle(
					`
					INSERT User {
						email := <str>$email,
						name := <optional str>$name,
						identity := global ext::auth::ClientTokenIdentity
					}
				`,
					{
						email: input.email,
						name: input.name ?? null,
					},
				);

				return {
					authToken,
					message: "User created successfully",
				};
			} catch (error) {
				console.error("Sign up error:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: error instanceof Error ? error.message : "Failed to sign up",
				});
			}
		}),

	signIn: publicProcedure
		.input(
			z.object({
				email: z.string().email(),
				password: z.string(),
			}),
		)
		.mutation(async ({ input }) => {
			try {
				const authToken = await getAuthToken(input.email, input.password);

				return {
					authToken,
					message: "Signed in successfully",
				};
			} catch (error) {
				console.error("Sign in error:", error);
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "Invalid email or password",
				});
			}
		}),

	me: protectedProcedure.query(({ ctx }) => {
		return ctx.user;
	}),

	signOut: protectedProcedure.mutation(async () => {
		// Gel Auth uses stateless JWTs - no server-side token deletion needed
		// Client should remove the token from storage
		return { message: "Signed out successfully" };
	}),
});
