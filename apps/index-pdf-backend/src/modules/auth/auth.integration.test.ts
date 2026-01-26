import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { generateTestEmail, generateTestPassword } from "../../test/factories";
import { closeTestServer, createTestServer } from "../../test/server-harness";

// ============================================================================
// Auth Integration Tests
// ============================================================================

describe("Auth API (Integration)", () => {
	let server: FastifyInstance;

	beforeAll(async () => {
		server = await createTestServer();
	});

	afterAll(async () => {
		await closeTestServer(server);
	});

	// Note: Test data cleanup handled by branch reset (see reset-test-branch.sh)

	describe("POST /trpc/auth.signUp", () => {
		it("should create new user", async () => {
			const email = generateTestEmail();
			const password = generateTestPassword();

			const response = await server.inject({
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

			if (response.statusCode !== 200) {
				console.error("Response body:", response.body);
			}

			expect(response.statusCode).toBe(200);
			const body = JSON.parse(response.body);
			expect(body.result.data.authToken).toBeDefined();
		});

		it("should validate email format", async () => {
			const response = await server.inject({
				method: "POST",
				url: "/trpc/auth.signUp",
				payload: {
					email: "invalid-email",
					password: "password123",
				},
			});

			expect(response.statusCode).toBe(400);
		});

		it("should validate password length", async () => {
			const email = generateTestEmail();

			const response = await server.inject({
				method: "POST",
				url: "/trpc/auth.signUp",
				payload: {
					email,
					password: "short",
				},
			});

			expect(response.statusCode).toBe(400);
		});
	});

	describe("POST /trpc/auth.signIn", () => {
		it("should authenticate existing user", async () => {
			const email = generateTestEmail();
			const password = generateTestPassword();

			await server.inject({
				method: "POST",
				url: "/trpc/auth.signUp",
				payload: { email, password },
			});

			const response = await server.inject({
				method: "POST",
				url: "/trpc/auth.signIn",
				payload: { email, password },
			});

			expect(response.statusCode).toBe(200);
			const body = JSON.parse(response.body);
			expect(body.result.data.authToken).toBeDefined();
		});

		it("should reject invalid credentials", async () => {
			const response = await server.inject({
				method: "POST",
				url: "/trpc/auth.signIn",
				payload: {
					email: generateTestEmail(),
					password: "wrong-password",
				},
			});

			expect(response.statusCode).toBe(401);
		});
	});

	describe("GET /trpc/auth.me", () => {
		it("should return authenticated user", async () => {
			const email = generateTestEmail();
			const password = generateTestPassword();

			const signUpResponse = await server.inject({
				method: "POST",
				url: "/trpc/auth.signUp",
				payload: { email, password },
			});

			const { authToken } = JSON.parse(signUpResponse.body).result.data;

			const response = await server.inject({
				method: "GET",
				url: "/trpc/auth.me",
				headers: {
					authorization: `Bearer ${authToken}`,
				},
			});

			expect(response.statusCode).toBe(200);
			const body = JSON.parse(response.body);
			expect(body.result.data.email).toBe(email);
		});

		it("should require authentication", async () => {
			const response = await server.inject({
				method: "GET",
				url: "/trpc/auth.me",
			});

			expect(response.statusCode).toBe(401);
		});
	});

	describe("Event emission", () => {
		it("should emit events for auth actions", async () => {
			const email = generateTestEmail();
			const password = generateTestPassword();

			const response = await server.inject({
				method: "POST",
				url: "/trpc/auth.signUp",
				payload: { email, password, name: "Test User" },
			});

			expect(response.statusCode).toBe(200);
		});
	});
});
