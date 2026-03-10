import { logEvent } from "../../logger";
import * as detectionRepo from "./detection.repo";
import type { MatcherMentionCandidate } from "./detection.types";

// ============================================================================
// Types (Task 5.1 / 5.3)
// ============================================================================

/** Input from Phase 4 matcher flow (deterministic order). */
export type ResolutionCandidate = MatcherMentionCandidate;

/** Normalized persistence payload for one mention. */
export type ResolvedMentionWrite = {
	entryId: string;
	pageNumber: number;
	textSpan: string;
	bboxes: Array<{ x: number; y: number; width: number; height: number }>;
};

/** Result of resolving and persisting subject candidates (Task 5.1). */
export type SubjectResolutionResult = {
	candidatesSeen: number;
	resolved: number;
	persisted: number;
	deduped: number;
	dropped: number;
	warnings: string[];
};

/** Context for resolution (run + document). */
export type ResolutionContext = {
	userId: string;
	documentId: string;
	detectionRunId: string;
	projectIndexTypeId: string;
	indexType: string;
};

// ============================================================================
// Subject resolution (Task 5.1)
// ============================================================================

const SUBJECT_INDEX_TYPE = "subject";

/**
 * Subject resolution strategy: resolve candidate matcherId to existing matcher
 * in same projectIndexTypeId, derive entryId; do not create entries or matchers.
 * Drops candidate and logs resolution_miss when matcher missing/mismatched.
 * Preserves candidate textSpan, pageNumber, bboxes. Applies Task 4.2 dedupe at insert.
 */
export const resolveAndPersistSubjectCandidates = async ({
	candidates,
	context,
}: {
	candidates: ResolutionCandidate[];
	context: ResolutionContext;
}): Promise<SubjectResolutionResult> => {
	const {
		userId,
		documentId,
		detectionRunId,
		projectIndexTypeId,
		indexType,
	} = context;

	if (indexType !== SUBJECT_INDEX_TYPE) {
		return {
			candidatesSeen: candidates.length,
			resolved: 0,
			persisted: 0,
			deduped: 0,
			dropped: candidates.length,
			warnings: [`Subject resolution only handles indexType "${SUBJECT_INDEX_TYPE}", got "${indexType}"`],
		};
	}

	const candidatesSeen = candidates.length;
	const warnings: string[] = [];
	const toInsert: ResolvedMentionWrite[] = [];

	for (const c of candidates) {
		try {
			const matcher = await detectionRepo.getMatcherByIdAndProjectIndexTypeId({
				userId,
				matcherId: c.matcherId,
				projectIndexTypeId,
			});
			if (!matcher) {
				logEvent({
					event: "detection.resolution_miss",
					context: {
						metadata: {
							reason: "matcher_not_found",
							matcherId: c.matcherId,
							projectIndexTypeId,
							pageNumber: c.pageNumber,
						},
					},
				});
				continue;
			}
			toInsert.push({
				entryId: matcher.entryId,
				pageNumber: c.pageNumber,
				textSpan: c.textSpan,
				bboxes: c.bboxes,
			});
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			warnings.push(`resolution failed matcherId=${c.matcherId} page=${c.pageNumber}: ${message}`);
		}
	}

	const resolved = toInsert.length;
	const dropped = candidatesSeen - resolved;

	if (toInsert.length === 0) {
		return {
			candidatesSeen,
			resolved: 0,
			persisted: 0,
			deduped: 0,
			dropped,
			warnings,
		};
	}

	let persisted: number;
	try {
		persisted = await detectionRepo.insertMatcherMentionsBatch({
			userId,
			documentId,
			detectionRunId,
			projectIndexTypeId,
			candidates: toInsert,
		});
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		warnings.push(`batch insert failed: ${message}`);
		return {
			candidatesSeen,
			resolved,
			persisted: 0,
			deduped: 0,
			dropped,
			warnings,
		};
	}

	const deduped = resolved - persisted;

	return {
		candidatesSeen,
		resolved,
		persisted,
		deduped,
		dropped,
		warnings,
	};
};
