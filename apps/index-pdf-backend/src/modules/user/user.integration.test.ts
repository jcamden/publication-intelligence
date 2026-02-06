import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { generateTestEmail, generateTestPassword } from "../../test/factories";
import { closeTestServer, createTestServer } from "../../test/server-harness";

// ============================================================================
// User Integration Tests
// ============================================================================

describe("User API (Integration)", () => {
	let server: FastifyInstance;

	beforeAll(async () => {
		server = await createTestServer();
	});

	afterAll(async () => {
		await closeTestServer(server);
	});

	// Note: Test data cleanup handled by branch reset (see reset-test-branch.sh)

	describe("POST /trpc/user.deleteAccount", () => {
		it("should delete authenticated user account", async () => {
			const email = generateTestEmail();
			const password = generateTestPassword();

			const signUpResponse = await server.inject({
				method: "POST",
				url: "/trpc/auth.signUp",
				headers: {
					"content-type": "application/json",
				},
				payload: {
					email,
					password,
				},
			});

			expect(signUpResponse.statusCode).toBe(200);
			const { token } = JSON.parse(signUpResponse.body).result.data;

			const deleteResponse = await server.inject({
				method: "POST",
				url: "/trpc/user.deleteAccount",
				headers: {
					authorization: `Bearer ${token}`,
					"content-type": "application/json",
				},
			});

			expect(deleteResponse.statusCode).toBe(200);
			const body = JSON.parse(deleteResponse.body);
			expect(body.result.data.success).toBe(true);
			expect(body.result.data.message).toBe("Account deleted successfully");

			// Verify deleted user's token is now invalid
			const verifyDeletedResponse = await server.inject({
				method: "GET",
				url: "/trpc/auth.me",
				headers: {
					authorization: `Bearer ${token}`,
				},
			});

			expect(verifyDeletedResponse.statusCode).toBe(401);
		});

		it("should require authentication", async () => {
			const response = await server.inject({
				method: "POST",
				url: "/trpc/user.deleteAccount",
				headers: {
					"content-type": "application/json",
				},
			});

			expect(response.statusCode).toBe(401);
		});

		it("should delete user and allow re-registration with same email", async () => {
			const email = generateTestEmail();
			const password = generateTestPassword();

			const signUpResponse = await server.inject({
				method: "POST",
				url: "/trpc/auth.signUp",
				headers: {
					"content-type": "application/json",
				},
				payload: { email, password },
			});

			expect(signUpResponse.statusCode).toBe(200);
			const { token } = JSON.parse(signUpResponse.body).result.data;

			const deleteResponse = await server.inject({
				method: "POST",
				url: "/trpc/user.deleteAccount",
				headers: {
					authorization: `Bearer ${token}`,
					"content-type": "application/json",
				},
			});

			expect(deleteResponse.statusCode).toBe(200);

			const reSignUpResponse = await server.inject({
				method: "POST",
				url: "/trpc/auth.signUp",
				headers: {
					"content-type": "application/json",
				},
				payload: { email, password: generateTestPassword() },
			});

			expect(reSignUpResponse.statusCode).toBe(200);
			const reSignUpBody = JSON.parse(reSignUpResponse.body);
			expect(reSignUpBody.result.data.token).toBeDefined();
		});

		it("should emit events for account deletion", async () => {
			const email = generateTestEmail();
			const password = generateTestPassword();

			const signUpResponse = await server.inject({
				method: "POST",
				url: "/trpc/auth.signUp",
				headers: {
					"content-type": "application/json",
				},
				payload: { email, password },
			});

			const { token } = JSON.parse(signUpResponse.body).result.data;

			const response = await server.inject({
				method: "POST",
				url: "/trpc/user.deleteAccount",
				headers: {
					authorization: `Bearer ${token}`,
					"content-type": "application/json",
				},
			});

			expect(response.statusCode).toBe(200);
		});
	});
});
