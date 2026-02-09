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
// Security & Authorization Test Suite for ProjectIndexType
// Tests addon-based access control and data isolation
// ============================================================================

type TestUser = Awaited<ReturnType<typeof createTestUser>>;

describe("ProjectIndexType Security & Authorization", () => {
	let server: FastifyInstance;

	beforeEach(async () => {
		server = await createTestServer();
	});

	afterEach(async () => {
		await closeTestServer(server);
	});

	const asUser = async <T>({
		user,
		operation,
	}: {
		user: TestUser;
		operation: (
			request: ReturnType<typeof makeAuthenticatedRequest>,
		) => Promise<T>;
	}): Promise<T> => {
		const authenticatedRequest = makeAuthenticatedRequest({
			server,
			authToken: user.authToken,
		});
		return await operation(authenticatedRequest);
	};

	describe("Addon-Based Access Control", () => {
		it("should prevent enabling index type without addon", async () => {
			const owner = await createTestUser();

			// Create project
			const project = await createTestProject({ userId: owner.userId });

			// Try to enable scripture without addon
			const response = await asUser({
				user: owner,
				operation: async (request) =>
					request.inject({
						method: "POST",
						url: "/trpc/projectIndexType.enable",
						payload: {
							projectId: project.id,
							indexType: "scripture",
							colorHue: 160, // Green hue
						},
					}),
			});

			expect(response.statusCode).toBe(403);
			const body = JSON.parse(response.body);
			expect(body.error.message).toContain("do not have access");
		});

		it("should allow enabling index type with addon", async () => {
			const owner = await createTestUser();

			// Create project
			const project = await createTestProject({ userId: owner.userId });

			// Grant addon
			await grantIndexTypeAddon({
				userId: owner.userId,
				indexType: "subject",
			});

			// Now enabling should succeed
			const response = await asUser({
				user: owner,
				operation: async (request) =>
					request.inject({
						method: "POST",
						url: "/trpc/projectIndexType.enable",
						payload: {
							projectId: project.id,
							indexType: "subject",
							colorHue: 230, // Blue hue
						},
					}),
			});

			expect(response.statusCode).toBe(200);
		});
	});

	describe("Addon Expiration", () => {
		it("should prevent access with expired addon", async () => {
			const owner = await createTestUser();

			// Create project
			const project = await createTestProject({ userId: owner.userId });

			// Grant expired addon for scripture (expired 1 day ago)
			// Note: User already has non-expired "subject" addon from createTestUser
			const yesterday = new Date();
			yesterday.setDate(yesterday.getDate() - 1);

			await grantIndexTypeAddon({
				userId: owner.userId,
				indexType: "scripture",
				expiresAt: yesterday,
			});

			// Try to enable with expired addon
			const response = await asUser({
				user: owner,
				operation: async (request) =>
					request.inject({
						method: "POST",
						url: "/trpc/projectIndexType.enable",
						payload: {
							projectId: project.id,
							indexType: "scripture",
							colorHue: 160, // Green hue
						},
					}),
			});

			expect(response.statusCode).toBe(403);
		});
	});

	describe("Data Isolation", () => {
		it("should not list other users' available index types", async () => {
			const user1 = await createTestUser();
			const user2 = await createTestUser();

			// Create project for user1
			const project = await createTestProject({ userId: user1.userId });

			// Grant subject to user1, author to user2
			await grantIndexTypeAddon({
				userId: user1.userId,
				indexType: "subject",
			});

			await grantIndexTypeAddon({
				userId: user2.userId,
				indexType: "author",
			});

			// User1 should only see subject
			const response = await asUser({
				user: user1,
				operation: async (request) =>
					request.inject({
						method: "GET",
						url: `/trpc/projectIndexType.listAvailable?input=${encodeURIComponent(JSON.stringify({ projectId: project.id }))}`,
					}),
			});

			expect(response.statusCode).toBe(200);
			const body = JSON.parse(response.body);
			expect(body.result.data.length).toBe(1);
			expect(body.result.data[0].indexType).toBe("subject");
		});
	});
});
