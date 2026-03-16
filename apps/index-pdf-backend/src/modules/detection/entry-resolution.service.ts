import { logEvent } from "../../logger";
import * as indexMentionRepo from "../index-mention/index-mention.repo";
import {
	DEFAULT_OVERLAP_THRESHOLD,
	type FuzzyExistingMention,
	filterFuzzyDuplicateCandidates,
} from "./bbox-overlap.utils";
import * as detectionRepo from "./detection.repo";
import type {
	MatcherMentionCandidate,
	MatcherMentionParserSegment,
} from "./detection.types";

// ============================================================================
// Types (Task 5.1 / 5.2 / 5.3)
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

/** Context for resolution (run + document). */
export type ResolutionContext = {
	userId: string;
	documentId: string;
	detectionRunId: string;
	projectId: string;
	projectIndexTypeId: string;
	indexType: string;
};

// ----- Task 5.3: Typed resolution outcomes -----

export type ResolvedOutcome = {
	kind: "resolved";
	writes: ResolvedMentionWrite[];
	/** Scripture-only: child entry/matcher metrics for this candidate. */
	metrics?: {
		childrenCreated: number;
		childrenReused: number;
		matchersCreated: number;
		matchersReused: number;
		resolutionMisses: number;
	};
};

export type DroppedOutcome = {
	kind: "dropped";
	reasonCode: string;
	/** When true, count as resolution_miss for scripture metrics. */
	resolutionMiss?: boolean;
};
export type FailedOutcome = { kind: "failed"; reasonCode: string };

export type ResolutionOutcome =
	| ResolvedOutcome
	| DroppedOutcome
	| FailedOutcome;

/** Strategy interface: canHandle(indexType) and resolve(candidate, ctx). */
export type ResolutionStrategy = {
	canHandle(indexType: string): boolean;
	resolve(
		candidate: ResolutionCandidate,
		ctx: ResolutionContext,
	): Promise<ResolutionOutcome>;
};

