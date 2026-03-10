import "../../test/setup";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as detectionRepo from "./detection.repo";
import {
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
