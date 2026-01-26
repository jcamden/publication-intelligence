import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestUser } from "../../test/factories";
import {
	closeTestServer,
	createTestServer,
	makeAuthenticatedRequest,
} from "../../test/server-harness";

// ============================================================================
// API / Integration Tests
// ============================================================================

describe("Project API (Integration)", () => {
	let server: FastifyInstance;
	let testUser: Awaited<ReturnType<typeof createTestUser>>;
	let authenticatedRequest: ReturnType<typeof makeAuthenticatedRequest>;

	beforeAll(async () => {
		server = await createTestServer();
		testUser = await createTestUser();
		authenticatedRequest = makeAuthenticatedRequest({
			server,
			authToken: testUser.authToken,
		});
	});

	afterAll(async () => {
		await closeTestServer(server);
	});

	// Note: Test data cleanup handled by branch reset (see reset-test-branch.sh)

	describe("POST /trpc/project.create", () => {
		it("should create project via HTTP", async () => {
			const response = await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/project.create",
				payload: {
					title: "HTTP Test Project",
					description: "Created via HTTP",
				},
			});

			expect(response.statusCode).toBe(200);
			const body = JSON.parse(response.body);
			expect(body.result.data.title).toBe("HTTP Test Project");
		});

		it("should require authentication", async () => {
			const response = await server.inject({
				method: "POST",
				url: "/trpc/project.create",
				payload: {
					title: "Unauthenticated Project",
				},
			});

			expect(response.statusCode).toBe(401);
		});

		it("should validate required fields", async () => {
			const response = await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/project.create",
				payload: {
					description: "Missing title",
				},
			});

			expect(response.statusCode).toBe(400);
		});
	});

	describe("GET /trpc/project.list", () => {
		it("should list projects", async () => {
			await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/project.create",
				payload: { title: "List Test 1" },
			});

			await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/project.create",
				payload: { title: "List Test 2" },
			});

			const response = await authenticatedRequest.inject({
				method: "GET",
				url: "/trpc/project.list",
			});

			expect(response.statusCode).toBe(200);
			const body = JSON.parse(response.body);
			expect(Array.isArray(body.result.data)).toBe(true);
			expect(body.result.data.length).toBeGreaterThanOrEqual(2);
		});

		it("should require authentication", async () => {
			const response = await server.inject({
				method: "GET",
				url: "/trpc/project.list",
			});

			expect(response.statusCode).toBe(401);
		});
	});

	describe("GET /trpc/project.getById", () => {
		it("should retrieve project by id", async () => {
			const createResponse = await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/project.create",
				payload: { title: "Get By ID Test" },
			});

			const created = JSON.parse(createResponse.body).result.data;

			const response = await authenticatedRequest.inject({
				method: "GET",
				url: `/trpc/project.getById?input=${encodeURIComponent(JSON.stringify({ id: created.id }))}`,
			});

			expect(response.statusCode).toBe(200);
			const body = JSON.parse(response.body);
			expect(body.result.data.id).toBe(created.id);
		});

		it("should return 404 for non-existent project", async () => {
			const fakeId = "00000000-0000-0000-0000-000000000000";

			const response = await authenticatedRequest.inject({
				method: "GET",
				url: `/trpc/project.getById?input=${encodeURIComponent(JSON.stringify({ id: fakeId }))}`,
			});

			expect(response.statusCode).toBe(404);
		});
	});

	describe("PATCH /trpc/project.update", () => {
		it("should update project", async () => {
			const createResponse = await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/project.create",
				payload: { title: "Original" },
			});

			const created = JSON.parse(createResponse.body).result.data;

			const response = await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/project.update",
				payload: {
					id: created.id,
					data: { title: "Updated via HTTP" },
				},
			});

			expect(response.statusCode).toBe(200);
			const body = JSON.parse(response.body);
			expect(body.result.data.title).toBe("Updated via HTTP");
		});
	});

	describe("DELETE /trpc/project.delete", () => {
		it("should soft delete project", async () => {
			const createResponse = await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/project.create",
				payload: { title: "To Be Deleted" },
			});

			const created = JSON.parse(createResponse.body).result.data;

			const deleteResponse = await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/project.delete",
				payload: { id: created.id },
			});

			expect(deleteResponse.statusCode).toBe(200);

			const getResponse = await authenticatedRequest.inject({
				method: "GET",
				url: `/trpc/project.getById?input=${encodeURIComponent(JSON.stringify({ id: created.id }))}`,
			});

			expect(getResponse.statusCode).toBe(404);
		});
	});

	describe("Authorization", () => {
		it("should not allow access to other users' projects", async () => {
			const user1 = await createTestUser();
			const user2 = await createTestUser();

			const user1Request = makeAuthenticatedRequest({
				server,
				authToken: user1.authToken,
			});

			const user2Request = makeAuthenticatedRequest({
				server,
				authToken: user2.authToken,
			});

			const createResponse = await user1Request.inject({
				method: "POST",
				url: "/trpc/project.create",
				payload: { title: "User 1 Project" },
			});

			const created = JSON.parse(createResponse.body).result.data;

			const response = await user2Request.inject({
				method: "GET",
				url: `/trpc/project.getById?input=${encodeURIComponent(JSON.stringify({ id: created.id }))}`,
			});

			expect(response.statusCode).toBe(404);
		});
	});
});
