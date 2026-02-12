import "../../test/setup";
import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
	createTestProject,
	createTestUser,
	grantIndexTypeAddon,
} from "../../test/factories";
import {
	closeTestServer,
	createTestServer,
	makeAuthenticatedRequest,
} from "../../test/server-harness";

// ============================================================================
// API / Integration Tests for ProjectIndexType
// ============================================================================

// Extend test context to include server and test user
declare module "vitest" {
	export interface TestContext {
		server: FastifyInstance;
		testUser: Awaited<ReturnType<typeof createTestUser>>;
		authenticatedRequest: ReturnType<typeof makeAuthenticatedRequest>;
		testProjectId: string;
	}
}

describe("ProjectIndexType API (Integration)", () => {
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

		// Create test project
		const project = await createTestProject({
			userId: context.testUser.userId,
		});
		context.testProjectId = project.id;

		// Grant addons to test user (simulates self-service purchase)
		await grantIndexTypeAddon({
			userId: context.testUser.userId,
			indexType: "subject",
		});

		await grantIndexTypeAddon({
			userId: context.testUser.userId,
			indexType: "author",
		});

		// Note: Don't enable index types here - tests that need them enabled will do it themselves
		// This keeps listAvailable and enable tests working correctly
	});

	afterEach(async (context) => {
		await closeTestServer(context.server);
	});

	describe("GET /trpc/projectIndexType.listUserAddons", () => {
		it("should return user's granted addons", async ({
			authenticatedRequest,
		}) => {
			const response = await authenticatedRequest.inject({
				method: "GET",
				url: "/trpc/projectIndexType.listUserAddons",
			});

			expect(response.statusCode).toBe(200);
			const body = JSON.parse(response.body);
			expect(Array.isArray(body.result.data)).toBe(true);
			// User has subject and author addons granted in beforeEach
			expect(body.result.data).toContain("subject");
			expect(body.result.data).toContain("author");
			expect(body.result.data).not.toContain("scripture");
		});

		it("should require authentication", async ({ server }) => {
			const response = await server.inject({
				method: "GET",
				url: "/trpc/projectIndexType.listUserAddons",
			});

			expect(response.statusCode).toBe(401);
		});
	});

	describe("POST /trpc/projectIndexType.listAvailable", () => {
		it("should list available index types user can enable", async ({
			authenticatedRequest,
			testProjectId,
		}) => {
			const response = await authenticatedRequest.inject({
				method: "GET",
				url: `/trpc/projectIndexType.listAvailable?input=${encodeURIComponent(JSON.stringify({ projectId: testProjectId }))}`,
			});

			expect(response.statusCode).toBe(200);
			const body = JSON.parse(response.body);
			expect(Array.isArray(body.result.data)).toBe(true);
			// User has subject and author addons
			expect(body.result.data.length).toBeGreaterThanOrEqual(2);
		});

		it("should require authentication", async ({ server, testProjectId }) => {
			const response = await server.inject({
				method: "GET",
				url: `/trpc/projectIndexType.listAvailable?input=${encodeURIComponent(JSON.stringify({ projectId: testProjectId }))}`,
			});

			expect(response.statusCode).toBe(401);
		});
	});

	describe("POST /trpc/projectIndexType.enable", () => {
		it("should enable index type for project", async ({
			authenticatedRequest,
			testProjectId,
		}) => {
			const response = await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/projectIndexType.enable",
				payload: {
					projectId: testProjectId,
					highlightType: "subject",
					colorHue: 230, // Blue hue (subject default)
				},
			});

			expect(response.statusCode).toBe(200);
			const body = JSON.parse(response.body);
			expect(body.result.data.colorHue).toBe(230);
			expect(body.result.data.visible).toBe(true);
		});

		it("should allow custom colorHue", async ({
			authenticatedRequest,
			testProjectId,
		}) => {
			const response = await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/projectIndexType.enable",
				payload: {
					projectId: testProjectId,
					highlightType: "author",
					colorHue: 120, // Green hue
				},
			});

			expect(response.statusCode).toBe(200);
			const body = JSON.parse(response.body);
			expect(body.result.data.colorHue).toBe(120);
		});

		it("should fail if user lacks addon", async ({
			authenticatedRequest,
			testProjectId,
		}) => {
			// User doesn't have scripture addon
			const response = await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/projectIndexType.enable",
				payload: {
					projectId: testProjectId,
					highlightType: "scripture",
					colorHue: 160, // Green hue
				},
			});

			expect(response.statusCode).toBe(403);
		});
	});

	describe("GET /trpc/projectIndexType.list", () => {
		it("should list enabled index types", async ({
			authenticatedRequest,
			testProjectId,
		}) => {
			// First enable some index types
			await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/projectIndexType.enable",
				payload: {
					projectId: testProjectId,
					highlightType: "subject",
					colorHue: 230, // Blue hue
				},
			});

			await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/projectIndexType.enable",
				payload: {
					projectId: testProjectId,
					highlightType: "author",
					colorHue: 270, // Purple hue
				},
			});

			const response = await authenticatedRequest.inject({
				method: "GET",
				url: `/trpc/projectIndexType.list?input=${encodeURIComponent(JSON.stringify({ projectId: testProjectId }))}`,
			});

			expect(response.statusCode).toBe(200);
			const body = JSON.parse(response.body);
			expect(Array.isArray(body.result.data)).toBe(true);
			expect(body.result.data.length).toBeGreaterThanOrEqual(2); // subject + author
		});
	});

	describe("POST /trpc/projectIndexType.update", () => {
		it("should update color", async ({
			authenticatedRequest,
			testProjectId,
		}) => {
			// Enable an index type first
			await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/projectIndexType.enable",
				payload: {
					projectId: testProjectId,
					highlightType: "subject",
					colorHue: 230, // Blue hue
				},
			});

			// Get the enabled project index type
			const listResponse = await authenticatedRequest.inject({
				method: "GET",
				url: `/trpc/projectIndexType.list?input=${encodeURIComponent(JSON.stringify({ projectId: testProjectId }))}`,
			});

			const list = JSON.parse(listResponse.body).result.data;
			const pitId = list[0].id;

			const response = await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/projectIndexType.update",
				payload: {
					id: pitId,
					data: {
						colorHue: 180, // Cyan hue
					},
				},
			});

			expect(response.statusCode).toBe(200);
			const body = JSON.parse(response.body);
			expect(body.result.data.colorHue).toBe(180);
		});

		it("should update visibility", async ({
			authenticatedRequest,
			testProjectId,
		}) => {
			// Enable an index type first
			await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/projectIndexType.enable",
				payload: {
					projectId: testProjectId,
					highlightType: "subject",
					colorHue: 230, // Blue hue
				},
			});

			const listResponse = await authenticatedRequest.inject({
				method: "GET",
				url: `/trpc/projectIndexType.list?input=${encodeURIComponent(JSON.stringify({ projectId: testProjectId }))}`,
			});

			const list = JSON.parse(listResponse.body).result.data;
			const pitId = list[0].id;

			const response = await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/projectIndexType.update",
				payload: {
					id: pitId,
					data: {
						visible: false,
					},
				},
			});

			expect(response.statusCode).toBe(200);
			const body = JSON.parse(response.body);
			expect(body.result.data.visible).toBe(false);
		});
	});

	// Removed: reorder endpoint no longer exists (ordinal is now client-side concern)

	describe("POST /trpc/projectIndexType.disable", () => {
		it("should disable index type (soft delete)", async ({
			authenticatedRequest,
			testProjectId,
		}) => {
			// Enable an index type first
			await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/projectIndexType.enable",
				payload: {
					projectId: testProjectId,
					highlightType: "subject",
					colorHue: 230, // Blue hue
				},
			});

			const listResponse = await authenticatedRequest.inject({
				method: "GET",
				url: `/trpc/projectIndexType.list?input=${encodeURIComponent(JSON.stringify({ projectId: testProjectId }))}`,
			});

			const list = JSON.parse(listResponse.body).result.data;
			const pitId = list[0].id;

			const response = await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/projectIndexType.disable",
				payload: {
					id: pitId,
				},
			});

			expect(response.statusCode).toBe(200);

			// Verify it's no longer in list
			const newListResponse = await authenticatedRequest.inject({
				method: "GET",
				url: `/trpc/projectIndexType.list?input=${encodeURIComponent(JSON.stringify({ projectId: testProjectId }))}`,
			});

			const newList = JSON.parse(newListResponse.body).result.data;
			expect(
				newList.find((pit: { id: string }) => pit.id === pitId),
			).toBeUndefined();
		});
	});
});
