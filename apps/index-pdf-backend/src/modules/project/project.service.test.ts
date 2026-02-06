import { beforeEach, describe, expect, it } from "vitest";
import { createTestProject, createTestUser } from "../../test/factories";
import { FAKE_UUID } from "../../test/mocks";
import * as projectService from "./project.service";

// ============================================================================
// Domain / Service Layer Tests
// ============================================================================

describe("Project Service", () => {
	let testUser: Awaited<ReturnType<typeof createTestUser>>;

	beforeEach(async () => {
		// Recreate user before each test (global afterEach deletes all data)
		testUser = await createTestUser();
	});

	describe("createProject", () => {
		it("should create a new project", async () => {
			const input = {
				title: "My Test Book",
				description: "A comprehensive guide to testing",
				project_dir: "my-test-book",
			};

			const project = await projectService.createProject({
				input,
				userId: testUser.userId,
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
				project_dir: "minimal-project",
			};

			const project = await projectService.createProject({
				input,
				userId: testUser.userId,
				requestId: "test-request",
			});

			expect(project).toBeDefined();
			expect(project.title).toBe(input.title);
			expect(project.description).toBeNull();
		});
	});

	describe("listProjectsForUser", () => {
		it("should list user's projects", async () => {
			await createTestProject({ userId: testUser.userId, title: "Project 1" });
			await createTestProject({ userId: testUser.userId, title: "Project 2" });

			const projects = await projectService.listProjectsForUser({
				userId: testUser.userId,
				requestId: "test-request",
			});

			expect(projects.length).toBeGreaterThanOrEqual(2);
			expect(projects.every((p) => p.title)).toBe(true);
		});

		it("should not list deleted projects", async () => {
			const project = await createTestProject({
				userId: testUser.userId,
				title: "To Be Deleted",
			});

			await projectService.deleteProject({
				projectId: project.id,
				userId: testUser.userId,
				requestId: "test-request",
			});

			const projects = await projectService.listProjectsForUser({
				userId: testUser.userId,
				requestId: "test-request",
			});

			expect(projects.find((p) => p.id === project.id)).toBeUndefined();
		});
	});

	describe("getProjectById", () => {
		it("should retrieve project by id", async () => {
			const created = await createTestProject({
				userId: testUser.userId,
				title: "Retrieve Test",
			});

			const project = await projectService.getProjectById({
				projectId: created.id,
				userId: testUser.userId,
				requestId: "test-request",
			});

			expect(project).toBeDefined();
			expect(project.id).toBe(created.id);
			expect(project.title).toBe("Retrieve Test");
		});

		it("should throw TRPCError NOT_FOUND for non-existent project", async () => {
			await expect(
				projectService.getProjectById({
					projectId: FAKE_UUID,
					userId: testUser.userId,
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
				userId: testUser.userId,
				title: "Original Title",
			});

			const updated = await projectService.updateProject({
				projectId: project.id,
				input: { title: "Updated Title" },
				userId: testUser.userId,
				requestId: "test-request",
			});

			expect(updated.title).toBe("Updated Title");
			expect(updated.id).toBe(project.id);
		});
	});

	describe("deleteProject", () => {
		it("should soft delete project", async () => {
			const project = await createTestProject({
				userId: testUser.userId,
				title: "To Delete",
			});

			await projectService.deleteProject({
				projectId: project.id,
				userId: testUser.userId,
				requestId: "test-request",
			});

			// Verify project is not in active list
			const projects = await projectService.listProjectsForUser({
				userId: testUser.userId,
				requestId: "test-request",
			});

			expect(projects.find((p) => p.id === project.id)).toBeUndefined();
		});
	});
});