/** Unified result from resolveAndPersistCandidates (Task 5.3). */
export type ResolutionRunResult = {
	candidatesSeen: number;
	resolved: number;
	persisted: number;
	deduped: number;
	dropped: number;
	failed: number;
	warnings: string[];
	scripture?: {
		childrenCreated: number;
		childrenReused: number;
		matchersCreated: number;
		matchersReused: number;
		resolutionMisses: number;
	};
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

// ============================================================================
// Subject resolution strategy (Task 5.1 / 5.3)
// ============================================================================

const SUBJECT_INDEX_TYPE = "subject";

/**
 * Subject resolution: resolve candidate matcherId to existing matcher in same
 * projectIndexTypeId, derive entryId; do not create entries or matchers.
 */
async function resolveSubjectCandidate(
	candidate: ResolutionCandidate,
	ctx: ResolutionContext,
): Promise<ResolutionOutcome> {
	try {
		const matcher = await detectionRepo.getMatcherByIdAndProjectIndexTypeId({
			userId: ctx.userId,
			matcherId: candidate.matcherId,
			projectIndexTypeId: ctx.projectIndexTypeId,
		});
		if (!matcher) {
			logEvent({
				event: "detection.resolution_miss",
				context: {
					metadata: {
						reason: "matcher_not_found",
						matcherId: candidate.matcherId,
						projectIndexTypeId: ctx.projectIndexTypeId,
						pageNumber: candidate.pageNumber,
					},
				},
			});
			// Fallback: use candidate.entryId from alias (run-all-matchers / alias built at run start)
			// so we still persist mentions when lookup fails (e.g. RLS or timing).
			const entryId = candidate.entryId;
			if (!entryId) {
				return { kind: "dropped", reasonCode: "matcher_not_found" };
			}
			return {
				kind: "resolved",
				writes: [
					{
						entryId,
						pageNumber: candidate.pageNumber,
						textSpan: candidate.textSpan,
						bboxes: candidate.bboxes,
					},
				],
			};
		}
		return {
			kind: "resolved",
			writes: [
				{
					entryId: matcher.entryId,
					pageNumber: candidate.pageNumber,
					textSpan: candidate.textSpan,
					bboxes: candidate.bboxes,
				},
			],
		};
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		return {
			kind: "failed",
			reasonCode: `resolution_error: ${message}`,
		};
	}
}

export const subjectResolutionStrategy: ResolutionStrategy = {
	canHandle(indexType: string): boolean {
		return indexType === SUBJECT_INDEX_TYPE;
	},
	resolve: resolveSubjectCandidate,
};

/**
 * Subject resolution (Task 5.1). Delegates to central orchestration.
 * When indexType is not "subject", returns early with all candidates counted as dropped (no strategy run).
 */
export const resolveAndPersistSubjectCandidates = async ({
	candidates,
	context,
}: {
	candidates: ResolutionCandidate[];
	context: ResolutionContext;
}): Promise<SubjectResolutionResult> => {
	if (context.indexType !== SUBJECT_INDEX_TYPE) {
		return {
			candidatesSeen: candidates.length,
			resolved: 0,
			persisted: 0,
			deduped: 0,
			dropped: candidates.length,
			warnings: [
				`Subject resolution only handles indexType "${SUBJECT_INDEX_TYPE}", got "${context.indexType}"`,
			],
		};
	}
	const result = await resolveAndPersistCandidates({ candidates, context });
	return {
		candidatesSeen: result.candidatesSeen,
		resolved: result.resolved,
		persisted: result.persisted,
		deduped: result.deduped,
		dropped: result.dropped,
		warnings: result.warnings,
	};
};

// ============================================================================
// Scripture resolution strategy (Task 5.2 / 5.3)
// ============================================================================

const SCRIPTURE_INDEX_TYPE = "scripture";

/** Deterministic slug fragment from segment refText (e.g. "1:1-3" -> "1-1-3"). */
function segmentRefToSlug(refText: string): string {
	return (
		refText
			.trim()
			.replace(/[\s:.,;]+/g, "-")
			.replace(/-+/g, "-")
			.replace(/^-+|-+$/g, "")
			.toLowerCase() || "book"
	);
}

/**
 * Build full ref from segment. For verse-list continuations (e.g. "14-15", "23" in
 * "31:1-8, 14-15, 23"), refText is verse-only; prepend chapter when segment has it.
 */
function segmentToFullRef(seg: MatcherMentionParserSegment): string {
	const refText = (seg.refText ?? "").trim();
	if (!refText) return refText;
	// refText already includes chapter (e.g. "31:1-8")
	if (/^\d+[:.]/.test(refText)) return refText;
	// Verse-only continuation: prepend chapter (e.g. "14-15" + chapter 31 → "31:14-15")
	if (seg.chapter != null) return `${seg.chapter}:${refText}`;
	return refText;
}

/** Per-candidate scripture resolution: parent lookup, segment expansion, child entry/matcher create-reuse, writes. */
async function resolveScriptureCandidate(
	candidate: ResolutionCandidate,
	ctx: ResolutionContext,
): Promise<ResolutionOutcome> {
	const { userId, projectId, projectIndexTypeId, detectionRunId } = ctx;
	try {
		// Unknown book path: standalone refs without book context → child entries under Unknown (no matchers)
		if (candidate.isUnknownBook) {
			const segments: MatcherMentionParserSegment[] =
				(candidate.parserSegments?.length ?? 0) > 0
					? (candidate.parserSegments ?? [])
					: candidate.parserSegment
						? [candidate.parserSegment]
						: [];
			const parentEntryId = candidate.entryId;
			const writes: ResolvedMentionWrite[] = [];
			let childrenCreated = 0;
			let childrenReused = 0;

			for (const seg of segments) {
				const refText = seg.refText ?? "";
				const isBookLevel = refText.trim() === "";
				if (isBookLevel) {
					writes.push({
						entryId: parentEntryId,
						pageNumber: candidate.pageNumber,
						textSpan: candidate.textSpan,
						bboxes: candidate.bboxes,
					});
					continue;
				}
				const fullRef = segmentToFullRef(seg);
				const segmentSlug = segmentRefToSlug(fullRef);
				const childSlug = `unknown--${segmentSlug}`;
				const label = fullRef;

				let childEntryId: string;
				const existingChild = await detectionRepo.getEntryByProjectTypeAndSlug({
					userId,
					projectId,
					projectIndexTypeId,
					slug: childSlug,
				});
				if (existingChild && existingChild.parentId === parentEntryId) {
					childEntryId = existingChild.id;
					childrenReused += 1;
				} else {
					childEntryId = await detectionRepo.createChildEntry({
						userId,
						projectId,
						projectIndexTypeId,
						parentId: parentEntryId,
						slug: childSlug,
						label,
						detectionRunId,
					});
					childrenCreated += 1;
				}
				// No matchers for scripture child entries (book or Unknown)—avoids "19-20" matching Exodus:19-20
				writes.push({
					entryId: childEntryId,
					pageNumber: candidate.pageNumber,
					textSpan: candidate.textSpan,
					bboxes: candidate.bboxes,
				});
			}
			if (writes.length === 0)
				return { kind: "dropped", reasonCode: "no_segments" };
			return {
				kind: "resolved",
				writes,
				metrics: {
					childrenCreated,
					childrenReused,
					matchersCreated: 0,
					matchersReused: 0,
					resolutionMisses: 0,
				},
			};
		}

		const parent = await detectionRepo.getMatcherWithEntry({
			userId,
			matcherId: candidate.matcherId,
			projectIndexTypeId,
		});
		if (!parent) {
			logEvent({
				event: "detection.resolution_miss",
				context: {
					metadata: {
						reason: "matcher_or_entry_not_found",
						matcherId: candidate.matcherId,
						projectIndexTypeId,
						pageNumber: candidate.pageNumber,
					},
				},
			});
			return {
				kind: "dropped",
				reasonCode: "matcher_or_entry_not_found",
				resolutionMiss: true,
			};
		}

		const segments: MatcherMentionParserSegment[] =
			(candidate.parserSegments?.length ?? 0) > 0
				? (candidate.parserSegments ?? [])
				: candidate.parserSegment
					? [candidate.parserSegment]
					: [];
		const isFallback = Boolean(candidate.fallbackBookLevel);

		const writes: ResolvedMentionWrite[] = [];
		let childrenCreated = 0;
		let childrenReused = 0;
		const matchersCreated = 0; // Scripture child entries have no matchers
		const matchersReused = 0;

		if (segments.length > 0) {
			for (const seg of segments) {
				const refText = seg.refText ?? "";
				const isBookLevel = refText.trim() === "";

				if (isBookLevel) {
					writes.push({
						entryId: parent.entryId,
						pageNumber: candidate.pageNumber,
						textSpan: candidate.textSpan,
						bboxes: candidate.bboxes,
					});
					continue;
				}

				const fullRef = segmentToFullRef(seg);
				const segmentSlug = segmentRefToSlug(fullRef);
				const childSlug = `${parent.slug}--${segmentSlug}`;
				const label = fullRef;

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
				// No matchers for scripture child entries—avoids "19-20" matching Exodus:19-20
				writes.push({
					entryId: childEntryId,
					pageNumber: candidate.pageNumber,
					textSpan: candidate.textSpan,
					bboxes: candidate.bboxes,
				});
			}
		} else if (isFallback) {
			writes.push({
				entryId: parent.entryId,
				pageNumber: candidate.pageNumber,
				textSpan: candidate.textSpan,
				bboxes: candidate.bboxes,
			});
		}

		if (writes.length === 0) {
			return { kind: "dropped", reasonCode: "no_segments_or_fallback" };
		}

		return {
			kind: "resolved",
			writes,
			metrics: {
				childrenCreated,
				childrenReused,
				matchersCreated,
				matchersReused,
				resolutionMisses: 0,
			},
		};
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		return {
			kind: "failed",
			reasonCode: `scripture_resolution_error: ${message}`,
		};
	}
}

export const scriptureResolutionStrategy: ResolutionStrategy = {
	canHandle(indexType: string): boolean {
		return indexType === SCRIPTURE_INDEX_TYPE;
	},
	resolve: resolveScriptureCandidate,
};

/**
 * Scripture resolution (Task 5.2). Delegates to central orchestration.
 * When indexType is not "scripture", returns early with all candidates as resolutionMisses (no strategy run).
 */
export const resolveAndPersistScriptureCandidates = async ({
	candidates,
	context,
}: {
	candidates: ResolutionCandidate[];
	context: ResolutionContext;
}): Promise<ScriptureResolutionResult> => {
	if (context.indexType !== SCRIPTURE_INDEX_TYPE) {
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
				`Scripture resolution only handles indexType "${SCRIPTURE_INDEX_TYPE}", got "${context.indexType}"`,
			],
		};
	}
	const result = await resolveAndPersistCandidates({ candidates, context });
	const scripture = result.scripture ?? {
		childrenCreated: 0,
		childrenReused: 0,
		matchersCreated: 0,
		matchersReused: 0,
		resolutionMisses: 0,
	};
	return {
		candidatesSeen: result.candidatesSeen,
		childrenCreated: scripture.childrenCreated,
		childrenReused: scripture.childrenReused,
		matchersCreated: scripture.matchersCreated,
		matchersReused: scripture.matchersReused,
		mentionsPersisted: result.persisted,
		mentionsDeduped: result.deduped,
		resolutionMisses: scripture.resolutionMisses,
		warnings: result.warnings,
	};
};

