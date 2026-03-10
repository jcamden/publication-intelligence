import "../../test/setup";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as detectionRepo from "./detection.repo";
import {
	resolveAndPersistScriptureCandidates,
	resolveAndPersistSubjectCandidates,
	type ResolutionCandidate,
} from "./entry-resolution.service";

// ============================================================================
// Task 5.1: Subject resolution tests
// ============================================================================

const projectIndexTypeId = "pit-1";
const documentId = "doc-1";
const detectionRunId = "run-1";
const userId = "user-1";

const baseContext = {
	userId,
	documentId,
	detectionRunId,
	projectId: "proj-1",
	projectIndexTypeId,
	indexType: "subject",
};

const baseCandidate = (
	overrides: Partial<ResolutionCandidate> = {},
): ResolutionCandidate => ({
	pageNumber: 1,
	groupId: "g1",
	matcherId: "matcher-1",
	entryId: "entry-1",
	indexType: "subject",
	textSpan: "Genesis",
	charStart: 0,
	charEnd: 7,
	bboxes: [{ x: 0, y: 10, width: 50, height: 8 }],
	...overrides,
});

describe("resolveAndPersistSubjectCandidates (Task 5.1)", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("resolves valid subject candidate to existing matcher->entry and persists mention", async () => {
		const candidate = baseCandidate({ matcherId: "m1", entryId: "e1" });
		vi.spyOn(
			detectionRepo,
			"getMatcherByIdAndProjectIndexTypeId",
		).mockResolvedValue({ entryId: "e1" });
		vi.spyOn(detectionRepo, "insertMatcherMentionsBatch").mockResolvedValue(1);

		const result = await resolveAndPersistSubjectCandidates({
			candidates: [candidate],
			context: baseContext,
		});

		expect(result.candidatesSeen).toBe(1);
		expect(result.resolved).toBe(1);
		expect(result.persisted).toBe(1);
		expect(result.dropped).toBe(0);
		expect(detectionRepo.getMatcherByIdAndProjectIndexTypeId).toHaveBeenCalledWith({
			userId,
			matcherId: "m1",
			projectIndexTypeId,
		});
		expect(detectionRepo.insertMatcherMentionsBatch).toHaveBeenCalledWith({
			userId,
			documentId,
			detectionRunId,
			projectIndexTypeId,
			candidates: [
				{
					entryId: "e1",
					pageNumber: 1,
					textSpan: "Genesis",
					bboxes: [{ x: 0, y: 10, width: 50, height: 8 }],
				},
			],
		});
	});

	it("does not create entries or matchers during subject resolution", async () => {
		const candidate = baseCandidate();
		vi.spyOn(
			detectionRepo,
			"getMatcherByIdAndProjectIndexTypeId",
		).mockResolvedValue({ entryId: "e1" });
		vi.spyOn(detectionRepo, "insertMatcherMentionsBatch").mockResolvedValue(1);

		await resolveAndPersistSubjectCandidates({
			candidates: [candidate],
			context: baseContext,
		});

		// Only these two repo methods should be called; no insert index_entries / index_matchers
		expect(detectionRepo.getMatcherByIdAndProjectIndexTypeId).toHaveBeenCalledTimes(1);
		expect(detectionRepo.insertMatcherMentionsBatch).toHaveBeenCalledTimes(1);
		const insertCalls = vi.mocked(detectionRepo.insertMatcherMentionsBatch).mock.calls;
		expect(insertCalls.length).toBe(1);
		expect(insertCalls[0]?.[0].candidates).toHaveLength(1);
	});

	it("drops candidate when matcher does not exist in current project/index type", async () => {
		const candidate = baseCandidate({ matcherId: "missing-matcher" });
		vi.spyOn(
			detectionRepo,
			"getMatcherByIdAndProjectIndexTypeId",
		).mockResolvedValue(null);
		const insertSpy = vi.spyOn(detectionRepo, "insertMatcherMentionsBatch");

		const result = await resolveAndPersistSubjectCandidates({
			candidates: [candidate],
			context: baseContext,
		});

		expect(result.candidatesSeen).toBe(1);
		expect(result.resolved).toBe(0);
		expect(result.persisted).toBe(0);
		expect(result.dropped).toBe(1);
		expect(insertSpy).not.toHaveBeenCalled();
	});

	it("preserves original textSpan and bboxes in persisted mention", async () => {
		const textSpan = "1 Cor. 2:3";
		const bboxes = [
			{ x: 1, y: 2, width: 30, height: 4 },
			{ x: 35, y: 2, width: 20, height: 4 },
		];
		const candidate = baseCandidate({ textSpan, bboxes, pageNumber: 5 });
		vi.spyOn(
			detectionRepo,
			"getMatcherByIdAndProjectIndexTypeId",
		).mockResolvedValue({ entryId: "e1" });
		vi.spyOn(detectionRepo, "insertMatcherMentionsBatch").mockResolvedValue(1);

		await resolveAndPersistSubjectCandidates({
			candidates: [candidate],
			context: baseContext,
		});

		expect(detectionRepo.insertMatcherMentionsBatch).toHaveBeenCalledWith(
			expect.objectContaining({
				candidates: [
					{
						entryId: "e1",
						pageNumber: 5,
						textSpan: "1 Cor. 2:3",
						bboxes: [
							{ x: 1, y: 2, width: 30, height: 4 },
							{ x: 35, y: 2, width: 20, height: 4 },
						],
					},
				],
			}),
		);
	});

	it("duplicate resolved mentions are skipped per Task 4.2 without run failure", async () => {
		// Two candidates that resolve to same entry + page + bbox => same dedupe key => one inserted
		const bboxes = [{ x: 0, y: 10, width: 50, height: 8 }];
		const candidates: ResolutionCandidate[] = [
			baseCandidate({ matcherId: "m1", bboxes }),
			baseCandidate({ matcherId: "m1", bboxes }), // same matcher, same bbox, same page
		];
		vi.spyOn(
			detectionRepo,
			"getMatcherByIdAndProjectIndexTypeId",
		).mockResolvedValue({ entryId: "e1" });
		// Batch insert with ON CONFLICT DO NOTHING returns count of rows actually inserted
		vi.spyOn(detectionRepo, "insertMatcherMentionsBatch").mockResolvedValue(1);

		const result = await resolveAndPersistSubjectCandidates({
			candidates,
			context: baseContext,
		});

		expect(result.candidatesSeen).toBe(2);
		expect(result.resolved).toBe(2);
		expect(result.persisted).toBe(1);
		expect(result.deduped).toBe(1);
		expect(result.dropped).toBe(0);
		expect(result.warnings).toHaveLength(0);
	});

	it("returns early with dropped count when indexType is not subject", async () => {
		const candidate = baseCandidate();
		const getMatcherSpy = vi.spyOn(
			detectionRepo,
			"getMatcherByIdAndProjectIndexTypeId",
		);
		const insertSpy = vi.spyOn(detectionRepo, "insertMatcherMentionsBatch");

		const result = await resolveAndPersistSubjectCandidates({
			candidates: [candidate],
			context: { ...baseContext, indexType: "scripture" },
		});

		expect(result.candidatesSeen).toBe(1);
		expect(result.resolved).toBe(0);
		expect(result.persisted).toBe(0);
		expect(result.dropped).toBe(1);
		expect(result.warnings.length).toBeGreaterThan(0);
		expect(getMatcherSpy).not.toHaveBeenCalled();
		expect(insertSpy).not.toHaveBeenCalled();
	});

	it("one candidate resolution failure does not fail entire run and accumulates warnings", async () => {
		const candidates = [
			baseCandidate({ matcherId: "m1" }),
			baseCandidate({ matcherId: "m2" }),
		];
		vi.spyOn(detectionRepo, "getMatcherByIdAndProjectIndexTypeId")
			.mockRejectedValueOnce(new Error("transient error"))
			.mockResolvedValueOnce({ entryId: "e2" });
		vi.spyOn(detectionRepo, "insertMatcherMentionsBatch").mockResolvedValue(1);

		const result = await resolveAndPersistSubjectCandidates({
			candidates,
			context: baseContext,
		});

		expect(result.candidatesSeen).toBe(2);
		expect(result.resolved).toBe(1);
		expect(result.persisted).toBe(1);
		expect(result.dropped).toBe(1);
		expect(result.warnings.some((w) => w.includes("transient error"))).toBe(true);
	});
});

