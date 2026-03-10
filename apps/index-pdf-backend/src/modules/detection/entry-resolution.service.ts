import { logEvent } from "../../logger";
import * as detectionRepo from "./detection.repo";
import type {
	MatcherMentionCandidate,
	MatcherMentionParserSegment,
} from "./detection.types";

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

/** Result of resolving and persisting scripture candidates (Task 5.2). */
export type ScriptureResolutionResult = {
	candidatesSeen: number;
	childrenCreated: number;
	childrenReused: number;
	matchersCreated: number;
	matchersReused: number;
	mentionsPersisted: number;
	mentionsDeduped: number;
	resolutionMisses: number;
	warnings: string[];
};

/** Context for resolution (run + document). */
export type ResolutionContext = {
	userId: string;
	documentId: string;
	detectionRunId: string;
	projectId: string;
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

// ============================================================================
// Scripture resolution (Task 5.2)
// ============================================================================

const SCRIPTURE_INDEX_TYPE = "scripture";

/** Deterministic slug fragment from segment refText (e.g. "1:1-3" -> "1-1-3"). */
function segmentRefToSlug(refText: string): string {
	return refText
		.trim()
		.replace(/[\s:.,;]+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-+|-+$/g, "")
		.toLowerCase() || "book";
}

/**
 * Scripture resolution strategy: resolve book alias -> parent entry; emit one
 * resolution unit per parsed segment (or one book-level unit for fallback).
 * Create/reuse child entries and matchers; attach one mention per unit.
 */
export const resolveAndPersistScriptureCandidates = async ({
	candidates,
	context,
}: {
	candidates: ResolutionCandidate[];
	context: ResolutionContext;
}): Promise<ScriptureResolutionResult> => {
	const {
		userId,
		documentId,
		detectionRunId,
		projectId,
		projectIndexTypeId,
		indexType,
	} = context;

	if (indexType !== SCRIPTURE_INDEX_TYPE) {
		return {
			candidatesSeen: candidates.length,
			childrenCreated: 0,
			childrenReused: 0,
			matchersCreated: 0,
			matchersReused: 0,
			mentionsPersisted: 0,
			mentionsDeduped: 0,
			resolutionMisses: candidates.length,
			warnings: [
				`Scripture resolution only handles indexType "${SCRIPTURE_INDEX_TYPE}", got "${indexType}"`,
			],
		};
	}

	const candidatesSeen = candidates.length;
	const warnings: string[] = [];
	const toInsert: ResolvedMentionWrite[] = [];
	let childrenCreated = 0;
	let childrenReused = 0;
	let matchersCreated = 0;
	let matchersReused = 0;
	let resolutionMisses = 0;

	for (const c of candidates) {
		try {
			const parent = await detectionRepo.getMatcherWithEntry({
				userId,
				matcherId: c.matcherId,
				projectIndexTypeId,
			});
			if (!parent) {
				resolutionMisses += 1;
				logEvent({
					event: "detection.resolution_miss",
					context: {
						metadata: {
							reason: "matcher_or_entry_not_found",
							matcherId: c.matcherId,
							projectIndexTypeId,
							pageNumber: c.pageNumber,
						},
					},
				});
				continue;
			}

			const segments: MatcherMentionParserSegment[] =
				(c.parserSegments?.length ?? 0) > 0
					? (c.parserSegments ?? [])
					: c.parserSegment
						? [c.parserSegment]
						: [];
			const isFallback = Boolean(c.fallbackBookLevel);

			if (segments.length > 0) {
				for (const seg of segments) {
					const refText = seg.refText ?? "";
					const isBookLevel = refText.trim() === "";

					if (isBookLevel) {
						toInsert.push({
							entryId: parent.entryId,
							pageNumber: c.pageNumber,
							textSpan: c.textSpan,
							bboxes: c.bboxes,
						});
						continue;
					}

					const segmentSlug = segmentRefToSlug(refText);
					const childSlug = `${parent.slug}--${segmentSlug}`;
					const label = refText;

					let childEntryId: string;
					const existingChild = await detectionRepo.getEntryByProjectTypeAndSlug({
						userId,
						projectId,
						projectIndexTypeId,
						slug: childSlug,
					});
					if (existingChild && existingChild.parentId === parent.entryId) {
						childEntryId = existingChild.id;
						childrenReused += 1;
					} else {
						childEntryId = await detectionRepo.createChildEntry({
							userId,
							projectId,
							projectIndexTypeId,
							parentId: parent.entryId,
							slug: childSlug,
							label,
							detectionRunId,
						});
						childrenCreated += 1;
					}

					let matcherText = refText;
					for (let disambiguate = 0; ; disambiguate++) {
						const existingMatcher =
							await detectionRepo.getMatcherByTextAndProjectIndexTypeId({
								userId,
								projectIndexTypeId,
								text: matcherText,
							});
						if (!existingMatcher) {
							await detectionRepo.createMatcher({
								userId,
								entryId: childEntryId,
								projectIndexTypeId,
								text: matcherText,
							});
							matchersCreated += 1;
							break;
						}
						if (existingMatcher.entryId === childEntryId) {
							matchersReused += 1;
							break;
						}
						matcherText =
							disambiguate === 0
								? `${refText} (2)`
								: `${refText} (${disambiguate + 2})`;
					}

					toInsert.push({
						entryId: childEntryId,
						pageNumber: c.pageNumber,
						textSpan: c.textSpan,
						bboxes: c.bboxes,
					});
				}
			} else if (isFallback) {
				toInsert.push({
					entryId: parent.entryId,
					pageNumber: c.pageNumber,
					textSpan: c.textSpan,
					bboxes: c.bboxes,
				});
			}
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			warnings.push(
				`scripture resolution failed matcherId=${c.matcherId} page=${c.pageNumber}: ${message}`,
			);
		}
	}

	if (toInsert.length === 0) {
		return {
			candidatesSeen,
			childrenCreated,
			childrenReused,
			matchersCreated,
			matchersReused,
			mentionsPersisted: 0,
			mentionsDeduped: 0,
			resolutionMisses,
			warnings,
		};
	}

	let mentionsPersisted: number;
	try {
		mentionsPersisted = await detectionRepo.insertMatcherMentionsBatch({
			userId,
			documentId,
			detectionRunId,
			projectIndexTypeId,
			candidates: toInsert,
		});
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		warnings.push(`scripture batch insert failed: ${message}`);
		return {
			candidatesSeen,
			childrenCreated,
			childrenReused,
			matchersCreated,
			matchersReused,
			mentionsPersisted: 0,
			mentionsDeduped: 0,
			resolutionMisses,
			warnings,
		};
	}

	const mentionsDeduped = toInsert.length - mentionsPersisted;

	return {
		candidatesSeen,
		childrenCreated,
		childrenReused,
		matchersCreated,
		matchersReused,
		mentionsPersisted,
		mentionsDeduped,
		resolutionMisses,
		warnings,
	};
};
