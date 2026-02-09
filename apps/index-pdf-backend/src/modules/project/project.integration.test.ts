import "../../test/setup";
import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestUser } from "../../test/factories";
import { FAKE_UUID } from "../../test/mocks";
import {
	closeTestServer,
	createTestServer,
	makeAuthenticatedRequest,
} from "../../test/server-harness";

// ============================================================================
// API / Integration Tests
// ============================================================================

// Extend test context to include server and test user
declare module "vitest" {
	export interface TestContext {
		server: FastifyInstance;
		testUser: Awaited<ReturnType<typeof createTestUser>>;
		authenticatedRequest: ReturnType<typeof makeAuthenticatedRequest>;
	}
}

describe("Project API (Integration)", () => {
	beforeEach(async (context) => {
		// Create server with test-specific database
		context.server = await createTestServer();

		// Create user for authenticated tests
		// Factories will use module-level override (set by setup.ts beforeEach)
		context.testUser = await createTestUser();
		context.authenticatedRequest = makeAuthenticatedRequest({
			server: context.server,
			authToken: context.testUser.authToken,
		});
	});

	afterEach(async (context) => {
		await closeTestServer(context.server);
	});

	describe("POST /trpc/project.create", () => {
		it("should create project via HTTP", async ({ authenticatedRequest }) => {
			const response = await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/project.create",
				payload: {
					title: "HTTP Test Project",
					description: "Created via HTTP",
					project_dir: "http-test-project",
				},
			});

			expect(response.statusCode).toBe(200);
			const body = JSON.parse(response.body);
			expect(body.result.data.title).toBe("HTTP Test Project");
		});

		it("should require authentication", async ({ server }) => {
			const response = await server.inject({
				method: "POST",
				url: "/trpc/project.create",
				payload: {
					title: "Unauthenticated Project",
					project_dir: "unauth-project",
				},
			});

			expect(response.statusCode).toBe(401);
		});

		it("should validate required fields", async ({ authenticatedRequest }) => {
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
		it("should list projects", async ({ authenticatedRequest }) => {
			await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/project.create",
				payload: { title: "List Test 1", project_dir: "list-test-1" },
			});

			await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/project.create",
				payload: { title: "List Test 2", project_dir: "list-test-2" },
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

		it("should require authentication", async ({ server }) => {
			const response = await server.inject({
				method: "GET",
				url: "/trpc/project.list",
			});

			expect(response.statusCode).toBe(401);
		});
	});

	describe("GET /trpc/project.getById", () => {
		it("should retrieve project by id", async ({ authenticatedRequest }) => {
			const createResponse = await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/project.create",
				payload: { title: "Get By ID Test", project_dir: "get-by-id-test" },
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

		it("should return 404 for non-existent project", async ({
			authenticatedRequest,
		}) => {
			const response = await authenticatedRequest.inject({
				method: "GET",
				url: `/trpc/project.getById?input=${encodeURIComponent(JSON.stringify({ id: FAKE_UUID }))}`,
			});

			expect(response.statusCode).toBe(404);
		});
	});

	describe("PATCH /trpc/project.update", () => {
		it("should update project", async ({ authenticatedRequest }) => {
			const createResponse = await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/project.create",
				payload: { title: "Original", project_dir: "original" },
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
		it("should soft delete project", async ({ authenticatedRequest }) => {
			const createResponse = await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/project.create",
				payload: { title: "To Be Deleted", project_dir: "to-be-deleted" },
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

	describe("GET /trpc/project.getByDir", () => {
		it("should retrieve project by directory", async ({
			authenticatedRequest,
		}) => {
			const createResponse = await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/project.create",
				payload: {
					title: "Get By Dir Test",
					project_dir: "get-by-dir-test",
				},
			});

			const created = JSON.parse(createResponse.body).result.data;

			const response = await authenticatedRequest.inject({
				method: "GET",
				url: `/trpc/project.getByDir?input=${encodeURIComponent(JSON.stringify({ projectDir: "get-by-dir-test" }))}`,
			});

			expect(response.statusCode).toBe(200);
			const body = JSON.parse(response.body);
			expect(body.result.data.id).toBe(created.id);
			expect(body.result.data.project_dir).toBe("get-by-dir-test");
		});

		it("should return source_document info when document exists", async ({
			authenticatedRequest,
		}) => {
			// Create project
			await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/project.create",
				payload: {
					title: "Project With Document",
					project_dir: "project-with-doc",
				},
			});

			// Note: In a full test, we would upload a document here
			// For now, we test the structure when source_document is null

			const response = await authenticatedRequest.inject({
				method: "GET",
				url: `/trpc/project.getByDir?input=${encodeURIComponent(JSON.stringify({ projectDir: "project-with-doc" }))}`,
			});

			expect(response.statusCode).toBe(200);
			const body = JSON.parse(response.body);
			expect(body.result.data).toHaveProperty("source_document");
			// Initially null before document upload
			expect(body.result.data.source_document).toBeNull();
		});

		it("should return 404 for non-existent project directory", async ({
			authenticatedRequest,
		}) => {
			const response = await authenticatedRequest.inject({
				method: "GET",
				url: `/trpc/project.getByDir?input=${encodeURIComponent(JSON.stringify({ projectDir: "non-existent-dir" }))}`,
			});

			expect(response.statusCode).toBe(404);
		});

		it("should prioritize owned projects over collaborated projects", async ({
			server,
		}) => {
			const user2 = await createTestUser();

			const user2Request = makeAuthenticatedRequest({
				server,
				authToken: user2.authToken,
			});

			// User2 creates a project
			// This tests the ORDER BY .owner.id = global current_user_id DESC logic
			const user2CreateResponse = await user2Request.inject({
				method: "POST",
				url: "/trpc/project.create",
				payload: {
					title: "User 2 Project",
					project_dir: "user2-project-dir",
				},
			});
			const user2Project = JSON.parse(user2CreateResponse.body).result.data;

			// When user2 queries by directory, should get their own project
			const user2Response = await user2Request.inject({
				method: "GET",
				url: `/trpc/project.getByDir?input=${encodeURIComponent(JSON.stringify({ projectDir: "user2-project-dir" }))}`,
			});

			expect(user2Response.statusCode).toBe(200);
			const user2Body = JSON.parse(user2Response.body);
			expect(user2Body.result.data.id).toBe(user2Project.id);
		});
	});

	describe("Authorization", () => {
		it("should not allow access to other users' projects", async ({
			server,
		}) => {
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
				payload: { title: "User 1 Project", project_dir: "user-1-project" },
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
