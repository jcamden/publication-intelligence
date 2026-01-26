import { beforeAll, describe, expect, it } from "vitest";
import { createAuthenticatedClient } from "../../db/client";
import { createTestProject, createTestUser } from "../../test/factories";
import * as projectService from "./project.service";

// ============================================================================
// Domain / Service Layer Tests
// ============================================================================

describe("Project Service", () => {
	let testUser: Awaited<ReturnType<typeof createTestUser>>;
	let gelClient: ReturnType<typeof createAuthenticatedClient>;

	beforeAll(async () => {
		testUser = await createTestUser();
		gelClient = createAuthenticatedClient({ authToken: testUser.authToken });
	});

	// Note: Cleanup handled by branch reset (see reset-test-branch.sh)

	describe("createProject", () => {
		it("should create a new project", async () => {
			const input = {
				title: "My Test Book",
				description: "A comprehensive guide to testing",
			};

			const project = await projectService.createProject({
				gelClient,
				input,
				userId: "test-user-id",
				requestId: "test-request",
			});

			expect(project).toBeDefined();
			expect(project.id).toBeDefined();
			expect(project.title).toBe(input.title);
			expect(project.description).toBe(input.description);
			expect(project.deleted_at).toBeNull();
		});

		it("should create project without description", async () => {
			const input = {
				title: "Minimal Project",
			};

			const project = await projectService.createProject({
				gelClient,
				input,
				userId: "test-user-id",
				requestId: "test-request",
			});

			expect(project).toBeDefined();
			expect(project.title).toBe(input.title);
			expect(project.description).toBeNull();
		});

		it("should emit event on creation", async () => {
			const input = {
				title: "Event Test Project",
			};

			const project = await projectService.createProject({
				gelClient,
				input,
				userId: "test-user-id",
				requestId: "test-request",
			});

			const events = await gelClient.query<{
				entity_id: string;
				action: string;
			}>(
				`
				SELECT Event {
					entity_id,
					action
				}
				FILTER .entity_id = <uuid>$projectId
			`,
				{ projectId: project.id },
			);

			expect(events).toHaveLength(1);
			expect(events[0].action).toBe("created");
		});
	});

	describe("listProjectsForUser", () => {
		it("should list user's projects", async () => {
			await createTestProject({ gelClient, title: "Project 1" });
			await createTestProject({ gelClient, title: "Project 2" });

			const projects = await projectService.listProjectsForUser({
				gelClient,
				userId: "test-user-id",
				requestId: "test-request",
			});

			expect(projects.length).toBeGreaterThanOrEqual(2);
			expect(projects.every((p) => p.title)).toBe(true);
		});

		it("should not list deleted projects", async () => {
			const project = await createTestProject({
				gelClient,
				title: "To Be Deleted",
			});

			await projectService.deleteProject({
				gelClient,
				projectId: project.id,
				userId: "test-user-id",
				requestId: "test-request",
			});

			const projects = await projectService.listProjectsForUser({
				gelClient,
				userId: "test-user-id",
				requestId: "test-request",
			});

			expect(projects.find((p) => p.id === project.id)).toBeUndefined();
		});
	});

	describe("getProjectById", () => {
		it("should retrieve project by id", async () => {
			const created = await createTestProject({
				gelClient,
				title: "Retrieve Test",
			});

			const project = await projectService.getProjectById({
				gelClient,
				projectId: created.id,
				userId: "test-user-id",
				requestId: "test-request",
			});

			expect(project).toBeDefined();
			expect(project.id).toBe(created.id);
			expect(project.title).toBe("Retrieve Test");
		});

		it("should throw TRPCError NOT_FOUND for non-existent project", async () => {
			const fakeId = "00000000-0000-0000-0000-000000000000";

			await expect(
				projectService.getProjectById({
					gelClient,
					projectId: fakeId,
					userId: "test-user-id",
					requestId: "test-request",
				}),
			).rejects.toMatchObject({
				code: "NOT_FOUND",
				message: "Resource not found",
			});
		});
	});

	describe("updateProject", () => {
		it("should update project title", async () => {
			const project = await createTestProject({
				gelClient,
				title: "Original Title",
			});

			const updated = await projectService.updateProject({
				gelClient,
				projectId: project.id,
				input: { title: "Updated Title" },
				userId: "test-user-id",
				requestId: "test-request",
			});

			expect(updated.title).toBe("Updated Title");
			expect(updated.id).toBe(project.id);
		});

		it("should emit event on update", async () => {
			const project = await createTestProject({
				gelClient,
				title: "Update Event Test",
			});

			await projectService.updateProject({
				gelClient,
				projectId: project.id,
				input: { description: "New description" },
				userId: "test-user-id",
				requestId: "test-request",
			});

			const events = await gelClient.query<{
				action: string;
			}>(
				`
				SELECT Event {
					action
				}
				FILTER .entity_id = <uuid>$projectId
				ORDER BY .created_at DESC
			`,
				{ projectId: project.id },
			);

			expect(events.some((e) => e.action === "updated")).toBe(true);
		});
	});

	describe("deleteProject", () => {
		it("should soft delete project", async () => {
			const project = await createTestProject({
				gelClient,
				title: "To Delete",
			});

			await projectService.deleteProject({
				gelClient,
				projectId: project.id,
				userId: "test-user-id",
				requestId: "test-request",
			});

			const deleted = await gelClient.querySingle<{
				id: string;
				deleted_at: Date | null;
			}>(
				`
				SELECT Project {
					id,
					deleted_at
				}
				FILTER .id = <uuid>$id
			`,
				{ id: project.id },
			);

			expect(deleted?.deleted_at).not.toBeNull();
		});

		it("should emit event on deletion", async () => {
			const project = await createTestProject({
				gelClient,
				title: "Delete Event Test",
			});

			await projectService.deleteProject({
				gelClient,
				projectId: project.id,
				userId: "test-user-id",
				requestId: "test-request",
			});

			const events = await gelClient.query<{
				action: string;
			}>(
				`
				SELECT Event {
					action
				}
				FILTER .entity_id = <uuid>$projectId
				ORDER BY .created_at DESC
			`,
				{ projectId: project.id },
			);

			expect(events.some((e) => e.action === "deleted")).toBe(true);
		});
	});
});
