import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createAuthenticatedClient } from "../../db/client";
import type { createTestUser } from "../../test/factories";
import { createTestUser as _createTestUser } from "../../test/factories";
import {
	closeTestServer,
	createTestServer,
	makeAuthenticatedRequest,
} from "../../test/server-harness";

// ============================================================================
// Security & Authorization Test Suite
// Comprehensive tests for access control, data leakage prevention,
// and security regression testing.
// ============================================================================

type TestUser = Awaited<ReturnType<typeof createTestUser>>;

describe("Project Security & Authorization", () => {
	let server: FastifyInstance;

	beforeAll(async () => {
		server = await createTestServer();
	});

	afterAll(async () => {
		await closeTestServer(server);
	});

	// ============================================================================
	// Policy Test Harness
	// Helper to run operations as different users for testing access control
	// ============================================================================

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

	const createTestUser = () => _createTestUser();

	describe("Basic Access Control", () => {
		it("owner access - should allow owner to access their project", async () => {
			const owner = await createTestUser();

			// Create project
			const createResponse = await asUser({
				user: owner,
				operation: async (request) =>
					request.inject({
						method: "POST",
						url: "/trpc/project.create",
						payload: {
							title: "Owner's Project",
							project_dir: "owners-project",
						},
					}),
			});

			expect(createResponse.statusCode).toBe(200);
			const project = JSON.parse(createResponse.body).result.data;

			// Owner can read
			const getResponse = await asUser({
				user: owner,
				operation: async (request) =>
					request.inject({
						method: "GET",
						url: `/trpc/project.getById?input=${encodeURIComponent(JSON.stringify({ id: project.id }))}`,
					}),
			});

			expect(getResponse.statusCode).toBe(200);
			const data = JSON.parse(getResponse.body);
			expect(data.result.data.title).toBe("Owner's Project");
		});

		it("collaborator access - should allow collaborator to access project", async () => {
			const owner = await createTestUser();
			const collaborator = await createTestUser();

			// Owner creates project
			const createResponse = await asUser({
				user: owner,
				operation: async (request) =>
					request.inject({
						method: "POST",
						url: "/trpc/project.create",
						payload: {
							title: "Collaborative Project",
							project_dir: "collaborative-project",
						},
					}),
			});

			const project = JSON.parse(createResponse.body).result.data;

			// Add collaborator using direct DB access
			const ownerClient = createAuthenticatedClient({
				authToken: owner.authToken,
			});

			// Get collaborator's user ID from DB
			const collabUser = await ownerClient.querySingle<{ id: string }>(
				`SELECT User { id } FILTER .email = <str>$email`,
				{ email: collaborator.email },
			);

			await ownerClient.query(
				`
				UPDATE Project
				FILTER .id = <uuid>$projectId
				SET {
					collaborators += (SELECT User FILTER .id = <uuid>$collaboratorId)
				}
			`,
				{ projectId: project.id, collaboratorId: collabUser?.id },
			);

			// Collaborator can read
			const getResponse = await asUser({
				user: collaborator,
				operation: async (request) =>
					request.inject({
						method: "GET",
						url: `/trpc/project.getById?input=${encodeURIComponent(JSON.stringify({ id: project.id }))}`,
					}),
			});

			expect(getResponse.statusCode).toBe(200);
			const data = JSON.parse(getResponse.body);
			expect(data.result.data.title).toBe("Collaborative Project");
		});

		it("random user - should deny random user access to project", async () => {
			const owner = await createTestUser();
			const randomUser = await createTestUser();

			// Owner creates project
			const createResponse = await asUser({
				user: owner,
				operation: async (request) =>
					request.inject({
						method: "POST",
						url: "/trpc/project.create",
						payload: {
							title: "Private Project",
							project_dir: "private-project",
						},
					}),
			});

			const project = JSON.parse(createResponse.body).result.data;

			// Random user tries to access - should return 404 (not 403)
			const getResponse = await asUser({
				user: randomUser,
				operation: async (request) =>
					request.inject({
						method: "GET",
						url: `/trpc/project.getById?input=${encodeURIComponent(JSON.stringify({ id: project.id }))}`,
					}),
			});

			expect(getResponse.statusCode).toBe(404);
		});

		it("anonymous - should deny anonymous access to project", async () => {
			const owner = await createTestUser();
			const ownerRequest = makeAuthenticatedRequest({
				server,
				authToken: owner.authToken,
			});

			// Create project
			const createResponse = await ownerRequest.inject({
				method: "POST",
				url: "/trpc/project.create",
				payload: {
					title: "Private Project",
					project_dir: "private-project-anon",
				},
			});

			const project = JSON.parse(createResponse.body).result.data;

			// Try to access without auth token - should return 401
			const getResponse = await server.inject({
				method: "GET",
				url: `/trpc/project.getById?input=${encodeURIComponent(JSON.stringify({ id: project.id }))}`,
			});

			expect(getResponse.statusCode).toBe(401);
		});
	});

	describe("Deleted Projects", () => {
		it("deleted project - should hide deleted project from owner", async () => {
			const owner = await createTestUser();

			// Create project
			const createResponse = await asUser({
				user: owner,
				operation: async (request) =>
					request.inject({
						method: "POST",
						url: "/trpc/project.create",
						payload: { title: "To Be Deleted", project_dir: "to-be-deleted" },
					}),
			});

			const project = JSON.parse(createResponse.body).result.data;

			// Delete project
			const deleteResponse = await asUser({
				user: owner,
				operation: async (request) =>
					request.inject({
						method: "POST",
						url: "/trpc/project.delete",
						payload: { id: project.id },
					}),
			});

			expect(deleteResponse.statusCode).toBe(200);

			// Try to access deleted project - should return 404
			const getResponse = await asUser({
				user: owner,
				operation: async (request) =>
					request.inject({
						method: "GET",
						url: `/trpc/project.getById?input=${encodeURIComponent(JSON.stringify({ id: project.id }))}`,
					}),
			});

			expect(getResponse.statusCode).toBe(404);
		});

		it("should not list deleted projects", async () => {
			const owner = await createTestUser();

			// Create two projects
			await asUser({
				user: owner,
				operation: async (request) =>
					request.inject({
						method: "POST",
						url: "/trpc/project.create",
						payload: { title: "Active Project", project_dir: "active-project" },
					}),
			});

			const toDeleteResponse = await asUser({
				user: owner,
				operation: async (request) =>
					request.inject({
						method: "POST",
						url: "/trpc/project.create",
						payload: { title: "To Delete", project_dir: "to-delete" },
					}),
			});

			const toDelete = JSON.parse(toDeleteResponse.body).result.data;

			// Delete one project
			await asUser({
				user: owner,
				operation: async (request) =>
					request.inject({
						method: "POST",
						url: "/trpc/project.delete",
						payload: { id: toDelete.id },
					}),
			});

			// List projects
			const listResponse = await asUser({
				user: owner,
				operation: async (request) =>
					request.inject({
						method: "GET",
						url: "/trpc/project.list",
					}),
			});

			const projects = JSON.parse(listResponse.body).result.data;

			// Should only include active project
			expect(
				projects.some((p: { title: string }) => p.title === "Active Project"),
			).toBe(true);
			expect(
				projects.some((p: { title: string }) => p.title === "To Delete"),
			).toBe(false);
		});
	});

	describe("Cross-Project Access", () => {
		it("cross-project access - should deny update to other user's project", async () => {
			const owner = await createTestUser();
			const attacker = await createTestUser();

			// Owner creates project
			const createResponse = await asUser({
				user: owner,
				operation: async (request) =>
					request.inject({
						method: "POST",
						url: "/trpc/project.create",
						payload: {
							title: "Owner's Project",
							project_dir: "owners-project-update",
						},
					}),
			});

			const project = JSON.parse(createResponse.body).result.data;

			// Attacker tries to update - should return 404 (not 403)
			const updateResponse = await asUser({
				user: attacker,
				operation: async (request) =>
					request.inject({
						method: "POST",
						url: "/trpc/project.update",
						payload: {
							id: project.id,
							data: { title: "Hacked!" },
						},
					}),
			});

			expect(updateResponse.statusCode).toBe(404);

			// Verify project title unchanged
			const verifyResponse = await asUser({
				user: owner,
				operation: async (request) =>
					request.inject({
						method: "GET",
						url: `/trpc/project.getById?input=${encodeURIComponent(JSON.stringify({ id: project.id }))}`,
					}),
			});

			const verify = JSON.parse(verifyResponse.body).result.data;
			expect(verify.title).toBe("Owner's Project");
		});

		it("cross-project access - should deny delete to other user's project", async () => {
			const owner = await createTestUser();
			const attacker = await createTestUser();

			// Owner creates project
			const createResponse = await asUser({
				user: owner,
				operation: async (request) =>
					request.inject({
						method: "POST",
						url: "/trpc/project.create",
						payload: {
							title: "Owner's Project",
							project_dir: "owners-project-delete",
						},
					}),
			});

			const project = JSON.parse(createResponse.body).result.data;

			// Attacker tries to delete - should return 404 (not 403)
			const deleteResponse = await asUser({
				user: attacker,
				operation: async (request) =>
					request.inject({
						method: "POST",
						url: "/trpc/project.delete",
						payload: { id: project.id },
					}),
			});

			expect(deleteResponse.statusCode).toBe(404);

			// Verify project still exists
			const verifyResponse = await asUser({
				user: owner,
				operation: async (request) =>
					request.inject({
						method: "GET",
						url: `/trpc/project.getById?input=${encodeURIComponent(JSON.stringify({ id: project.id }))}`,
					}),
			});

			expect(verifyResponse.statusCode).toBe(200);
		});
	});

	describe("Collaborator Permissions", () => {
		it("collaborator write - should allow collaborator to update project", async () => {
			const owner = await createTestUser();
			const collaborator = await createTestUser();

			// Create project
			const createResponse = await asUser({
				user: owner,
				operation: async (request) =>
					request.inject({
						method: "POST",
						url: "/trpc/project.create",
						payload: {
							title: "Collaborative Project",
							project_dir: "collaborative-project-collab",
						},
					}),
			});

			const project = JSON.parse(createResponse.body).result.data;

			// Add collaborator
			const ownerClient = createAuthenticatedClient({
				authToken: owner.authToken,
			});

			// Get collaborator's user ID from DB
			const collabUser = await ownerClient.querySingle<{ id: string }>(
				`SELECT User { id } FILTER .email = <str>$email`,
				{ email: collaborator.email },
			);

			await ownerClient.query(
				`
				UPDATE Project
				FILTER .id = <uuid>$projectId
				SET {
					collaborators += (SELECT User FILTER .id = <uuid>$collaboratorId)
				}
			`,
				{ projectId: project.id, collaboratorId: collabUser?.id },
			);

			// Collaborator updates the project
			const updateResponse = await asUser({
				user: collaborator,
				operation: async (request) =>
					request.inject({
						method: "POST",
						url: "/trpc/project.update",
						payload: {
							id: project.id,
							data: { description: "Updated by collaborator" },
						},
					}),
			});

			expect(updateResponse.statusCode).toBe(200);

			// Verify update
			const verifyResponse = await asUser({
				user: owner,
				operation: async (request) =>
					request.inject({
						method: "GET",
						url: `/trpc/project.getById?input=${encodeURIComponent(JSON.stringify({ id: project.id }))}`,
					}),
			});

			const verify = JSON.parse(verifyResponse.body).result.data;
			expect(verify.description).toBe("Updated by collaborator");
		});

		it("should not allow non-collaborator to see project in list", async () => {
			const owner = await createTestUser();
			const randomUser = await createTestUser();

			// Owner creates project
			await asUser({
				user: owner,
				operation: async (request) =>
					request.inject({
						method: "POST",
						url: "/trpc/project.create",
						payload: {
							title: "Owner's Private Project",
							project_dir: "owners-private-project",
						},
					}),
			});

			// Random user lists their projects
			const listResponse = await asUser({
				user: randomUser,
				operation: async (request) =>
					request.inject({
						method: "GET",
						url: "/trpc/project.list",
					}),
			});

			const projects = JSON.parse(listResponse.body).result.data;

			// Should not see owner's project
			expect(
				projects.some(
					(p: { title: string }) => p.title === "Owner's Private Project",
				),
			).toBe(false);
		});
	});

	describe("Information Leakage Prevention", () => {
		it("should return 404 (not 403) for unauthorized access", async () => {
			const owner = await createTestUser();
			const attacker = await createTestUser();

			// Create project
			const createResponse = await asUser({
				user: owner,
				operation: async (request) =>
					request.inject({
						method: "POST",
						url: "/trpc/project.create",
						payload: { title: "Secret Project", project_dir: "secret-project" },
					}),
			});

			const project = JSON.parse(createResponse.body).result.data;

			// Attacker tries to access
			const response = await asUser({
				user: attacker,
				operation: async (request) =>
					request.inject({
						method: "GET",
						url: `/trpc/project.getById?input=${encodeURIComponent(JSON.stringify({ id: project.id }))}`,
					}),
			});

			// Critical: Must return 404, NOT 403
			// This prevents attackers from enumerating existing projects
			expect(response.statusCode).toBe(404);
			expect(response.statusCode).not.toBe(403);
		});

		it("should return same 404 for non-existent project ID", async () => {
			const user = await createTestUser();

			const fakeId = "00000000-0000-0000-0000-000000000000";

			const response = await asUser({
				user,
				operation: async (request) =>
					request.inject({
						method: "GET",
						url: `/trpc/project.getById?input=${encodeURIComponent(JSON.stringify({ id: fakeId }))}`,
					}),
			});

			// Same 404 response as unauthorized access
			// Attacker can't tell difference between "doesn't exist" and "forbidden"
			expect(response.statusCode).toBe(404);
		});

		it("should return same 404 for deleted project", async () => {
			const owner = await createTestUser();
			const attacker = await createTestUser();

			// Create and delete project
			const createResponse = await asUser({
				user: owner,
				operation: async (request) =>
					request.inject({
						method: "POST",
						url: "/trpc/project.create",
						payload: {
							title: "To Delete",
							project_dir: "to-delete-info-leak",
						},
					}),
			});

			const project = JSON.parse(createResponse.body).result.data;

			await asUser({
				user: owner,
				operation: async (request) =>
					request.inject({
						method: "POST",
						url: "/trpc/project.delete",
						payload: { id: project.id },
					}),
			});

			// Attacker tries to access deleted project
			const response = await asUser({
				user: attacker,
				operation: async (request) =>
					request.inject({
						method: "GET",
						url: `/trpc/project.getById?input=${encodeURIComponent(JSON.stringify({ id: project.id }))}`,
					}),
			});

			// Same 404 - can't tell if deleted, forbidden, or non-existent
			expect(response.statusCode).toBe(404);
		});
	});

	describe("Security Regression Tests", () => {
		it("should enforce access policies even with valid IDs", async () => {
			const owner = await createTestUser();
			const attacker = await createTestUser();

			// Create project
			const createResponse = await asUser({
				user: owner,
				operation: async (request) =>
					request.inject({
						method: "POST",
						url: "/trpc/project.create",
						payload: {
							title: "Protected Project",
							project_dir: "protected-project",
						},
					}),
			});

			const project = JSON.parse(createResponse.body).result.data;

			// Attacker knows the valid UUID but should still be blocked
			const response = await asUser({
				user: attacker,
				operation: async (request) =>
					request.inject({
						method: "GET",
						url: `/trpc/project.getById?input=${encodeURIComponent(JSON.stringify({ id: project.id }))}`,
					}),
			});

			expect(response.statusCode).toBe(404);
		});

		it("should not leak project existence through different error codes", async () => {
			const owner = await createTestUser();
			const attacker = await createTestUser();

			// Create project
			const createResponse = await asUser({
				user: owner,
				operation: async (request) =>
					request.inject({
						method: "POST",
						url: "/trpc/project.create",
						payload: {
							title: "Secret Project",
							project_dir: "secret-project-codes",
						},
					}),
			});

			const existingId = JSON.parse(createResponse.body).result.data.id;
			const nonExistentId = "00000000-0000-0000-0000-000000000000";

			// Get status codes for both
			const existingResponse = await asUser({
				user: attacker,
				operation: async (request) =>
					request.inject({
						method: "GET",
						url: `/trpc/project.getById?input=${encodeURIComponent(JSON.stringify({ id: existingId }))}`,
					}),
			});

			const nonExistentResponse = await asUser({
				user: attacker,
				operation: async (request) =>
					request.inject({
						method: "GET",
						url: `/trpc/project.getById?input=${encodeURIComponent(JSON.stringify({ id: nonExistentId }))}`,
					}),
			});

			// Both should return 404 - same error code
			expect(existingResponse.statusCode).toBe(404);
			expect(nonExistentResponse.statusCode).toBe(404);
			expect(existingResponse.statusCode).toBe(nonExistentResponse.statusCode);
		});
	});
});