// ============================================================================
// Central orchestration (Task 5.3)
// ============================================================================

const RESOLUTION_STRATEGIES: ResolutionStrategy[] = [
	subjectResolutionStrategy,
	scriptureResolutionStrategy,
];

/**
 * Single integration point: accept deterministic candidate list, dispatch by
 * run indexType to strategy, apply shared dedupe + persistence, aggregate
 * counters/errors for run progress.
 */
export const resolveAndPersistCandidates = async ({
	candidates,
	context,
}: {
	candidates: ResolutionCandidate[];
	context: ResolutionContext;
}): Promise<ResolutionRunResult> => {
	const { userId, documentId, detectionRunId, projectIndexTypeId, indexType } =
		context;

	const strategy = RESOLUTION_STRATEGIES.find((s) => s.canHandle(indexType));

	const candidatesSeen = candidates.length;
	const warnings: string[] = [];
	const allWrites: ResolvedMentionWrite[] = [];
	let resolvedCount = 0;
	let droppedCount = 0;
	let failedCount = 0;
	const scriptureAgg = {
		childrenCreated: 0,
		childrenReused: 0,
		matchersCreated: 0,
		matchersReused: 0,
		resolutionMisses: 0,
	};

	if (!strategy) {
		// Unknown index type: use candidate entryId as-is and persist (legacy fallback)
		warnings.push(
			`No resolution strategy for indexType "${indexType}"; persisting with candidate entryId.`,
		);
		for (const c of candidates) {
			allWrites.push({
				entryId: c.entryId,
				pageNumber: c.pageNumber,
				textSpan: c.textSpan,
				bboxes: c.bboxes,
			});
		}
		resolvedCount = allWrites.length;
		droppedCount = candidatesSeen - resolvedCount;
	} else {
		for (const c of candidates) {
			const outcome = await strategy.resolve(c, context);
			switch (outcome.kind) {
				case "resolved":
					resolvedCount += 1;
					allWrites.push(...outcome.writes);
					if (outcome.metrics) {
						scriptureAgg.childrenCreated += outcome.metrics.childrenCreated;
						scriptureAgg.childrenReused += outcome.metrics.childrenReused;
						scriptureAgg.matchersCreated += outcome.metrics.matchersCreated;
						scriptureAgg.matchersReused += outcome.metrics.matchersReused;
						scriptureAgg.resolutionMisses += outcome.metrics.resolutionMisses;
					}
					break;
				case "dropped":
					droppedCount += 1;
					if (outcome.resolutionMiss && indexType === SCRIPTURE_INDEX_TYPE) {
						scriptureAgg.resolutionMisses += 1;
					}
					break;
				case "failed":
					failedCount += 1;
					warnings.push(
						`matcherId=${c.matcherId} page=${c.pageNumber}: ${outcome.reasonCode}`,
					);
					break;
			}
		}
	}

	const totalWrites = allWrites.length;
	let persisted = 0;
	let fuzzyDedupedCount = 0;
	let writesAfterFuzzy = totalWrites;

	if (allWrites.length > 0) {
		// Load pre-existing mentions for fuzzy bbox dedupe (same doc + type).
		// Use withUserContext so RLS returns rows when called from background detection.
		const existingList =
			await indexMentionRepo.listIndexMentionsWithUserContext({
				userId: context.userId,
				projectId: context.projectId,
				documentId,
				projectIndexTypeIds: [projectIndexTypeId],
				includeDeleted: false,
			});
		const existingForFuzzy: FuzzyExistingMention[] = existingList.map((m) => ({
			pageNumber: m.pageNumber,
			textSpan: m.textSpan,
			bboxes: m.bboxes as FuzzyExistingMention["bboxes"],
			projectIndexTypeId:
				m.indexTypes[0]?.projectIndexTypeId ?? projectIndexTypeId,
		}));
		const existingWithBboxes = existingForFuzzy.filter(
			(e) => e.bboxes != null && e.bboxes.length > 0,
		);

		logEvent({
			event: "detection.fuzzy_dedupe_debug",
			context: {
				metadata: {
					detectionRunId,
					indexType,
					queryParams: {
						projectId: context.projectId,
						documentId,
						projectIndexTypeId,
					},
					existingCount: existingList.length,
					existingWithBboxesCount: existingWithBboxes.length,
					totalWrites,
					existingSample: existingWithBboxes.slice(0, 3).map((e) => ({
						pageNumber: e.pageNumber,
						textSpan: e.textSpan,
						bboxes: e.bboxes,
					})),
					candidatesSample: allWrites.slice(0, 3).map((w) => ({
						pageNumber: w.pageNumber,
						textSpan: w.textSpan,
						bboxes: w.bboxes,
					})),
				},
			},
		});

		const comparisonLog: Array<{
			candidate: { pageNumber: number; textSpan: string; bboxes: unknown };
			existing: { pageNumber: number; textSpan: string; bboxes: unknown };
			overlapRatio: number;
			matched: boolean;
		}> = [];
		const candidatesForFuzzy = allWrites.map((w) => ({
			...w,
			projectIndexTypeId,
		}));
		const passedFuzzy = filterFuzzyDuplicateCandidates(
			candidatesForFuzzy,
			existingForFuzzy,
			{
				overlapThreshold: DEFAULT_OVERLAP_THRESHOLD,
				debugLog: (info) => {
					comparisonLog.push({
						candidate: info.candidate,
						existing: info.existing,
						overlapRatio: info.overlapRatio,
						matched: info.matched,
					});
				},
			},
		);
		const indicesToKeep = new Set(
			passedFuzzy.map((c) =>
				candidatesForFuzzy.indexOf(c as (typeof candidatesForFuzzy)[number]),
			),
		);
		const allWritesFiltered = allWrites.filter((_, i) => indicesToKeep.has(i));
		fuzzyDedupedCount = totalWrites - allWritesFiltered.length;
		writesAfterFuzzy = allWritesFiltered.length;

		logEvent({
			event: "detection.fuzzy_dedupe_result",
			context: {
				metadata: {
					detectionRunId,
					indexType,
					fuzzyDedupedCount,
					passedFuzzyCount: passedFuzzy.length,
					comparisonCount: comparisonLog.length,
					comparisonsSample: comparisonLog.slice(0, 10),
					matchedComparisons: comparisonLog.filter((c) => c.matched),
				},
			},
		});

		try {
			persisted = await detectionRepo.insertMatcherMentionsBatch({
				userId,
				documentId,
				detectionRunId,
				projectIndexTypeId,
				candidates: allWritesFiltered,
			});
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			warnings.push(`batch insert failed: ${message}`);
			logEvent({
				event: "detection.resolution_batch_insert_failed",
				context: {
					metadata: {
						detectionRunId,
						indexType,
						totalWrites,
						error: message,
					},
				},
			});
			return {
				candidatesSeen,
				resolved: resolvedCount,
				persisted: 0,
				deduped: 0,
				dropped: droppedCount,
				failed: failedCount,
				warnings,
				scripture:
					indexType === SCRIPTURE_INDEX_TYPE ? scriptureAgg : undefined,
			};
		}
	}

	// deduped = hash conflicts at insert (within run)
	const deduped = writesAfterFuzzy - persisted;

	logEvent({
		event: "detection.resolution_run_result",
		context: {
			metadata: {
				detectionRunId,
				indexType,
				candidatesSeen,
				resolved: resolvedCount,
				dropped: droppedCount,
				failed: failedCount,
				totalWrites,
				persisted,
				deduped,
				fuzzyDedupedCount,
				...(persisted === 0 &&
					totalWrites > 0 && {
						persistZeroReason: "all_conflicts_or_constraint",
						firstWarning: warnings[0],
					}),
				...(persisted === 0 &&
					totalWrites === 0 && {
						persistZeroReason: "no_writes",
					}),
			},
		},
	});

	return {
		candidatesSeen,
		resolved: resolvedCount,
		persisted,
		deduped,
		dropped: droppedCount,
		failed: failedCount,
		warnings,
		scripture: indexType === SCRIPTURE_INDEX_TYPE ? scriptureAgg : undefined,
	};
};
