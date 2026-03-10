import "../../test/setup";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { getTestDb } from "../../db/client";
import { detectionMatcherPageCoverage, indexMatchers } from "../../db/schema";
import {
	createTestIndexEntry,
	createTestProject,
	createTestProjectIndexType,
	createTestSourceDocument,
	createTestUser,
} from "../../test/factories";
import * as detectionRepo from "./detection.repo";

describe("detection coverage (Task 6.3)", () => {
	describe("getCoveredMatcherIdsForPage", () => {
		it("returns empty set when no coverage exists", async () => {
			const user = await createTestUser();
			const project = await createTestProject({ userId: user.userId });
			const pit = await createTestProjectIndexType({
				projectId: project.id,
				indexType: "scripture",
				userId: user.userId,
			});
			const doc = await createTestSourceDocument({
				projectId: project.id,
				userId: user.userId,
				pageCount: 5,
			});
			const entry = await createTestIndexEntry({
				projectId: project.id,
				projectIndexTypeId: pit.id,
				label: "Genesis",
				slug: "genesis",
				userId: user.userId,
				matchers: ["genesis"],
			});
			const db = getTestDb();
			if (!db) throw new Error("No test db");
			const [matcher] = await db
				.select({ id: indexMatchers.id })
				.from(indexMatchers)
				.where(eq(indexMatchers.entryId, entry.id));

			const covered = await detectionRepo.getCoveredMatcherIdsForPage({
				userId: user.userId,
				projectIndexTypeId: pit.id,
				documentId: doc.id,
				pageNumber: 1,
				matcherIds: [matcher.id],
			});
			expect(covered.size).toBe(0);
		});

		it("returns matcher ids that have coverage for the page", async () => {
			const user = await createTestUser();
			const project = await createTestProject({ userId: user.userId });
			const pit = await createTestProjectIndexType({
				projectId: project.id,
				indexType: "scripture",
				userId: user.userId,
			});
			const doc = await createTestSourceDocument({
				projectId: project.id,
				userId: user.userId,
				pageCount: 5,
			});
			const entry = await createTestIndexEntry({
				projectId: project.id,
				projectIndexTypeId: pit.id,
				label: "Genesis",
				slug: "genesis",
				userId: user.userId,
				matchers: ["genesis", "exodus"],
			});
			const db = getTestDb();
			if (!db) throw new Error("No test db");
			const matchers = await db
				.select({ id: indexMatchers.id })
				.from(indexMatchers)
				.where(eq(indexMatchers.entryId, entry.id));
			const run = await detectionRepo.createDetectionRun({
				userId: user.userId,
				input: {
					projectId: project.id,
					indexType: "scripture",
					scope: "project",
					settingsHash: "hash",
					totalPages: 5,
				},
			});

			await detectionRepo.upsertMatcherPageCoverage({
				userId: user.userId,
				runId: run.id,
				projectId: project.id,
				projectIndexTypeId: pit.id,
				documentId: doc.id,
				rows: [
					{ pageNumber: 1, matcherId: matchers[0].id },
					{ pageNumber: 1, matcherId: matchers[1].id },
				],
			});

			const covered = await detectionRepo.getCoveredMatcherIdsForPage({
				userId: user.userId,
				projectIndexTypeId: pit.id,
				documentId: doc.id,
				pageNumber: 1,
				matcherIds: matchers.map((m) => m.id),
			});
			expect(covered.size).toBe(2);
			expect(covered.has(matchers[0].id)).toBe(true);
			expect(covered.has(matchers[1].id)).toBe(true);
		});

		it("partial coverage: returns only covered matcher ids", async () => {
			const user = await createTestUser();
			const project = await createTestProject({ userId: user.userId });
			const pit = await createTestProjectIndexType({
				projectId: project.id,
				indexType: "scripture",
				userId: user.userId,
			});
			const doc = await createTestSourceDocument({
				projectId: project.id,
				userId: user.userId,
				pageCount: 5,
			});
			const entry = await createTestIndexEntry({
				projectId: project.id,
				projectIndexTypeId: pit.id,
				label: "Genesis",
				slug: "genesis",
				userId: user.userId,
				matchers: ["genesis", "exodus"],
			});
			const db = getTestDb();
			if (!db) throw new Error("No test db");
			const matchers = await db
				.select({ id: indexMatchers.id })
				.from(indexMatchers)
				.where(eq(indexMatchers.entryId, entry.id));
			const run = await detectionRepo.createDetectionRun({
				userId: user.userId,
				input: {
					projectId: project.id,
					indexType: "scripture",
					scope: "project",
					settingsHash: "hash",
					totalPages: 5,
				},
			});

			await detectionRepo.upsertMatcherPageCoverage({
				userId: user.userId,
				runId: run.id,
				projectId: project.id,
				projectIndexTypeId: pit.id,
				documentId: doc.id,
				rows: [{ pageNumber: 1, matcherId: matchers[0].id }],
			});

			const covered = await detectionRepo.getCoveredMatcherIdsForPage({
				userId: user.userId,
				projectIndexTypeId: pit.id,
				documentId: doc.id,
				pageNumber: 1,
				matcherIds: matchers.map((m) => m.id),
			});
			expect(covered.size).toBe(1);
			expect(covered.has(matchers[0].id)).toBe(true);
			expect(covered.has(matchers[1].id)).toBe(false);
		});
	});

	describe("upsertMatcherPageCoverage", () => {
		it("returns 0 when rows array is empty", async () => {
			const user = await createTestUser();
			const project = await createTestProject({ userId: user.userId });
			const pit = await createTestProjectIndexType({
				projectId: project.id,
				indexType: "scripture",
				userId: user.userId,
			});
			const doc = await createTestSourceDocument({
				projectId: project.id,
				userId: user.userId,
			});
			const run = await detectionRepo.createDetectionRun({
				userId: user.userId,
				input: {
					projectId: project.id,
					indexType: "scripture",
					scope: "project",
					settingsHash: "hash",
					totalPages: 1,
				},
			});

			const count = await detectionRepo.upsertMatcherPageCoverage({
				userId: user.userId,
				runId: run.id,
				projectId: project.id,
				projectIndexTypeId: pit.id,
				documentId: doc.id,
				rows: [],
			});
			expect(count).toBe(0);
		});

		it("first run writes coverage rows for processed matcher/page pairs", async () => {
			const user = await createTestUser();
			const project = await createTestProject({ userId: user.userId });
			const pit = await createTestProjectIndexType({
				projectId: project.id,
				indexType: "scripture",
				userId: user.userId,
			});
			const doc = await createTestSourceDocument({
				projectId: project.id,
				userId: user.userId,
				pageCount: 3,
			});
			const entry = await createTestIndexEntry({
				projectId: project.id,
				projectIndexTypeId: pit.id,
				label: "Genesis",
				slug: "genesis",
				userId: user.userId,
				matchers: ["genesis"],
			});
			const db = getTestDb();
			if (!db) throw new Error("No test db");
			const [matcher] = await db
				.select({ id: indexMatchers.id })
				.from(indexMatchers)
				.where(eq(indexMatchers.entryId, entry.id));
			const run = await detectionRepo.createDetectionRun({
				userId: user.userId,
				input: {
					projectId: project.id,
					indexType: "scripture",
					scope: "project",
					settingsHash: "hash",
					totalPages: 3,
				},
			});

			const count = await detectionRepo.upsertMatcherPageCoverage({
				userId: user.userId,
				runId: run.id,
				projectId: project.id,
				projectIndexTypeId: pit.id,
				documentId: doc.id,
				rows: [
					{ pageNumber: 1, matcherId: matcher.id },
					{ pageNumber: 2, matcherId: matcher.id },
				],
			});
			expect(count).toBe(2);

			const rows = await db
				.select()
				.from(detectionMatcherPageCoverage)
				.where(eq(detectionMatcherPageCoverage.documentId, doc.id));
			expect(rows).toHaveLength(2);
			expect(rows.map((r) => r.pageNumber).sort()).toEqual([1, 2]);
		});

		it("duplicate coverage inserts collapse via upsert without error", async () => {
			const user = await createTestUser();
			const project = await createTestProject({ userId: user.userId });
			const pit = await createTestProjectIndexType({
				projectId: project.id,
				indexType: "scripture",
				userId: user.userId,
			});
			const doc = await createTestSourceDocument({
				projectId: project.id,
				userId: user.userId,
			});
			const entry = await createTestIndexEntry({
				projectId: project.id,
				projectIndexTypeId: pit.id,
				label: "Genesis",
				slug: "genesis",
				userId: user.userId,
				matchers: ["genesis"],
			});
			const db = getTestDb();
			if (!db) throw new Error("No test db");
			const [matcher] = await db
				.select({ id: indexMatchers.id })
				.from(indexMatchers)
				.where(eq(indexMatchers.entryId, entry.id));
			const run1 = await detectionRepo.createDetectionRun({
				userId: user.userId,
				input: {
					projectId: project.id,
					indexType: "scripture",
					scope: "project",
					settingsHash: "hash",
					totalPages: 1,
				},
			});

			const count1 = await detectionRepo.upsertMatcherPageCoverage({
				userId: user.userId,
				runId: run1.id,
				projectId: project.id,
				projectIndexTypeId: pit.id,
				documentId: doc.id,
				rows: [{ pageNumber: 1, matcherId: matcher.id }],
			});
			expect(count1).toBe(1);

			const run2 = await detectionRepo.createDetectionRun({
				userId: user.userId,
				input: {
					projectId: project.id,
					indexType: "scripture",
					scope: "project",
					settingsHash: "hash2",
					totalPages: 1,
				},
			});
			const count2 = await detectionRepo.upsertMatcherPageCoverage({
				userId: user.userId,
				runId: run2.id,
				projectId: project.id,
				projectIndexTypeId: pit.id,
				documentId: doc.id,
				rows: [{ pageNumber: 1, matcherId: matcher.id }],
			});
			expect(count2).toBe(1);

			const rows = await db
				.select({
					id: detectionMatcherPageCoverage.id,
					lastDetectionRunId: detectionMatcherPageCoverage.lastDetectionRunId,
				})
				.from(detectionMatcherPageCoverage)
				.where(eq(detectionMatcherPageCoverage.documentId, doc.id));
			expect(rows).toHaveLength(1);
			expect(rows[0].lastDetectionRunId).toBe(run2.id);
		});
	});
});