// ============================================================================
// Task 5.2: Scripture resolution tests
// ============================================================================

const scriptureContext = {
	...baseContext,
	indexType: "scripture" as const,
};

const scriptureCandidate = (
	overrides: Partial<ResolutionCandidate> = {},
): ResolutionCandidate => ({
	...baseCandidate({ indexType: "scripture", ...overrides }),
});

describe("resolveAndPersistScriptureCandidates (Task 5.2)", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("resolves book alias + one parsed segment to existing/reused child matcher mention", async () => {
		const candidate = scriptureCandidate({
			matcherId: "m-gen",
			entryId: "e-gen",
			textSpan: "Gen 1:1",
			parserSegments: [{ refText: "1:1", chapter: 1, verseStart: 1, verseEnd: 1 }],
		});
		vi.spyOn(detectionRepo, "getMatcherWithEntry").mockResolvedValue({
			entryId: "e-gen",
			projectId: "proj-1",
			label: "Genesis",
			slug: "genesis",
		});
		vi.spyOn(detectionRepo, "getEntryByProjectTypeAndSlug").mockResolvedValue({
			id: "e-child-1-1",
			parentId: "e-gen",
		});
		vi.spyOn(detectionRepo, "getMatcherByTextAndProjectIndexTypeId").mockResolvedValue({
			id: "mat-1-1",
			entryId: "e-child-1-1",
		});
		vi.spyOn(detectionRepo, "insertMatcherMentionsBatch").mockResolvedValue(1);

		const result = await resolveAndPersistScriptureCandidates({
			candidates: [candidate],
			context: scriptureContext,
		});

		expect(result.candidatesSeen).toBe(1);
		expect(result.childrenReused).toBe(1);
		expect(result.matchersReused).toBe(1);
		expect(result.mentionsPersisted).toBe(1);
		expect(result.resolutionMisses).toBe(0);
		expect(detectionRepo.getMatcherWithEntry).toHaveBeenCalledWith({
			userId,
			matcherId: "m-gen",
			projectIndexTypeId,
		});
		expect(detectionRepo.getEntryByProjectTypeAndSlug).toHaveBeenCalledWith({
			userId,
			projectId: "proj-1",
			projectIndexTypeId,
			slug: "genesis--1-1",
		});
		expect(detectionRepo.insertMatcherMentionsBatch).toHaveBeenCalledWith(
			expect.objectContaining({
				candidates: [
					{
						entryId: "e-child-1-1",
						pageNumber: 1,
						textSpan: "Gen 1:1",
						bboxes: [{ x: 0, y: 10, width: 50, height: 8 }],
					},
				],
			}),
		);
	});

	it("creates child entry and matcher when segment target does not yet exist", async () => {
		const candidate = scriptureCandidate({
			matcherId: "m-gen",
			entryId: "e-gen",
			textSpan: "Gen 2:4-5",
			parserSegments: [
				{ refText: "2:4-5", chapter: 2, verseStart: 4, verseEnd: 5 },
			],
		});
		vi.spyOn(detectionRepo, "getMatcherWithEntry").mockResolvedValue({
			entryId: "e-gen",
			projectId: "proj-1",
			label: "Genesis",
			slug: "genesis",
		});
		vi.spyOn(detectionRepo, "getEntryByProjectTypeAndSlug").mockResolvedValue(null);
		vi.spyOn(detectionRepo, "createChildEntry").mockResolvedValue("e-child-2-4-5");
		vi.spyOn(detectionRepo, "getMatcherByTextAndProjectIndexTypeId").mockResolvedValue(null);
		vi.spyOn(detectionRepo, "createMatcher").mockResolvedValue("mat-2-4-5");
		vi.spyOn(detectionRepo, "insertMatcherMentionsBatch").mockResolvedValue(1);

		const result = await resolveAndPersistScriptureCandidates({
			candidates: [candidate],
			context: scriptureContext,
		});

		expect(result.childrenCreated).toBe(1);
		expect(result.matchersCreated).toBe(1);
		expect(result.mentionsPersisted).toBe(1);
		expect(detectionRepo.createChildEntry).toHaveBeenCalledWith({
			userId,
			projectId: "proj-1",
			projectIndexTypeId,
			parentId: "e-gen",
			slug: "genesis--2-4-5",
			label: "2:4-5",
			detectionRunId,
		});
		expect(detectionRepo.createMatcher).toHaveBeenCalledWith({
			userId,
			entryId: "e-child-2-4-5",
			projectIndexTypeId,
			text: "2:4-5",
		});
	});

	it("compound refs emit one mention per segment in stable order", async () => {
		const candidate = scriptureCandidate({
			matcherId: "m-gen",
			entryId: "e-gen",
			textSpan: "Gen 1:1-3, 2:4-5, 27",
			parserSegments: [
				{ refText: "1:1-3", chapter: 1, verseStart: 1, verseEnd: 3 },
				{ refText: "2:4-5", chapter: 2, verseStart: 4, verseEnd: 5 },
				{ refText: "27", chapter: 2, verseStart: 27, verseEnd: 27 },
			],
		});
		vi.spyOn(detectionRepo, "getMatcherWithEntry").mockResolvedValue({
			entryId: "e-gen",
			projectId: "proj-1",
			label: "Genesis",
			slug: "genesis",
		});
		vi.spyOn(detectionRepo, "getEntryByProjectTypeAndSlug")
			.mockResolvedValueOnce(null)
			.mockResolvedValueOnce(null)
			.mockResolvedValueOnce(null);
		vi.spyOn(detectionRepo, "createChildEntry")
			.mockResolvedValueOnce("e-1-1-3")
			.mockResolvedValueOnce("e-2-4-5")
			.mockResolvedValueOnce("e-2-27");
		vi.spyOn(detectionRepo, "getMatcherByTextAndProjectIndexTypeId").mockResolvedValue(null);
		vi.spyOn(detectionRepo, "createMatcher")
			.mockResolvedValueOnce("mat-1")
			.mockResolvedValueOnce("mat-2")
			.mockResolvedValueOnce("mat-3");
		vi.spyOn(detectionRepo, "insertMatcherMentionsBatch").mockResolvedValue(3);

		const result = await resolveAndPersistScriptureCandidates({
			candidates: [candidate],
			context: scriptureContext,
		});

		expect(result.childrenCreated).toBe(3);
		expect(result.mentionsPersisted).toBe(3);
		const insertCall = vi.mocked(detectionRepo.insertMatcherMentionsBatch).mock.calls[0]?.[0];
		expect(insertCall?.candidates).toHaveLength(3);
		expect(insertCall?.candidates?.map((x) => x.entryId)).toEqual([
			"e-1-1-3",
			"e-2-4-5",
			"e-2-27",
		]);
	});

	it("fallback book-level candidate attaches mention without creating spurious child refs", async () => {
		const candidate = scriptureCandidate({
			matcherId: "m-gen",
			entryId: "e-gen",
			textSpan: "Gen",
			fallbackBookLevel: true,
		});
		vi.spyOn(detectionRepo, "getMatcherWithEntry").mockResolvedValue({
			entryId: "e-gen",
			projectId: "proj-1",
			label: "Genesis",
			slug: "genesis",
		});
		vi.spyOn(detectionRepo, "createChildEntry");
		vi.spyOn(detectionRepo, "createMatcher");
		vi.spyOn(detectionRepo, "insertMatcherMentionsBatch").mockResolvedValue(1);

		const result = await resolveAndPersistScriptureCandidates({
			candidates: [candidate],
			context: scriptureContext,
		});

		expect(result.mentionsPersisted).toBe(1);
		expect(detectionRepo.createChildEntry).not.toHaveBeenCalled();
		expect(detectionRepo.createMatcher).not.toHaveBeenCalled();
		expect(detectionRepo.insertMatcherMentionsBatch).toHaveBeenCalledWith(
			expect.objectContaining({
				candidates: [
					{
						entryId: "e-gen",
						pageNumber: 1,
						textSpan: "Gen",
						bboxes: [{ x: 0, y: 10, width: 50, height: 8 }],
					},
				],
			}),
		);
	});

	it("rerun idempotency: no duplicate mentions, and child entry/matcher rows are reused", async () => {
		const candidate = scriptureCandidate({
			matcherId: "m-gen",
			entryId: "e-gen",
			textSpan: "Gen 1:1",
			parserSegments: [{ refText: "1:1", chapter: 1, verseStart: 1, verseEnd: 1 }],
		});
		vi.spyOn(detectionRepo, "getMatcherWithEntry").mockResolvedValue({
			entryId: "e-gen",
			projectId: "proj-1",
			label: "Genesis",
			slug: "genesis",
		});
		vi.spyOn(detectionRepo, "getEntryByProjectTypeAndSlug").mockResolvedValue({
			id: "e-child-1-1",
			parentId: "e-gen",
		});
		vi.spyOn(detectionRepo, "getMatcherByTextAndProjectIndexTypeId").mockResolvedValue({
			id: "mat-1-1",
			entryId: "e-child-1-1",
		});
		vi.spyOn(detectionRepo, "createChildEntry");
		vi.spyOn(detectionRepo, "createMatcher");
		vi.spyOn(detectionRepo, "insertMatcherMentionsBatch").mockResolvedValue(0);

		const result = await resolveAndPersistScriptureCandidates({
			candidates: [candidate],
			context: scriptureContext,
		});

		expect(result.childrenReused).toBe(1);
		expect(result.matchersReused).toBe(1);
		expect(result.mentionsPersisted).toBe(0);
		expect(result.mentionsDeduped).toBe(1);
		expect(detectionRepo.createChildEntry).not.toHaveBeenCalled();
		expect(detectionRepo.createMatcher).not.toHaveBeenCalled();
	});

	it("matcher text conflict case does not mutate existing matcher->entry mapping", async () => {
		const candidate = scriptureCandidate({
			matcherId: "m-gen",
			entryId: "e-gen",
			textSpan: "Gen 3:1",
			parserSegments: [{ refText: "3:1", chapter: 3, verseStart: 1, verseEnd: 1 }],
		});
		vi.spyOn(detectionRepo, "getMatcherWithEntry").mockResolvedValue({
			entryId: "e-gen",
			projectId: "proj-1",
			label: "Genesis",
			slug: "genesis",
		});
		vi.spyOn(detectionRepo, "getEntryByProjectTypeAndSlug").mockResolvedValue(null);
		vi.spyOn(detectionRepo, "createChildEntry").mockResolvedValue("e-gen-3-1");
		vi.spyOn(detectionRepo, "getMatcherByTextAndProjectIndexTypeId")
			.mockResolvedValueOnce({
				id: "mat-other",
				entryId: "e-other-entry",
			})
			.mockResolvedValueOnce(null);
		vi.spyOn(detectionRepo, "createMatcher").mockResolvedValue("mat-new");
		vi.spyOn(detectionRepo, "insertMatcherMentionsBatch").mockResolvedValue(1);

		const result = await resolveAndPersistScriptureCandidates({
			candidates: [candidate],
			context: scriptureContext,
		});

		expect(result.matchersCreated).toBe(1);
		expect(detectionRepo.createMatcher).toHaveBeenCalledWith({
			userId,
			entryId: "e-gen-3-1",
			projectIndexTypeId,
			text: "3:1 (2)",
		});
	});

	it("drops candidate when parent matcher/entry not found and logs resolution_miss", async () => {
		const candidate = scriptureCandidate({ matcherId: "missing" });
		vi.spyOn(detectionRepo, "getMatcherWithEntry").mockResolvedValue(null);
		const insertSpy = vi.spyOn(detectionRepo, "insertMatcherMentionsBatch");

		const result = await resolveAndPersistScriptureCandidates({
			candidates: [candidate],
			context: scriptureContext,
		});

		expect(result.candidatesSeen).toBe(1);
		expect(result.resolutionMisses).toBe(1);
		expect(result.mentionsPersisted).toBe(0);
		expect(insertSpy).not.toHaveBeenCalled();
	});

	it("returns early with resolutionMisses when indexType is not scripture", async () => {
		const candidate = scriptureCandidate();
		const getMatcherSpy = vi.spyOn(detectionRepo, "getMatcherWithEntry");

		const result = await resolveAndPersistScriptureCandidates({
			candidates: [candidate],
			context: { ...scriptureContext, indexType: "subject" },
		});

		expect(result.candidatesSeen).toBe(1);
		expect(result.resolutionMisses).toBe(1);
		expect(getMatcherSpy).not.toHaveBeenCalled();
	});
});
