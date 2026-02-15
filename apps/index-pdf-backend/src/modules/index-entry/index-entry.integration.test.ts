import "../../test/setup";
import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
	createTestIndexEntry,
	createTestIndexMention,
	createTestProject,
	createTestProjectIndexType,
	createTestSourceDocument,
	createTestUser,
	grantIndexTypeAddon,
} from "../../test/factories";
import {
	closeTestServer,
	createTestServer,
	makeAuthenticatedRequest,
} from "../../test/server-harness";
import type { IndexEntrySearchResult, IndexMatcher } from "./index-entry.types";

// ============================================================================
// API / Integration Tests for IndexEntry
// ============================================================================

// Extend test context to include server and test data
declare module "vitest" {
	export interface TestContext {
		server: FastifyInstance;
		testUser: Awaited<ReturnType<typeof createTestUser>>;
		authenticatedRequest: ReturnType<typeof makeAuthenticatedRequest>;
		testProjectId: string;
		subjectIndexTypeId: string;
		authorIndexTypeId: string;
	}
}

describe("IndexEntry API (Integration)", () => {
	beforeEach(async (context) => {
		// Create server with test-specific database
		// context.testDb is set by setup.ts beforeEach, which runs first
		context.server = await createTestServer();

		// Create user for authenticated tests
		// Factories will use module-level override (set by setup.ts beforeEach)
		context.testUser = await createTestUser();
		context.authenticatedRequest = makeAuthenticatedRequest({
			server: context.server,
			authToken: context.testUser.authToken,
		});

		const project = await createTestProject({
			userId: context.testUser.userId,
		});
		context.testProjectId = project.id;

		await grantIndexTypeAddon({
			userId: context.testUser.userId,
			indexType: "subject",
		});

		await grantIndexTypeAddon({
			userId: context.testUser.userId,
			indexType: "author",
		});

		const subjectIndexType = await createTestProjectIndexType({
			projectId: context.testProjectId,
			indexType: "subject",
			userId: context.testUser.userId,
		});
		context.subjectIndexTypeId = subjectIndexType.id;

		const authorIndexType = await createTestProjectIndexType({
			projectId: context.testProjectId,
			indexType: "author",
			userId: context.testUser.userId,
		});
		context.authorIndexTypeId = authorIndexType.id;
	});

	afterEach(async (context) => {
		await closeTestServer(context.server);
	});

	describe("POST /trpc/indexEntry.create", () => {
		it("should create a new index entry", async ({
			authenticatedRequest,
			testProjectId,
			subjectIndexTypeId,
		}) => {
			const response = await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/indexEntry.create",
				payload: {
					projectId: testProjectId,
					projectIndexTypeId: subjectIndexTypeId,
					label: "Theology",
					slug: "theology",
					description: "Study of religious faith",
				},
			});

			expect(response.statusCode).toBe(200);
			const body = JSON.parse(response.body);
			expect(body.result.data.label).toBe("Theology");
			expect(body.result.data.slug).toBe("theology");
			expect(body.result.data.description).toBe("Study of religious faith");
			expect(body.result.data.projectIndexTypeId).toBe(subjectIndexTypeId);
		});

		it("should create entry with matchers (aliases)", async ({
			authenticatedRequest,
			testProjectId,
			subjectIndexTypeId,
		}) => {
			const response = await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/indexEntry.create",
				payload: {
					projectId: testProjectId,
					projectIndexTypeId: subjectIndexTypeId,
					label: "Christology",
					slug: "christology",
					matchers: ["Christ", "Jesus Christ", "The Messiah"],
				},
			});

			expect(response.statusCode).toBe(200);
			const body = JSON.parse(response.body);
			expect(body.result.data.label).toBe("Christology");
			expect(body.result.data.matchers).toHaveLength(3);
			expect(
				body.result.data.matchers.map((v: IndexMatcher) => v.text),
			).toEqual(["Christ", "Jesus Christ", "The Messiah"]);
		});

		it("should create entry with parent", async ({
			testUser,
			authenticatedRequest,
			testProjectId,
			subjectIndexTypeId,
		}) => {
			const parent = await createTestIndexEntry({
				projectId: testProjectId,
				projectIndexTypeId: subjectIndexTypeId,
				label: "Theology",
				slug: "theology",
				userId: testUser.userId,
			});

			const response = await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/indexEntry.create",
				payload: {
					projectId: testProjectId,
					projectIndexTypeId: subjectIndexTypeId,
					label: "Systematic Theology",
					slug: "systematic-theology",
					parentId: parent.id,
				},
			});

			expect(response.statusCode).toBe(200);
			const body = JSON.parse(response.body);
			expect(body.result.data.parentId).toBe(parent.id);
		});

		it("should reject parent from different index type", async ({
			testUser,
			authenticatedRequest,
			testProjectId,
			subjectIndexTypeId,
			authorIndexTypeId,
		}) => {
			const authorEntry = await createTestIndexEntry({
				projectId: testProjectId,
				projectIndexTypeId: authorIndexTypeId,
				label: "John Calvin",
				slug: "john-calvin",
				userId: testUser.userId,
			});

			const response = await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/indexEntry.create",
				payload: {
					projectId: testProjectId,
					projectIndexTypeId: subjectIndexTypeId,
					label: "Systematic Theology",
					slug: "systematic-theology",
					parentId: authorEntry.id,
				},
			});

			expect(response.statusCode).toBe(400);
			const body = JSON.parse(response.body);
			expect(body.error.message).toContain("same index type");
		});

		it("should require authentication", async ({
			server,
			testProjectId,
			subjectIndexTypeId,
		}) => {
			const response = await server.inject({
				method: "POST",
				url: "/trpc/indexEntry.create",
				payload: {
					projectId: testProjectId,
					projectIndexTypeId: subjectIndexTypeId,
					label: "Theology",
					slug: "theology",
				},
			});

			expect(response.statusCode).toBe(401);
		});
	});

	describe("GET /trpc/indexEntry.list", () => {
		it("should list all entries for a project", async ({
			testUser,
			authenticatedRequest,
			testProjectId,
			subjectIndexTypeId,
		}) => {
			await createTestIndexEntry({
				projectId: testProjectId,
				projectIndexTypeId: subjectIndexTypeId,
				label: "Theology",
				slug: "theology",
				userId: testUser.userId,
			});

			await createTestIndexEntry({
				projectId: testProjectId,
				projectIndexTypeId: subjectIndexTypeId,
				label: "Christology",
				slug: "christology",
				userId: testUser.userId,
			});

			const response = await authenticatedRequest.inject({
				method: "GET",
				url: `/trpc/indexEntry.list?input=${encodeURIComponent(JSON.stringify({ projectId: testProjectId }))}`,
			});

			expect(response.statusCode).toBe(200);
			const body = JSON.parse(response.body);
			expect(body.result.data).toHaveLength(2);
		});

		it("should filter by index type", async ({
			testUser,
			authenticatedRequest,
			testProjectId,
			subjectIndexTypeId,
			authorIndexTypeId,
		}) => {
			await createTestIndexEntry({
				projectId: testProjectId,
				projectIndexTypeId: subjectIndexTypeId,
				label: "Theology",
				slug: "theology",
				userId: testUser.userId,
			});

			await createTestIndexEntry({
				projectId: testProjectId,
				projectIndexTypeId: authorIndexTypeId,
				label: "John Calvin",
				slug: "john-calvin",
				userId: testUser.userId,
			});

			const response = await authenticatedRequest.inject({
				method: "GET",
				url: `/trpc/indexEntry.list?input=${encodeURIComponent(JSON.stringify({ projectId: testProjectId, projectIndexTypeId: subjectIndexTypeId }))}`,
			});

			expect(response.statusCode).toBe(200);
			const body = JSON.parse(response.body);
			expect(body.result.data).toHaveLength(1);
			expect(body.result.data[0].label).toBe("Theology");
		});

		it("should exclude deleted entries by default", async ({
			testUser,
			authenticatedRequest,
			testProjectId,
			subjectIndexTypeId,
		}) => {
			const entry = await createTestIndexEntry({
				projectId: testProjectId,
				projectIndexTypeId: subjectIndexTypeId,
				label: "Theology",
				slug: "theology",
				userId: testUser.userId,
			});

			await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/indexEntry.delete",
				payload: {
					id: entry.id,
					projectId: testProjectId,
					projectIndexTypeId: subjectIndexTypeId,
				},
			});

			const response = await authenticatedRequest.inject({
				method: "GET",
				url: `/trpc/indexEntry.list?input=${encodeURIComponent(JSON.stringify({ projectId: testProjectId }))}`,
			});

			expect(response.statusCode).toBe(200);
			const body = JSON.parse(response.body);
			expect(body.result.data).toHaveLength(0);
		});

		it("should include deleted entries when requested", async ({
			testUser,
			authenticatedRequest,
			testProjectId,
			subjectIndexTypeId,
		}) => {
			const entry = await createTestIndexEntry({
				projectId: testProjectId,
				projectIndexTypeId: subjectIndexTypeId,
				label: "Theology",
				slug: "theology",
				userId: testUser.userId,
			});

			await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/indexEntry.delete",
				payload: {
					id: entry.id,
				},
			});

			const response = await authenticatedRequest.inject({
				method: "GET",
				url: `/trpc/indexEntry.list?input=${encodeURIComponent(JSON.stringify({ projectId: testProjectId, includeDeleted: true }))}`,
			});

			expect(response.statusCode).toBe(200);
			const body = JSON.parse(response.body);
			expect(body.result.data).toHaveLength(1);
		});
	});

	describe("POST /trpc/indexEntry.update", () => {
		it("should update entry label", async ({
			testUser,
			authenticatedRequest,
			testProjectId,
			subjectIndexTypeId,
		}) => {
			const entry = await createTestIndexEntry({
				projectId: testProjectId,
				projectIndexTypeId: subjectIndexTypeId,
				label: "Theology",
				slug: "theology",
				userId: testUser.userId,
			});

			const response = await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/indexEntry.update",
				payload: {
					id: entry.id,
					projectId: testProjectId,
					projectIndexTypeId: subjectIndexTypeId,
					label: "Systematic Theology",
				},
			});

			expect(response.statusCode).toBe(200);
			const body = JSON.parse(response.body);
			expect(body.result.data.label).toBe("Systematic Theology");
			expect(body.result.data.revision).toBe(2);
		});

		it("should update matchers", async ({
			testUser,
			authenticatedRequest,
			testProjectId,
			subjectIndexTypeId,
		}) => {
			const entry = await createTestIndexEntry({
				projectId: testProjectId,
				projectIndexTypeId: subjectIndexTypeId,
				label: "Christology",
				slug: "christology",
				userId: testUser.userId,
				matchers: ["Christ"],
			});

			const response = await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/indexEntry.update",
				payload: {
					id: entry.id,
					projectId: testProjectId,
					projectIndexTypeId: subjectIndexTypeId,
					matchers: ["Christ", "Jesus", "The Messiah"],
				},
			});

			expect(response.statusCode).toBe(200);
			const body = JSON.parse(response.body);
			expect(body.result.data.matchers).toHaveLength(3);
			expect(
				body.result.data.matchers.map((v: IndexMatcher) => v.text),
			).toEqual(["Christ", "Jesus", "The Messiah"]);
		});

		it("should not change slug", async ({
			testUser,
			authenticatedRequest,
			testProjectId,
			subjectIndexTypeId,
		}) => {
			const entry = await createTestIndexEntry({
				projectId: testProjectId,
				projectIndexTypeId: subjectIndexTypeId,
				label: "Theology",
				slug: "theology",
				userId: testUser.userId,
			});

			const response = await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/indexEntry.update",
				payload: {
					id: entry.id,
					projectId: testProjectId,
					projectIndexTypeId: subjectIndexTypeId,
					label: "Systematic Theology",
				},
			});

			expect(response.statusCode).toBe(200);
			const body = JSON.parse(response.body);
			expect(body.result.data.slug).toBe("theology");
		});
	});

	describe("POST /trpc/indexEntry.updateParent", () => {
		it("should update entry parent", async ({
			testUser,
			authenticatedRequest,
			testProjectId,
			subjectIndexTypeId,
		}) => {
			const parent = await createTestIndexEntry({
				projectId: testProjectId,
				projectIndexTypeId: subjectIndexTypeId,
				label: "Theology",
				slug: "theology",
				userId: testUser.userId,
			});

			const entry = await createTestIndexEntry({
				projectId: testProjectId,
				projectIndexTypeId: subjectIndexTypeId,
				label: "Christology",
				slug: "christology",
				userId: testUser.userId,
			});

			const response = await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/indexEntry.updateParent",
				payload: {
					id: entry.id,
					parentId: parent.id,
				},
			});

			expect(response.statusCode).toBe(200);
			const body = JSON.parse(response.body);
			expect(body.result.data.parentId).toBe(parent.id);
		});

		it("should detect cycles", async ({
			testUser,
			authenticatedRequest,
			testProjectId,
			subjectIndexTypeId,
		}) => {
			const grandparent = await createTestIndexEntry({
				projectId: testProjectId,
				projectIndexTypeId: subjectIndexTypeId,
				label: "Theology",
				slug: "theology",
				userId: testUser.userId,
			});

			const parent = await createTestIndexEntry({
				projectId: testProjectId,
				projectIndexTypeId: subjectIndexTypeId,
				label: "Systematic Theology",
				slug: "systematic-theology",
				userId: testUser.userId,
				parentId: grandparent.id,
			});

			const child = await createTestIndexEntry({
				projectId: testProjectId,
				projectIndexTypeId: subjectIndexTypeId,
				label: "Christology",
				slug: "christology",
				userId: testUser.userId,
				parentId: parent.id,
			});

			const response = await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/indexEntry.updateParent",
				payload: {
					id: grandparent.id,
					parentId: child.id,
				},
			});

			expect(response.statusCode).toBe(400);
			const body = JSON.parse(response.body);
			expect(body.error.message).toContain("cycle");
		});

		it("should enforce max depth", async ({
			testUser,
			authenticatedRequest,
			testProjectId,
			subjectIndexTypeId,
		}) => {
			let currentParentId: string | undefined;

			for (let i = 0; i < 5; i++) {
				const entry = await createTestIndexEntry({
					projectId: testProjectId,
					projectIndexTypeId: subjectIndexTypeId,
					label: `Level ${i}`,
					slug: `level-${i}`,
					userId: testUser.userId,
					parentId: currentParentId,
				});
				currentParentId = entry.id;
			}

			const tooDeep = await createTestIndexEntry({
				projectId: testProjectId,
				projectIndexTypeId: subjectIndexTypeId,
				label: "Too Deep",
				slug: "too-deep",
				userId: testUser.userId,
			});

			const response = await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/indexEntry.updateParent",
				payload: {
					id: tooDeep.id,
					parentId: currentParentId,
				},
			});

			expect(response.statusCode).toBe(400);
			const body = JSON.parse(response.body);
			expect(body.error.message).toContain("depth");
		});
	});

	describe("GET /trpc/indexEntry.search", () => {
		beforeEach(async ({ testProjectId, subjectIndexTypeId, testUser }) => {
			await createTestIndexEntry({
				projectId: testProjectId,
				projectIndexTypeId: subjectIndexTypeId,
				label: "Theology",
				slug: "theology",
				userId: testUser.userId,
			});

			await createTestIndexEntry({
				projectId: testProjectId,
				projectIndexTypeId: subjectIndexTypeId,
				label: "Christology",
				slug: "christology",
				userId: testUser.userId,
				matchers: ["Christ", "Jesus Christ"],
			});

			await createTestIndexEntry({
				projectId: testProjectId,
				projectIndexTypeId: subjectIndexTypeId,
				label: "Soteriology",
				slug: "soteriology",
				userId: testUser.userId,
			});
		});

		it("should search by label", async ({
			authenticatedRequest,
			testProjectId,
			subjectIndexTypeId,
		}) => {
			const response = await authenticatedRequest.inject({
				method: "GET",
				url: `/trpc/indexEntry.search?input=${encodeURIComponent(JSON.stringify({ projectId: testProjectId, projectIndexTypeId: subjectIndexTypeId, query: "theo" }))}`,
			});

			expect(response.statusCode).toBe(200);
			const body = JSON.parse(response.body);
			expect(body.result.data.length).toBeGreaterThanOrEqual(1);
			expect(body.result.data[0].label).toContain("Theology");
		});

		it("should search by matcher", async ({
			authenticatedRequest,
			testProjectId,
			subjectIndexTypeId,
		}) => {
			const response = await authenticatedRequest.inject({
				method: "GET",
				url: `/trpc/indexEntry.search?input=${encodeURIComponent(JSON.stringify({ projectId: testProjectId, projectIndexTypeId: subjectIndexTypeId, query: "Christ" }))}`,
			});

			expect(response.statusCode).toBe(200);
			const body = JSON.parse(response.body);
			expect(body.result.data.length).toBeGreaterThanOrEqual(1);
			const christologyEntry = body.result.data.find(
				(e: IndexEntrySearchResult) => e.label === "Christology",
			);
			expect(christologyEntry).toBeDefined();
		});

		it("should respect limit", async ({
			authenticatedRequest,
			testProjectId,
			subjectIndexTypeId,
		}) => {
			const response = await authenticatedRequest.inject({
				method: "GET",
				url: `/trpc/indexEntry.search?input=${encodeURIComponent(JSON.stringify({ projectId: testProjectId, projectIndexTypeId: subjectIndexTypeId, query: "ology", limit: 2 }))}`,
			});

			expect(response.statusCode).toBe(200);
			const body = JSON.parse(response.body);
			expect(body.result.data.length).toBeLessThanOrEqual(2);
		});
	});

	describe("GET /trpc/indexEntry.checkExactMatch", () => {
		beforeEach(async ({ testProjectId, subjectIndexTypeId, testUser }) => {
			await createTestIndexEntry({
				projectId: testProjectId,
				projectIndexTypeId: subjectIndexTypeId,
				label: "Theology",
				slug: "theology",
				userId: testUser.userId,
			});

			await createTestIndexEntry({
				projectId: testProjectId,
				projectIndexTypeId: subjectIndexTypeId,
				label: "Christology",
				slug: "christology",
				userId: testUser.userId,
				matchers: ["Christ", "Jesus Christ"],
			});
		});

		it("should match exact label (case-insensitive)", async ({
			authenticatedRequest,
			testProjectId,
			subjectIndexTypeId,
		}) => {
			const response = await authenticatedRequest.inject({
				method: "GET",
				url: `/trpc/indexEntry.checkExactMatch?input=${encodeURIComponent(JSON.stringify({ projectId: testProjectId, projectIndexTypeId: subjectIndexTypeId, text: "THEOLOGY" }))}`,
			});

			expect(response.statusCode).toBe(200);
			const body = JSON.parse(response.body);
			expect(body.result.data).toBeDefined();
			expect(body.result.data.label).toBe("Theology");
		});

		it("should match exact matcher (case-insensitive)", async ({
			authenticatedRequest,
			testProjectId,
			subjectIndexTypeId,
		}) => {
			const response = await authenticatedRequest.inject({
				method: "GET",
				url: `/trpc/indexEntry.checkExactMatch?input=${encodeURIComponent(JSON.stringify({ projectId: testProjectId, projectIndexTypeId: subjectIndexTypeId, text: "christ" }))}`,
			});

			expect(response.statusCode).toBe(200);
			const body = JSON.parse(response.body);
			expect(body.result.data).toBeDefined();
			expect(body.result.data.label).toBe("Christology");
		});

		it("should return null for partial match", async ({
			authenticatedRequest,
			testProjectId,
			subjectIndexTypeId,
		}) => {
			const response = await authenticatedRequest.inject({
				method: "GET",
				url: `/trpc/indexEntry.checkExactMatch?input=${encodeURIComponent(JSON.stringify({ projectId: testProjectId, projectIndexTypeId: subjectIndexTypeId, text: "theo" }))}`,
			});

			expect(response.statusCode).toBe(200);
			const body = JSON.parse(response.body);
			expect(body.result.data).toBeNull();
		});

		it("should trim whitespace", async ({
			authenticatedRequest,
			testProjectId,
			subjectIndexTypeId,
		}) => {
			const response = await authenticatedRequest.inject({
				method: "GET",
				url: `/trpc/indexEntry.checkExactMatch?input=${encodeURIComponent(JSON.stringify({ projectId: testProjectId, projectIndexTypeId: subjectIndexTypeId, text: "  Theology  " }))}`,
			});

			expect(response.statusCode).toBe(200);
			const body = JSON.parse(response.body);
			expect(body.result.data).toBeDefined();
			expect(body.result.data.label).toBe("Theology");
		});
	});

	describe("POST /trpc/indexEntry.delete", () => {
		it("should soft delete entry", async ({
			testUser,
			authenticatedRequest,
			testProjectId,
			subjectIndexTypeId,
		}) => {
			const entry = await createTestIndexEntry({
				projectId: testProjectId,
				projectIndexTypeId: subjectIndexTypeId,
				label: "Theology",
				slug: "theology",
				userId: testUser.userId,
			});

			const response = await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/indexEntry.delete",
				payload: {
					id: entry.id,
					projectId: testProjectId,
					projectIndexTypeId: subjectIndexTypeId,
				},
			});

			expect(response.statusCode).toBe(200);
			const body = JSON.parse(response.body);
			expect(body.result.data.deletedAt).toBeDefined();
			expect(body.result.data.deletedAt).not.toBeNull();
		});

		it("should reject delete if entry has children", async ({
			testUser,
			authenticatedRequest,
			testProjectId,
			subjectIndexTypeId,
		}) => {
			const parent = await createTestIndexEntry({
				projectId: testProjectId,
				projectIndexTypeId: subjectIndexTypeId,
				label: "Theology",
				slug: "theology",
				userId: testUser.userId,
			});

			await createTestIndexEntry({
				projectId: testProjectId,
				projectIndexTypeId: subjectIndexTypeId,
				label: "Christology",
				slug: "christology",
				userId: testUser.userId,
				parentId: parent.id,
			});

			const response = await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/indexEntry.delete",
				payload: {
					id: parent.id,
					projectId: testProjectId,
					projectIndexTypeId: subjectIndexTypeId,
				},
			});

			expect(response.statusCode).toBe(400);
			const body = JSON.parse(response.body);
			expect(body.error.message).toContain("children");
		});

		it("should cascade delete children when requested", async ({
			testUser,
			authenticatedRequest,
			testProjectId,
			subjectIndexTypeId,
		}) => {
			const parent = await createTestIndexEntry({
				projectId: testProjectId,
				projectIndexTypeId: subjectIndexTypeId,
				label: "Theology",
				slug: "theology",
				userId: testUser.userId,
			});

			// create child entry
			await createTestIndexEntry({
				projectId: testProjectId,
				projectIndexTypeId: subjectIndexTypeId,
				label: "Christology",
				slug: "christology",
				userId: testUser.userId,
				parentId: parent.id,
			});

			const response = await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/indexEntry.delete",
				payload: {
					id: parent.id,
					projectId: testProjectId,
					projectIndexTypeId: subjectIndexTypeId,
					cascadeToChildren: true,
				},
			});

			expect(response.statusCode).toBe(200);

			const listResponse = await authenticatedRequest.inject({
				method: "GET",
				url: `/trpc/indexEntry.list?input=${encodeURIComponent(JSON.stringify({ projectId: testProjectId }))}`,
			});

			const listBody = JSON.parse(listResponse.body);
			expect(listBody.result.data).toHaveLength(0);
		});
	});

	describe("Cross-References", () => {
		it("should create a 'see' cross-reference", async ({
			testUser,
			authenticatedRequest,
			testProjectId,
			subjectIndexTypeId,
		}) => {
			const fromEntry = await createTestIndexEntry({
				projectId: testProjectId,
				projectIndexTypeId: subjectIndexTypeId,
				label: "animal",
				slug: "animal",
				userId: testUser.userId,
			});

			const toEntry = await createTestIndexEntry({
				projectId: testProjectId,
				projectIndexTypeId: subjectIndexTypeId,
				label: "beast",
				slug: "beast",
				userId: testUser.userId,
			});

			const response = await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/indexEntry.crossReference.create",
				payload: {
					fromEntryId: fromEntry.id,
					toEntryId: toEntry.id,
					relationType: "see",
				},
			});

			expect(response.statusCode).toBe(200);
			const body = JSON.parse(response.body);
			expect(body.result.data.relationType).toBe("see");
			expect(body.result.data.fromEntryId).toBe(fromEntry.id);
			expect(body.result.data.toEntryId).toBe(toEntry.id);
		});

		it("should create a 'see also' cross-reference", async ({
			testUser,
			authenticatedRequest,
			testProjectId,
			subjectIndexTypeId,
		}) => {
			const fromEntry = await createTestIndexEntry({
				projectId: testProjectId,
				projectIndexTypeId: subjectIndexTypeId,
				label: "beast",
				slug: "beast",
				userId: testUser.userId,
			});

			const toEntry = await createTestIndexEntry({
				projectId: testProjectId,
				projectIndexTypeId: subjectIndexTypeId,
				label: "End, The",
				slug: "end-the",
				userId: testUser.userId,
			});

			const response = await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/indexEntry.crossReference.create",
				payload: {
					fromEntryId: fromEntry.id,
					toEntryId: toEntry.id,
					relationType: "see_also",
				},
			});

			expect(response.statusCode).toBe(200);
			const body = JSON.parse(response.body);
			expect(body.result.data.relationType).toBe("see_also");
		});

		it("should create cross-reference with arbitrary value", async ({
			testUser,
			authenticatedRequest,
			testProjectId,
			subjectIndexTypeId,
		}) => {
			const fromEntry = await createTestIndexEntry({
				projectId: testProjectId,
				projectIndexTypeId: subjectIndexTypeId,
				label: "form criticism",
				slug: "form-criticism",
				userId: testUser.userId,
			});

			const response = await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/indexEntry.crossReference.create",
				payload: {
					fromEntryId: fromEntry.id,
					arbitraryValue: "Form/Structure/Setting sections",
					relationType: "see",
				},
			});

			expect(response.statusCode).toBe(200);
			const body = JSON.parse(response.body);
			expect(body.result.data.arbitraryValue).toBe(
				"Form/Structure/Setting sections",
			);
			expect(body.result.data.toEntryId).toBeNull();
		});

		it("should prevent 'see' cross-reference when entry has mentions", async ({
			testUser,
			authenticatedRequest,
			testProjectId,
			subjectIndexTypeId,
		}) => {
			const document = await createTestSourceDocument({
				projectId: testProjectId,
				userId: testUser.userId,
			});

			const fromEntry = await createTestIndexEntry({
				projectId: testProjectId,
				projectIndexTypeId: subjectIndexTypeId,
				label: "animal",
				slug: "animal",
				userId: testUser.userId,
			});

			const toEntry = await createTestIndexEntry({
				projectId: testProjectId,
				projectIndexTypeId: subjectIndexTypeId,
				label: "beast",
				slug: "beast",
				userId: testUser.userId,
			});

			// Create a mention for the fromEntry
			await createTestIndexMention({
				entryId: fromEntry.id,
				documentId: document.id,
				userId: testUser.userId,
				projectIndexTypeIds: [subjectIndexTypeId],
			});

			const response = await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/indexEntry.crossReference.create",
				payload: {
					fromEntryId: fromEntry.id,
					toEntryId: toEntry.id,
					relationType: "see",
				},
			});

			expect(response.statusCode).toBe(400);
			const body = JSON.parse(response.body);
			expect(body.error.message).toContain("mentions");
		});

		it("should remove matchers when creating 'see' cross-reference", async ({
			testUser,
			authenticatedRequest,
			testProjectId,
			subjectIndexTypeId,
		}) => {
			const fromEntry = await createTestIndexEntry({
				projectId: testProjectId,
				projectIndexTypeId: subjectIndexTypeId,
				label: "animal",
				slug: "animal",
				userId: testUser.userId,
				matchers: ["beast", "creature"],
			});

			const toEntry = await createTestIndexEntry({
				projectId: testProjectId,
				projectIndexTypeId: subjectIndexTypeId,
				label: "beast",
				slug: "beast",
				userId: testUser.userId,
			});

			// Verify matchers exist before
			const beforeResponse = await authenticatedRequest.inject({
				method: "GET",
				url: `/trpc/indexEntry.list?input=${encodeURIComponent(JSON.stringify({ projectId: testProjectId }))}`,
			});
			const beforeBody = JSON.parse(beforeResponse.body);
			const beforeEntry = beforeBody.result.data.find(
				(e: { id: string }) => e.id === fromEntry.id,
			);
			expect(beforeEntry.matchers).toHaveLength(2);

			// Create 'see' cross-reference
			await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/indexEntry.crossReference.create",
				payload: {
					fromEntryId: fromEntry.id,
					toEntryId: toEntry.id,
					relationType: "see",
				},
			});

			// Verify matchers were removed
			const afterResponse = await authenticatedRequest.inject({
				method: "GET",
				url: `/trpc/indexEntry.list?input=${encodeURIComponent(JSON.stringify({ projectId: testProjectId }))}`,
			});
			const afterBody = JSON.parse(afterResponse.body);
			const afterEntry = afterBody.result.data.find(
				(e: { id: string }) => e.id === fromEntry.id,
			);
			expect(afterEntry.matchers).toHaveLength(0);
		});

		it("should list cross-references for an entry", async ({
			testUser,
			authenticatedRequest,
			testProjectId,
			subjectIndexTypeId,
		}) => {
			const fromEntry = await createTestIndexEntry({
				projectId: testProjectId,
				projectIndexTypeId: subjectIndexTypeId,
				label: "beast",
				slug: "beast",
				userId: testUser.userId,
			});

			const toEntry1 = await createTestIndexEntry({
				projectId: testProjectId,
				projectIndexTypeId: subjectIndexTypeId,
				label: "End, The",
				slug: "end-the",
				userId: testUser.userId,
			});

			const toEntry2 = await createTestIndexEntry({
				projectId: testProjectId,
				projectIndexTypeId: subjectIndexTypeId,
				label: "horn",
				slug: "horn",
				userId: testUser.userId,
			});

			// Create two cross-references
			await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/indexEntry.crossReference.create",
				payload: {
					fromEntryId: fromEntry.id,
					toEntryId: toEntry1.id,
					relationType: "see_also",
				},
			});

			await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/indexEntry.crossReference.create",
				payload: {
					fromEntryId: fromEntry.id,
					toEntryId: toEntry2.id,
					relationType: "see_also",
				},
			});

			const response = await authenticatedRequest.inject({
				method: "GET",
				url: `/trpc/indexEntry.crossReference.list?input=${encodeURIComponent(JSON.stringify({ entryId: fromEntry.id }))}`,
			});

			expect(response.statusCode).toBe(200);
			const body = JSON.parse(response.body);
			expect(body.result.data).toHaveLength(2);
			expect(body.result.data[0].relationType).toBe("see_also");
		});

		it("should delete a cross-reference", async ({
			testUser,
			authenticatedRequest,
			testProjectId,
			subjectIndexTypeId,
		}) => {
			const fromEntry = await createTestIndexEntry({
				projectId: testProjectId,
				projectIndexTypeId: subjectIndexTypeId,
				label: "animal",
				slug: "animal",
				userId: testUser.userId,
			});

			const toEntry = await createTestIndexEntry({
				projectId: testProjectId,
				projectIndexTypeId: subjectIndexTypeId,
				label: "beast",
				slug: "beast",
				userId: testUser.userId,
			});

			// Create cross-reference
			const createResponse = await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/indexEntry.crossReference.create",
				payload: {
					fromEntryId: fromEntry.id,
					toEntryId: toEntry.id,
					relationType: "see_also",
				},
			});

			const createBody = JSON.parse(createResponse.body);
			const relationId = createBody.result.data.id;

			// Delete cross-reference
			const deleteResponse = await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/indexEntry.crossReference.delete",
				payload: {
					id: relationId,
				},
			});

			expect(deleteResponse.statusCode).toBe(200);
			const deleteBody = JSON.parse(deleteResponse.body);
			expect(deleteBody.result.data).toBe(true);
		});

		it("should transfer mentions between entries", async ({
			testUser,
			authenticatedRequest,
			testProjectId,
			subjectIndexTypeId,
		}) => {
			const document = await createTestSourceDocument({
				projectId: testProjectId,
				userId: testUser.userId,
			});

			const fromEntry = await createTestIndexEntry({
				projectId: testProjectId,
				projectIndexTypeId: subjectIndexTypeId,
				label: "animal",
				slug: "animal",
				userId: testUser.userId,
			});

			const toEntry = await createTestIndexEntry({
				projectId: testProjectId,
				projectIndexTypeId: subjectIndexTypeId,
				label: "beast",
				slug: "beast",
				userId: testUser.userId,
			});

			// Create mentions for fromEntry
			await createTestIndexMention({
				entryId: fromEntry.id,
				documentId: document.id,
				userId: testUser.userId,
				projectIndexTypeIds: [subjectIndexTypeId],
			});

			await createTestIndexMention({
				entryId: fromEntry.id,
				documentId: document.id,
				userId: testUser.userId,
				pageNumber: 2,
				projectIndexTypeIds: [subjectIndexTypeId],
			});

			const response = await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/indexEntry.crossReference.transferMentions",
				payload: {
					fromEntryId: fromEntry.id,
					toEntryId: toEntry.id,
				},
			});

			expect(response.statusCode).toBe(200);
			const body = JSON.parse(response.body);
			expect(body.result.data.count).toBe(2);
		});

		it("should transfer matchers between entries", async ({
			testUser,
			authenticatedRequest,
			testProjectId,
			subjectIndexTypeId,
		}) => {
			const fromEntry = await createTestIndexEntry({
				projectId: testProjectId,
				projectIndexTypeId: subjectIndexTypeId,
				label: "animal",
				slug: "animal",
				userId: testUser.userId,
				matchers: ["beast", "creature", "living thing"],
			});

			const toEntry = await createTestIndexEntry({
				projectId: testProjectId,
				projectIndexTypeId: subjectIndexTypeId,
				label: "beast",
				slug: "beast",
				userId: testUser.userId,
			});

			const response = await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/indexEntry.crossReference.transferMatchers",
				payload: {
					fromEntryId: fromEntry.id,
					toEntryId: toEntry.id,
				},
			});

			expect(response.statusCode).toBe(200);
			const body = JSON.parse(response.body);
			expect(body.result.data.count).toBe(3);

			// Verify matchers were added to toEntry
			const listResponse = await authenticatedRequest.inject({
				method: "GET",
				url: `/trpc/indexEntry.list?input=${encodeURIComponent(JSON.stringify({ projectId: testProjectId }))}`,
			});
			const listBody = JSON.parse(listResponse.body);
			const toEntryData = listBody.result.data.find(
				(e: { id: string }) => e.id === toEntry.id,
			);
			expect(toEntryData.matchers).toHaveLength(3);
		});
	});
});
