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

// ============================================================================
// API / Integration Tests for IndexMention
// ============================================================================

declare module "vitest" {
	export interface TestContext {
		server: FastifyInstance;
		testUser: Awaited<ReturnType<typeof createTestUser>>;
		authenticatedRequest: ReturnType<typeof makeAuthenticatedRequest>;
		testProjectId: string;
		testDocumentId: string;
		subjectIndexTypeId: string;
		authorIndexTypeId: string;
		subjectEntryId: string;
		authorEntryId: string;
	}
}

describe("IndexMention API (Integration)", () => {
	beforeEach(async (context) => {
		context.server = await createTestServer();

		context.testUser = await createTestUser();
		context.authenticatedRequest = makeAuthenticatedRequest({
			server: context.server,
			authToken: context.testUser.authToken,
		});

		const project = await createTestProject({
			userId: context.testUser.userId,
		});
		context.testProjectId = project.id;

		const document = await createTestSourceDocument({
			projectId: context.testProjectId,
			userId: context.testUser.userId,
			title: "Test PDF Document",
			pageCount: 100,
		});
		context.testDocumentId = document.id;

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

		const subjectEntry = await createTestIndexEntry({
			projectId: context.testProjectId,
			projectIndexTypeId: context.subjectIndexTypeId,
			label: "Theology",
			slug: "theology",
			userId: context.testUser.userId,
		});
		context.subjectEntryId = subjectEntry.id;

		const authorEntry = await createTestIndexEntry({
			projectId: context.testProjectId,
			projectIndexTypeId: context.authorIndexTypeId,
			label: "John Calvin",
			slug: "john-calvin",
			userId: context.testUser.userId,
		});
		context.authorEntryId = authorEntry.id;
	});

	afterEach(async (context) => {
		await closeTestServer(context.server);
	});

	describe("POST /trpc/indexMention.create", () => {
		it("should create a new index mention", async ({
			authenticatedRequest,
			testDocumentId,
			subjectEntryId,
			subjectIndexTypeId,
		}) => {
			const response = await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/indexMention.create",
				payload: {
					documentId: testDocumentId,
					entryId: subjectEntryId,
					pageNumber: 5,
					textSpan: "theology in the modern world",
					bboxesPdf: [
						{ x: 100, y: 200, width: 300, height: 20 },
						{ x: 100, y: 220, width: 150, height: 20 },
					],
					projectIndexTypeIds: [subjectIndexTypeId],
					mentionType: "text",
				},
			});

			expect(response.statusCode).toBe(200);
			const body = JSON.parse(response.body);
			expect(body.result.data.textSpan).toBe("theology in the modern world");
			expect(body.result.data.pageNumber).toBe(5);
			expect(body.result.data.mentionType).toBe("text");
			expect(body.result.data.bboxes).toHaveLength(2);
			expect(body.result.data.indexTypes).toHaveLength(1);
		});

		it("should create mention with multiple index types", async ({
			authenticatedRequest,
			testDocumentId,
			subjectEntryId,
			subjectIndexTypeId,
			authorIndexTypeId,
		}) => {
			const response = await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/indexMention.create",
				payload: {
					documentId: testDocumentId,
					entryId: subjectEntryId,
					pageNumber: 10,
					textSpan: "theological discussion",
					bboxesPdf: [{ x: 100, y: 200, width: 300, height: 20 }],
					projectIndexTypeIds: [subjectIndexTypeId, authorIndexTypeId],
					mentionType: "text",
				},
			});

			expect(response.statusCode).toBe(200);
			const body = JSON.parse(response.body);
			expect(body.result.data.indexTypes).toHaveLength(2);
		});

		it("should create region mention", async ({
			authenticatedRequest,
			testDocumentId,
			subjectEntryId,
			subjectIndexTypeId,
		}) => {
			const response = await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/indexMention.create",
				payload: {
					documentId: testDocumentId,
					entryId: subjectEntryId,
					pageNumber: 15,
					textSpan: "Diagram 1",
					bboxesPdf: [{ x: 100, y: 200, width: 400, height: 300 }],
					projectIndexTypeIds: [subjectIndexTypeId],
					mentionType: "region",
				},
			});

			expect(response.statusCode).toBe(200);
			const body = JSON.parse(response.body);
			expect(body.result.data.mentionType).toBe("region");
		});

		it("should reject invalid entry ID", async ({
			authenticatedRequest,
			testDocumentId,
			subjectIndexTypeId,
		}) => {
			const response = await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/indexMention.create",
				payload: {
					documentId: testDocumentId,
					entryId: "00000000-0000-0000-0000-000000000000",
					pageNumber: 5,
					textSpan: "text",
					bboxesPdf: [{ x: 100, y: 200, width: 300, height: 20 }],
					projectIndexTypeIds: [subjectIndexTypeId],
				},
			});

			expect(response.statusCode).toBe(404);
			const body = JSON.parse(response.body);
			expect(body.error.message).toContain("not found");
		});

		it("should require at least one index type", async ({
			authenticatedRequest,
			testDocumentId,
			subjectEntryId,
		}) => {
			const response = await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/indexMention.create",
				payload: {
					documentId: testDocumentId,
					entryId: subjectEntryId,
					pageNumber: 5,
					textSpan: "text",
					bboxesPdf: [{ x: 100, y: 200, width: 300, height: 20 }],
					projectIndexTypeIds: [],
				},
			});

			expect(response.statusCode).toBe(400);
		});

		it("should require authentication", async ({
			server,
			testDocumentId,
			subjectEntryId,
			subjectIndexTypeId,
		}) => {
			const response = await server.inject({
				method: "POST",
				url: "/trpc/indexMention.create",
				payload: {
					documentId: testDocumentId,
					entryId: subjectEntryId,
					pageNumber: 5,
					textSpan: "text",
					bboxesPdf: [{ x: 100, y: 200, width: 300, height: 20 }],
					projectIndexTypeIds: [subjectIndexTypeId],
				},
			});

			expect(response.statusCode).toBe(401);
		});
	});

	describe("GET /trpc/indexMention.list", () => {
		it("should list all mentions for a project", async ({
			testUser,
			authenticatedRequest,
			testProjectId,
			testDocumentId,
			subjectEntryId,
			subjectIndexTypeId,
		}) => {
			await createTestIndexMention({
				entryId: subjectEntryId,
				documentId: testDocumentId,
				userId: testUser.userId,
				pageNumber: 5,
				textSpan: "mention 1",
				projectIndexTypeIds: [subjectIndexTypeId],
			});

			await createTestIndexMention({
				entryId: subjectEntryId,
				documentId: testDocumentId,
				userId: testUser.userId,
				pageNumber: 10,
				textSpan: "mention 2",
				projectIndexTypeIds: [subjectIndexTypeId],
			});

			const response = await authenticatedRequest.inject({
				method: "GET",
				url: `/trpc/indexMention.list?input=${encodeURIComponent(JSON.stringify({ projectId: testProjectId }))}`,
			});

			expect(response.statusCode).toBe(200);
			const body = JSON.parse(response.body);
			expect(body.result.data).toHaveLength(2);
		});

		it("should filter by document ID", async ({
			testUser,
			authenticatedRequest,
			testProjectId,
			testDocumentId,
			subjectEntryId,
			subjectIndexTypeId,
		}) => {
			const doc2 = await createTestSourceDocument({
				projectId: testProjectId,
				userId: testUser.userId,
				title: "Document 2",
			});

			await createTestIndexMention({
				entryId: subjectEntryId,
				documentId: testDocumentId,
				userId: testUser.userId,
				projectIndexTypeIds: [subjectIndexTypeId],
			});

			await createTestIndexMention({
				entryId: subjectEntryId,
				documentId: doc2.id,
				userId: testUser.userId,
				projectIndexTypeIds: [subjectIndexTypeId],
			});

			const response = await authenticatedRequest.inject({
				method: "GET",
				url: `/trpc/indexMention.list?input=${encodeURIComponent(JSON.stringify({ projectId: testProjectId, documentId: testDocumentId }))}`,
			});

			expect(response.statusCode).toBe(200);
			const body = JSON.parse(response.body);
			expect(body.result.data).toHaveLength(1);
		});

		it("should filter by page number", async ({
			testUser,
			authenticatedRequest,
			testProjectId,
			testDocumentId,
			subjectEntryId,
			subjectIndexTypeId,
		}) => {
			await createTestIndexMention({
				entryId: subjectEntryId,
				documentId: testDocumentId,
				userId: testUser.userId,
				pageNumber: 5,
				projectIndexTypeIds: [subjectIndexTypeId],
			});

			await createTestIndexMention({
				entryId: subjectEntryId,
				documentId: testDocumentId,
				userId: testUser.userId,
				pageNumber: 10,
				projectIndexTypeIds: [subjectIndexTypeId],
			});

			const response = await authenticatedRequest.inject({
				method: "GET",
				url: `/trpc/indexMention.list?input=${encodeURIComponent(JSON.stringify({ projectId: testProjectId, pageNumber: 5 }))}`,
			});

			expect(response.statusCode).toBe(200);
			const body = JSON.parse(response.body);
			expect(body.result.data).toHaveLength(1);
			expect(body.result.data[0].pageNumber).toBe(5);
		});

		it("should filter by index type IDs", async ({
			testUser,
			authenticatedRequest,
			testProjectId,
			testDocumentId,
			subjectEntryId,
			authorEntryId,
			subjectIndexTypeId,
			authorIndexTypeId,
		}) => {
			await createTestIndexMention({
				entryId: subjectEntryId,
				documentId: testDocumentId,
				userId: testUser.userId,
				projectIndexTypeIds: [subjectIndexTypeId],
			});

			await createTestIndexMention({
				entryId: authorEntryId,
				documentId: testDocumentId,
				userId: testUser.userId,
				projectIndexTypeIds: [authorIndexTypeId],
			});

			const response = await authenticatedRequest.inject({
				method: "GET",
				url: `/trpc/indexMention.list?input=${encodeURIComponent(JSON.stringify({ projectId: testProjectId, projectIndexTypeIds: [subjectIndexTypeId] }))}`,
			});

			expect(response.statusCode).toBe(200);
			const body = JSON.parse(response.body);
			expect(body.result.data).toHaveLength(1);
			expect(body.result.data[0].indexTypes[0].projectIndexTypeId).toBe(
				subjectIndexTypeId,
			);
		});
	});

	describe("POST /trpc/indexMention.update", () => {
		it("should update mention text span", async ({
			testUser,
			authenticatedRequest,
			testDocumentId,
			subjectEntryId,
			subjectIndexTypeId,
		}) => {
			const mention = await createTestIndexMention({
				entryId: subjectEntryId,
				documentId: testDocumentId,
				userId: testUser.userId,
				textSpan: "original text",
				projectIndexTypeIds: [subjectIndexTypeId],
			});

			const response = await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/indexMention.update",
				payload: {
					id: mention.id,
					textSpan: "updated text",
				},
			});

			expect(response.statusCode).toBe(200);
			const body = JSON.parse(response.body);
			expect(body.result.data.textSpan).toBe("updated text");
		});

		it("should update mention entry", async ({
			testUser,
			authenticatedRequest,
			testDocumentId,
			subjectEntryId,
			authorEntryId,
			subjectIndexTypeId,
		}) => {
			const mention = await createTestIndexMention({
				entryId: subjectEntryId,
				documentId: testDocumentId,
				userId: testUser.userId,
				projectIndexTypeIds: [subjectIndexTypeId],
			});

			const response = await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/indexMention.update",
				payload: {
					id: mention.id,
					entryId: authorEntryId,
				},
			});

			expect(response.statusCode).toBe(200);
			const body = JSON.parse(response.body);
			expect(body.result.data.entryId).toBe(authorEntryId);
		});

		it("should update mention index types", async ({
			testUser,
			authenticatedRequest,
			testDocumentId,
			subjectEntryId,
			subjectIndexTypeId,
			authorIndexTypeId,
		}) => {
			const mention = await createTestIndexMention({
				entryId: subjectEntryId,
				documentId: testDocumentId,
				userId: testUser.userId,
				projectIndexTypeIds: [subjectIndexTypeId],
			});

			const response = await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/indexMention.update",
				payload: {
					id: mention.id,
					projectIndexTypeIds: [subjectIndexTypeId, authorIndexTypeId],
				},
			});

			expect(response.statusCode).toBe(200);
			const body = JSON.parse(response.body);
			expect(body.result.data.indexTypes).toHaveLength(2);
		});
	});

	describe("POST /trpc/indexMention.updateIndexTypes", () => {
		it("should replace index types for multiple mentions", async ({
			testUser,
			authenticatedRequest,
			testDocumentId,
			subjectEntryId,
			subjectIndexTypeId,
			authorIndexTypeId,
		}) => {
			const mention1 = await createTestIndexMention({
				entryId: subjectEntryId,
				documentId: testDocumentId,
				userId: testUser.userId,
				projectIndexTypeIds: [subjectIndexTypeId],
			});

			const mention2 = await createTestIndexMention({
				entryId: subjectEntryId,
				documentId: testDocumentId,
				userId: testUser.userId,
				projectIndexTypeIds: [subjectIndexTypeId],
			});

			const response = await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/indexMention.updateIndexTypes",
				payload: {
					mentionIds: [mention1.id, mention2.id],
					projectIndexTypeIds: [authorIndexTypeId],
					operation: "replace",
				},
			});

			expect(response.statusCode).toBe(200);
			const body = JSON.parse(response.body);
			expect(body.result.data).toHaveLength(2);
			expect(body.result.data[0].indexTypes).toHaveLength(1);
			expect(body.result.data[0].indexTypes[0].projectIndexTypeId).toBe(
				authorIndexTypeId,
			);
		});

		it("should add index types to existing types", async ({
			testUser,
			authenticatedRequest,
			testDocumentId,
			subjectEntryId,
			subjectIndexTypeId,
			authorIndexTypeId,
		}) => {
			const mention = await createTestIndexMention({
				entryId: subjectEntryId,
				documentId: testDocumentId,
				userId: testUser.userId,
				projectIndexTypeIds: [subjectIndexTypeId],
			});

			const response = await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/indexMention.updateIndexTypes",
				payload: {
					mentionIds: [mention.id],
					projectIndexTypeIds: [authorIndexTypeId],
					operation: "add",
				},
			});

			expect(response.statusCode).toBe(200);
			const body = JSON.parse(response.body);
			expect(body.result.data[0].indexTypes).toHaveLength(2);
		});

		it("should remove index types from mentions", async ({
			testUser,
			authenticatedRequest,
			testDocumentId,
			subjectEntryId,
			subjectIndexTypeId,
			authorIndexTypeId,
		}) => {
			const mention = await createTestIndexMention({
				entryId: subjectEntryId,
				documentId: testDocumentId,
				userId: testUser.userId,
				projectIndexTypeIds: [subjectIndexTypeId, authorIndexTypeId],
			});

			const response = await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/indexMention.updateIndexTypes",
				payload: {
					mentionIds: [mention.id],
					projectIndexTypeIds: [authorIndexTypeId],
					operation: "remove",
				},
			});

			expect(response.statusCode).toBe(200);
			const body = JSON.parse(response.body);
			expect(body.result.data[0].indexTypes).toHaveLength(1);
			expect(body.result.data[0].indexTypes[0].projectIndexTypeId).toBe(
				subjectIndexTypeId,
			);
		});
	});

	describe("POST /trpc/indexMention.bulkCreate", () => {
		it("should create multiple mentions at once", async ({
			authenticatedRequest,
			testDocumentId,
			subjectEntryId,
			subjectIndexTypeId,
		}) => {
			const response = await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/indexMention.bulkCreate",
				payload: {
					mentions: [
						{
							documentId: testDocumentId,
							entryId: subjectEntryId,
							pageNumber: 1,
							textSpan: "mention 1",
							bboxesPdf: [{ x: 100, y: 100, width: 200, height: 20 }],
							projectIndexTypeIds: [subjectIndexTypeId],
						},
						{
							documentId: testDocumentId,
							entryId: subjectEntryId,
							pageNumber: 2,
							textSpan: "mention 2",
							bboxesPdf: [{ x: 100, y: 100, width: 200, height: 20 }],
							projectIndexTypeIds: [subjectIndexTypeId],
						},
						{
							documentId: testDocumentId,
							entryId: subjectEntryId,
							pageNumber: 3,
							textSpan: "mention 3",
							bboxesPdf: [{ x: 100, y: 100, width: 200, height: 20 }],
							projectIndexTypeIds: [subjectIndexTypeId],
						},
					],
				},
			});

			expect(response.statusCode).toBe(200);
			const body = JSON.parse(response.body);
			expect(body.result.data).toHaveLength(3);
		});

		it("should reject empty mentions array", async ({
			authenticatedRequest,
		}) => {
			const response = await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/indexMention.bulkCreate",
				payload: {
					mentions: [],
				},
			});

			expect(response.statusCode).toBe(400);
		});
	});

	describe("POST /trpc/indexMention.delete", () => {
		it("should soft delete a mention", async ({
			testUser,
			authenticatedRequest,
			testDocumentId,
			subjectEntryId,
			subjectIndexTypeId,
		}) => {
			const mention = await createTestIndexMention({
				entryId: subjectEntryId,
				documentId: testDocumentId,
				userId: testUser.userId,
				projectIndexTypeIds: [subjectIndexTypeId],
			});

			const response = await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/indexMention.delete",
				payload: {
					id: mention.id,
				},
			});

			expect(response.statusCode).toBe(200);
			const body = JSON.parse(response.body);
			expect(body.result.data.deletedAt).not.toBeNull();
		});

		it("should reject deletion of non-existent mention", async ({
			authenticatedRequest,
		}) => {
			const response = await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/indexMention.delete",
				payload: {
					id: "00000000-0000-0000-0000-000000000000",
				},
			});

			expect(response.statusCode).toBe(404);
		});
	});
});
