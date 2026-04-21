import crypto from "node:crypto";
import path from "node:path";
import type { ParserProfile } from "@pubint/core";
import { getParserProfile } from "@pubint/core";
import { logEvent } from "../../logger";
import { listRules } from "../canonical-page-rule/canonical-page-rule.repo";
import * as indexMentionRepo from "../index-mention/index-mention.repo";
import {
	getSourceDocumentById,
	listSourceDocumentsByProject,
} from "../source-document/source-document.repo";
import { getUserSettings } from "../user-settings/user-settings.repo";
import { buildAliasIndex, scanTextWithAliasIndex } from "./alias-engine";
import type { ResolvedAliasMatch } from "./alias-engine.types";
import { buildDedupeKey } from "./bbox-canonical.utils";
import {
	DEFAULT_OVERLAP_THRESHOLD,
	type FuzzyExistingMention,
	filterFuzzyDuplicateCandidates,
} from "./bbox-overlap.utils";
import { mapPositionsToBBoxes } from "./charAt-mapping.utils";
import * as detectionRepo from "./detection.repo";
import type {
	CreateLlmDetectionRunInput,
	CreateMatcherDetectionRunInput,
	DetectionRun,
	DetectionRunListItem,
	MatcherMentionCandidate,
	RunLlmInput,
	RunMatcherInput,
} from "./detection.types";
import { resolveAndPersistCandidates } from "./entry-resolution.service";
import * as indexEntryGroupRepo from "./index-entry-group.repo";
import { callLLMForDetection } from "./llm-detection.client";
import { resolvePageIdToDocumentPageNumber } from "./page-id.utils";
import { buildDetectionPrompt } from "./prompt.utils";
import { runScriptureDetectionOnPage } from "./scripture-detection-on-page";
import {
	buildPromptText,
	buildSearchablePageText,
	extractPages,
	type PageMemory,
	type Region,
	recalculateCharPositionsForIndexable,
} from "./text-extraction.utils";
import { searchMentionsInText } from "./text-search.utils";

// ============================================================================
// Service Layer - Business Logic
// ============================================================================

type ProcessFn = (args: { userId: string; runId: string }) => Promise<void>;

const createRunAndStartBackgroundProcess = async ({
	userId,
	runInput,
	processFn,
}: {
	userId: string;
	runInput: CreateLlmDetectionRunInput | CreateMatcherDetectionRunInput;
	processFn: ProcessFn;
}): Promise<{ runId: string }> => {
	const run = await detectionRepo.createDetectionRun({
		userId,
		input: runInput,
	});

	processFn({ userId, runId: run.id }).catch((err) => {
		const errorMessage = err instanceof Error ? err.message : String(err);
		const stack = err instanceof Error ? err.stack : undefined;
		logEvent({
			event: "detection.processing_error",
			context: {
				userId,
				metadata: {
					runId: run.id,
					error: errorMessage,
					...(stack && { stack }),
				},
				error: err instanceof Error ? err : new Error(String(err)),
			},
		});
		detectionRepo
			.updateDetectionRunStatus({
				userId,
				input: {
					runId: run.id,
					status: "failed",
					finishedAt: new Date(),
					errorMessage: err instanceof Error ? err.message : String(err),
				},
			})
			.catch((e) =>
				logEvent({
					event: "detection.run_status_update_failed",
					context: {
						userId,
						metadata: { runId: run.id, error: String(e) },
					},
				}),
			);
	});

	return { runId: run.id };
};

export const runLlm = async ({
	userId,
	input,
}: {
	userId: string;
	input: RunLlmInput;
}): Promise<{ runId: string }> => {
	const sourceDocuments = await listSourceDocumentsByProject({
		projectId: input.projectId,
		userId,
	});

	if (sourceDocuments.length === 0) {
		throw new Error("No source document found for this project");
	}

	const sourceDocListItem = sourceDocuments[0];

	if (!sourceDocListItem.page_count) {
		throw new Error("Source document has no page count");
	}

	const settingsHash = calculateSettingsHash({
		projectId: input.projectId,
		indexType: input.indexType,
		model: input.model,
	});

	if (
		input.pageRangeStart &&
		input.pageRangeStart > sourceDocListItem.page_count
	) {
		throw new Error(
			`Page range start (${input.pageRangeStart}) exceeds document page count (${sourceDocListItem.page_count})`,
		);
	}
	if (input.pageRangeEnd && input.pageRangeEnd > sourceDocListItem.page_count) {
		throw new Error(
			`Page range end (${input.pageRangeEnd}) exceeds document page count (${sourceDocListItem.page_count})`,
		);
	}

	const runInput: CreateLlmDetectionRunInput = {
		projectId: input.projectId,
		indexType: input.indexType,
		model: input.model,
		promptVersion: input.promptVersion,
		settingsHash,
		totalPages: sourceDocListItem.page_count,
		pageRangeStart: input.pageRangeStart,
		pageRangeEnd: input.pageRangeEnd,
	};

	return createRunAndStartBackgroundProcess({
		userId,
		runInput,
		processFn: processDetection,
	});
};

export const runMatcher = async ({
	userId,
	input,
}: {
	userId: string;
	input: RunMatcherInput;
}): Promise<{ runId: string }> => {
	const sourceDocuments = await listSourceDocumentsByProject({
		projectId: input.projectId,
		userId,
	});

	if (sourceDocuments.length === 0) {
		throw new Error("No source document found for this project");
	}

	const sourceDocListItem = sourceDocuments[0];
	if (
		sourceDocListItem.page_count == null ||
		sourceDocListItem.page_count < 1
	) {
		throw new Error(
			"Source document has no page count or has zero pages; matcher detection cannot run",
		);
	}
	// Use actual document page count for both scopes so resolvePageIdToDocumentPageNumber
	// can find the correct page when scope is "page".
	const totalPages = sourceDocListItem.page_count ?? 1;

	if (
		input.scope === "project" &&
		sourceDocListItem.page_count != null &&
		sourceDocListItem.page_count >= 1
	) {
		if (
			input.pageRangeStart != null &&
			input.pageRangeStart > sourceDocListItem.page_count
		) {
			throw new Error(
				`Page range start (${input.pageRangeStart}) exceeds document page count (${sourceDocListItem.page_count})`,
			);
		}
		if (
			input.pageRangeEnd != null &&
			input.pageRangeEnd > sourceDocListItem.page_count
		) {
			throw new Error(
				`Page range end (${input.pageRangeEnd}) exceeds document page count (${sourceDocListItem.page_count})`,
			);
		}
	}

	const settingsHash = calculateMatcherSettingsHash({
		projectId: input.projectId,
		indexType: input.indexType,
		scope: input.scope,
		pageId: input.pageId,
		indexEntryGroupIds: input.indexEntryGroupIds,
		runAllGroups: input.runAllGroups,
		pageRangeStart: input.pageRangeStart,
		pageRangeEnd: input.pageRangeEnd,
	});

	const runInput: CreateMatcherDetectionRunInput = {
		projectId: input.projectId,
		indexType: input.indexType,
		scope: input.scope,
		pageId: input.pageId,
		indexEntryGroupIds: input.indexEntryGroupIds,
		runAllGroups: input.runAllGroups,
		pageRangeStart: input.pageRangeStart,
		pageRangeEnd: input.pageRangeEnd,
		settingsHash,
		totalPages,
	};

	return createRunAndStartBackgroundProcess({
		userId,
		runInput,
		processFn: processMatcher,
	});
};

export const getDetectionRun = async ({
	userId,
	runId,
}: {
	userId: string;
	runId: string;
}): Promise<DetectionRun | null> => {
	return await detectionRepo.getDetectionRun({ userId, runId });
};

export const listDetectionRuns = async ({
	userId,
	projectId,
}: {
	userId: string;
	projectId: string;
}): Promise<DetectionRunListItem[]> => {
	return await detectionRepo.listDetectionRuns({ userId, projectId });
};

export const cancelDetectionRun = async ({
	userId,
	runId,
}: {
	userId: string;
	runId: string;
}): Promise<void> => {
	await detectionRepo.cancelDetectionRun({ userId, runId });
};

// ============================================================================
// Helper Functions
// ============================================================================

const isPageExcluded = ({
	pageNumber,
	canonicalPageRules,
}: {
	pageNumber: number;
	canonicalPageRules: Array<{
		ruleType: "positive" | "negative";
		documentPageStart: number;
		documentPageEnd: number;
	}>;
}): boolean => {
	return canonicalPageRules.some(
		(rule) =>
			rule.ruleType === "negative" &&
			pageNumber >= rule.documentPageStart &&
			pageNumber <= rule.documentPageEnd,
	);
};

const calculatePagesToProcess = ({
	totalPages,
	pageRangeStart,
	pageRangeEnd,
	canonicalPageRules,
}: {
	totalPages: number;
	pageRangeStart?: number | null;
	pageRangeEnd?: number | null;
	canonicalPageRules: Array<{
		ruleType: "positive" | "negative";
		documentPageStart: number;
		documentPageEnd: number;
	}>;
}): {
	pagesToProcess: number[];
	contextPagesNeeded: Set<number>;
} => {
	// Determine the range to process
	const startPage = pageRangeStart || 1;
	const endPage = pageRangeEnd || totalPages;

	const pagesToProcess: number[] = [];
	const contextPagesNeeded = new Set<number>();

	for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
		// Skip pages that are excluded by negative canonical page rules
		if (isPageExcluded({ pageNumber: pageNum, canonicalPageRules })) {
			continue;
		}

		pagesToProcess.push(pageNum);

		// Add context pages (page before and after) if they exist and aren't excluded
		const prevPage = pageNum - 1;
		const nextPage = pageNum + 1;

		if (
			prevPage >= 1 &&
			!isPageExcluded({ pageNumber: prevPage, canonicalPageRules })
		) {
			contextPagesNeeded.add(prevPage);
		}

		if (
			nextPage <= totalPages &&
			!isPageExcluded({ pageNumber: nextPage, canonicalPageRules })
		) {
			contextPagesNeeded.add(nextPage);
		}
	}

	return { pagesToProcess, contextPagesNeeded };
};

/**
 * Deterministic order: pageNumber asc, charStart asc, longer span first (charEnd - charStart desc), stable groupId tiebreaker (Task 6.2).
 * Exported for tests (determinism and ordering).
 */
export function sortMatcherCandidates(
	candidates: MatcherMentionCandidate[],
): void {
	candidates.sort((a, b) => {
		if (a.pageNumber !== b.pageNumber) return a.pageNumber - b.pageNumber;
		if (a.charStart !== b.charStart) return a.charStart - b.charStart;
		const lenA = a.charEnd - a.charStart;
		const lenB = b.charEnd - b.charStart;
		if (lenA !== lenB) return lenB - lenA;
		return a.groupId.localeCompare(b.groupId);
	});
}

/**
 * In-memory dedupe: same projectIndexTypeId + matcherId + pageNumber + canonical bbox => one candidate.
 * When parsed and fallback collide on same key, prefer parsed (Task 4.3). Exported for tests.
 */
export function dedupeMatcherCandidates(
	candidates: MatcherMentionCandidate[],
	projectIndexTypeId: string,
): MatcherMentionCandidate[] {
	const candidateByKey = new Map<string, MatcherMentionCandidate>();
	for (const c of candidates) {
		const key = buildDedupeKey({
			projectIndexTypeId,
			matcherId: c.matcherId,
			pageNumber: c.pageNumber,
			charStart: c.charStart,
			bboxes: c.bboxes,
		});
		const existing = candidateByKey.get(key);
		if (!existing) {
			candidateByKey.set(key, c);
		} else if (c.fallbackBookLevel && !existing.fallbackBookLevel) {
			// Keep existing (parsed)
		} else if (!c.fallbackBookLevel && existing.fallbackBookLevel) {
			candidateByKey.set(key, c);
		}
		// else both same type, keep first (existing)
	}
	const out = Array.from(candidateByKey.values());
	sortMatcherCandidates(out);
	return out;
}

const processMatcher = async ({
	userId,
	runId,
}: {
	userId: string;
	runId: string;
}): Promise<void> => {
	const run = await detectionRepo.getDetectionRun({ userId, runId });

	if (!run) {
		throw new Error("Detection run not found");
	}

	if (
		run.runType !== "matcher" ||
		run.settingsHash == null ||
		run.totalPages == null
	) {
		throw new Error(
			"Detection run is not a matcher run or is missing required fields",
		);
	}

	await detectionRepo.updateDetectionRunStatus({
		userId,
		input: {
			runId,
			status: "running",
			startedAt: new Date(),
		},
	});

	const sourceDocuments = await listSourceDocumentsByProject({
		projectId: run.projectId,
		userId,
	});

	if (sourceDocuments.length === 0) {
		throw new Error("No source document found for this project");
	}

	const sourceDocListItem = sourceDocuments[0];
	const sourceDoc = await getSourceDocumentById({
		userId,
		documentId: sourceDocListItem.id,
	});

	if (!sourceDoc) {
		throw new Error("Source document not found");
	}

	if (!sourceDoc.storage_key) {
		throw new Error("Source document has no storage path");
	}

	const BASE_STORAGE_PATH = path.join(
		process.cwd(),
		".data",
		"source-documents",
	);
	const pdfPath = path.join(BASE_STORAGE_PATH, sourceDoc.storage_key);

	const canonicalPageRules = await listRules({
		projectId: run.projectId,
		includeDeleted: false,
	});

	const projectIndexTypeId = await detectionRepo.getProjectIndexTypeByType({
		userId,
		projectId: run.projectId,
		indexType: run.indexType,
	});

	if (!projectIndexTypeId) {
		await detectionRepo.updateDetectionRunStatus({
			userId,
			input: {
				runId,
				status: "failed",
				finishedAt: new Date(),
				errorMessage: `Project index type not found for ${run.indexType}`,
			},
		});
		return;
	}

	// Run input resolution: resolve group IDs. When empty with runAllGroups (no groups), treat as run-all-matchers (Task 8.1.1).
	const groupIds = await indexEntryGroupRepo.resolveRunGroupIds({
		userId,
		projectId: run.projectId,
		projectIndexTypeId,
		indexEntryGroupIds: run.indexEntryGroupIds,
		runAllGroups: run.runAllGroups,
	});

	const runAllMatchers = groupIds.length === 0;

	// Parser profile is per index type: scripture uses scripture-biblical, else alias-only.
	const runProfile: ParserProfile | null =
		run.indexType === "scripture"
			? (getParserProfile("scripture-biblical") ?? null)
			: null;

	const aliases = await detectionRepo.listMatcherAliasesForRun({
		userId,
		projectId: run.projectId,
		projectIndexTypeId,
		indexType: run.indexType,
		indexEntryGroupIds: run.indexEntryGroupIds,
		runAllGroups: run.runAllGroups,
	});

	// Run snapshot: unique matcher IDs for coverage skip (Task 6.3). Per-page alias index built from filtered aliases.
	const runMatcherIds = [...new Set(aliases.map((a) => a.matcherId))];

	// Task 6.3: coverage skip observability
	let matchersSkippedByCoverage = 0;
	let pagesFullySkipped = 0;
	const processedPageMatchers: Array<{
		pageNumber: number;
		matcherId: string;
	}> = [];
	const skippedForLog: Array<{ pageNumber: number; matcherId: string }> = [];
	const DEBUG_SKIPPED_LOG_LIMIT = 5;

	logEvent({
		event: "detection.matcher_run_started",
		context: {
			userId,
			metadata: {
				runId,
				groupIds,
				groupCount: groupIds.length,
				runAllMatchers,
				matcherCount: aliases.length,
				matchersConsidered: runMatcherIds.length,
			},
		},
	});

	// Scope: project = canonical-allowed pages in range; page = single page from pageId (Task 6.2).
	let pagesToProcess: number[];
	if (run.scope === "page") {
		if (!run.pageId) {
			await detectionRepo.updateDetectionRunStatus({
				userId,
				input: {
					runId,
					status: "failed",
					finishedAt: new Date(),
					errorMessage: "pageId is required when scope is page",
				},
			});
			return;
		}
		const resolvedPage = resolvePageIdToDocumentPageNumber(
			sourceDoc.id,
			run.pageId,
			run.totalPages,
		);
		if (resolvedPage == null) {
			await detectionRepo.updateDetectionRunStatus({
				userId,
				input: {
					runId,
					status: "failed",
					finishedAt: new Date(),
					errorMessage: "Invalid or out-of-range pageId for this document",
				},
			});
			return;
		}
		// Apply canonical rules: if this page is excluded, process nothing.
		const isExcluded = isPageExcluded({
			pageNumber: resolvedPage,
			canonicalPageRules,
		});
		pagesToProcess = isExcluded ? [] : [resolvedPage];
	} else {
		const { pagesToProcess: pages } = calculatePagesToProcess({
			totalPages: run.totalPages,
			pageRangeStart: run.pageRangeStart,
			pageRangeEnd: run.pageRangeEnd,
			canonicalPageRules,
		});
		pagesToProcess = pages;
	}

	if (pagesToProcess.length === 0) {
		logEvent({
			event: "detection.matcher_run_completed",
			context: {
				userId,
				metadata: {
					runId,
					mentionsCreated: 0,
					reason: "no_pages_to_process",
					totalPages: run.totalPages,
				},
			},
		});
		await detectionRepo.updateDetectionRunStatus({
			userId,
			input: {
				runId,
				status: "completed",
				finishedAt: new Date(),
			},
		});
		return;
	}

	logEvent({
		event: "detection.matcher_run_pages_scheduled",
		context: {
			userId,
			metadata: {
				runId,
				pageCount: pagesToProcess.length,
			},
		},
	});

	const excludeRegions: Region[] = [];
	const pageMemory: PageMemory = { pages: new Map() };
	const allCandidates: MatcherMentionCandidate[] = [];

	for (const pageNum of pagesToProcess) {
		if (pageNum === 1 || pageNum % 50 === 0) {
			logEvent({
				event: "detection.matcher_run_page_progress",
				context: {
					userId,
					metadata: { runId, pageNum, totalPages: pagesToProcess.length },
				},
			});
		}

		const currentRun = await detectionRepo.getDetectionRun({
			userId,
			runId,
		});
		if (currentRun?.status === "cancelled") {
			return;
		}

		// Task 6.3: skip already-covered matcher/page pairs
		const coveredMatcherIds = await detectionRepo.getCoveredMatcherIdsForPage({
			userId,
			projectIndexTypeId,
			documentId: sourceDoc.id,
			pageNumber: pageNum,
			matcherIds: runMatcherIds,
		});
		matchersSkippedByCoverage += coveredMatcherIds.size;
		for (const mid of coveredMatcherIds) {
			skippedForLog.push({ pageNumber: pageNum, matcherId: mid });
		}
		if (coveredMatcherIds.size === runMatcherIds.length) {
			pagesFullySkipped++;
			await detectionRepo.updateDetectionRunProgress({
				userId,
				input: {
					runId,
					progressPage: pageNum,
					mentionsCreated: allCandidates.length,
				},
			});
			continue;
		}
		const uncoveredMatcherIds = runMatcherIds.filter(
			(id) => !coveredMatcherIds.has(id),
		);
		const filteredAliases = aliases.filter((a) =>
			uncoveredMatcherIds.includes(a.matcherId),
		);
		const pageAliasIndex = buildAliasIndex(filteredAliases);
		for (const mid of uncoveredMatcherIds) {
			processedPageMatchers.push({ pageNumber: pageNum, matcherId: mid });
		}

		const pagesToExtract = pageMemory.pages.has(pageNum) ? [] : [pageNum];
		if (pagesToExtract.length > 0) {
			if (pageNum === 1) {
				logEvent({
					event: "detection.matcher_run_extract_start",
					context: {
						userId,
						metadata: { runId, pageNum },
					},
				});
			}
			const extracted = await extractPages({
				pdfPath,
				pageNumbers: pagesToExtract,
				excludeRegions,
			});
			if (pageNum === 1) {
				logEvent({
					event: "detection.matcher_run_extract_done",
					context: {
						userId,
						metadata: { runId, pageNum },
					},
				});
			}
			for (const [p, atoms] of extracted) {
				pageMemory.pages.set(p, atoms);
			}
		}

		const atoms = pageMemory.pages.get(pageNum) ?? [];
		const searchableText = buildSearchablePageText({ atoms });
		const indexableAtomsWithCorrectedPositions =
			recalculateCharPositionsForIndexable({ atoms });

		const matches: ResolvedAliasMatch[] = scanTextWithAliasIndex(
			searchableText,
			pageAliasIndex,
		);

		const detectionResult = runScriptureDetectionOnPage(
			searchableText,
			matches,
			runProfile,
		);

		// Map alias-attached spans to candidates (with bboxes)
		const aliasMentionsWithPositions = detectionResult.aliasAttached.map(
			(span) => ({
				mention: {
					entryLabel: "",
					indexType: span.indexType,
					pageNumber: pageNum,
					textSpan: searchableText.slice(span.pageCharStart, span.pageCharEnd),
				},
				charStart: span.pageCharStart,
				charEnd: span.pageCharEnd,
			}),
		);
		const { mapped: aliasMapped } = mapPositionsToBBoxes({
			mentionsWithPositions: aliasMentionsWithPositions,
			textAtoms: indexableAtomsWithCorrectedPositions,
		});
		for (let i = 0; i < detectionResult.aliasAttached.length; i++) {
			const span = detectionResult.aliasAttached[i];
			const withBbox = aliasMapped[i];
			if (!withBbox) continue;
			allCandidates.push({
				pageNumber: pageNum,
				groupId: span.groupId,
				matcherId: span.matcherId,
				entryId: span.entryId,
				indexType: span.indexType,
				textSpan: withBbox.textSpan,
				charStart: span.pageCharStart,
				charEnd: span.pageCharEnd,
				bboxes: withBbox.bboxes,
				...(span.segments.length > 0 && { parserSegments: span.segments }),
				...(span.fallbackBookLevel && { fallbackBookLevel: true }),
			});
		}

		// Standalone ref scan → Unknown: refs without book in alias window (scripture only)
		// Break into segments (e.g. "31:1-8, 14-15, 23" → three mentions on child entries)
		if (run.indexType === "scripture" && runProfile) {
			const unknownEntryId = await detectionRepo.getUnknownBookEntryForProject({
				userId,
				projectId: run.projectId,
				projectIndexTypeId,
			});

			for (const ref of detectionResult.unknownSpans) {
				const segTextSpan = searchableText.slice(
					ref.pageCharStart,
					ref.pageCharEnd,
				);
				const segMentionsWithPositions = [
					{
						mention: {
							entryLabel: "",
							indexType: run.indexType,
							pageNumber: pageNum,
							textSpan: segTextSpan,
						},
						charStart: ref.pageCharStart,
						charEnd: ref.pageCharEnd,
					},
				];
				const { mapped: segBboxes } = mapPositionsToBBoxes({
					mentionsWithPositions: segMentionsWithPositions,
					textAtoms: indexableAtomsWithCorrectedPositions,
				});
				const segWithBbox = segBboxes.find(
					(m) => m.pageNumber === pageNum && m.textSpan === segTextSpan,
				);
				if (segWithBbox) {
					allCandidates.push({
						pageNumber: pageNum,
						groupId: "unknown",
						matcherId: unknownEntryId,
						entryId: unknownEntryId,
						indexType: run.indexType,
						textSpan: segWithBbox.textSpan,
						charStart: ref.pageCharStart,
						charEnd: ref.pageCharEnd,
						bboxes: segWithBbox.bboxes,
						parserSegments: ref.segments,
						isUnknownBook: true,
					});
				}
			}
		}

		await detectionRepo.updateDetectionRunProgress({
			userId,
			input: {
				runId,
				progressPage: pageNum,
				mentionsCreated: allCandidates.length,
			},
		});
	}

	sortMatcherCandidates(allCandidates);

	const dedupedCandidates = dedupeMatcherCandidates(
		allCandidates,
		projectIndexTypeId,
	);

	logEvent({
		event: "detection.matcher_run_loop_done",
		context: {
			userId,
			metadata: {
				runId,
				candidatesCollected: allCandidates.length,
			},
		},
	});

	const resolutionContext = {
		userId,
		documentId: sourceDoc.id,
		detectionRunId: runId,
		projectId: run.projectId,
		projectIndexTypeId,
		indexType: run.indexType,
	};
	const resolutionResult = await resolveAndPersistCandidates({
		candidates: dedupedCandidates,
		context: resolutionContext,
	});
	const mentionsCreated = resolutionResult.persisted;

	// Task 6.3: write coverage only after persistence; do not write if run was cancelled
	// TODO: re-enable coverage once detection runs are producing mentions.
	// const finalRun = await detectionRepo.getDetectionRun({ userId, runId });
	// let coverageRowsWritten = 0;
	// if (finalRun?.status !== "cancelled" && processedPageMatchers.length > 0) {
	// 	coverageRowsWritten = await detectionRepo.upsertMatcherPageCoverage({
	// 		userId,
	// 		runId,
	// 		projectId: run.projectId,
	// 		projectIndexTypeId,
	// 		documentId: sourceDoc.id,
	// 		rows: processedPageMatchers,
	// 	});
	// }

	// Observability: aggregated counts (Task 6.2) + coverage (Task 6.3)
	const segmentsEmitted = allCandidates.filter(
		(c) => c.parserSegments && c.parserSegments.length > 0,
	).length;
	const fallbacksEmitted = allCandidates.filter(
		(c) => c.fallbackBookLevel === true,
	).length;
	logEvent({
		event: "detection.matcher_run_completed",
		context: {
			userId,
			metadata: {
				runId,
				mentionsCreated,
				candidatesCollected: allCandidates.length,
				afterDedupe: dedupedCandidates.length,
				segmentsEmitted,
				fallbacksEmitted,
				matchersConsidered: runMatcherIds.length,
				matchersSkippedByCoverage,
				pagesFullySkipped,
				// TODO: re-enable coverage once detection runs are producing mentions.
				// coverageRowsWritten,
			},
		},
	});
	if (skippedForLog.length > 0) {
		const firstSkipped = skippedForLog.slice(0, DEBUG_SKIPPED_LOG_LIMIT);
		logEvent({
			event: "detection.matcher_coverage_skipped_debug",
			context: {
				userId,
				metadata: {
					runId,
					firstSkippedPageMatcherPairs: firstSkipped,
					totalSkippedPairs: skippedForLog.length,
				},
			},
		});
	}

	await detectionRepo.updateDetectionRunStatus({
		userId,
		input: {
			runId,
			status: "completed",
			finishedAt: new Date(),
			mentionsCreated,
		},
	});
};

const processDetection = async ({
	userId,
	runId,
}: {
	userId: string;
	runId: string;
}): Promise<void> => {
	const run = await detectionRepo.getDetectionRun({ userId, runId });

	if (!run) {
		throw new Error("Detection run not found");
	}

	if (
		run.runType !== "llm" ||
		run.model == null ||
		run.promptVersion == null ||
		run.settingsHash == null
	) {
		throw new Error(
			"Detection run is not an LLM run or is missing required fields",
		);
	}

	// Update status to running
	await detectionRepo.updateDetectionRunStatus({
		userId,
		input: {
			runId,
			status: "running",
			startedAt: new Date(),
		},
	});

	const sourceDocuments = await listSourceDocumentsByProject({
		projectId: run.projectId,
		userId,
	});

	if (sourceDocuments.length === 0) {
		throw new Error("No source document found for this project");
	}

	const sourceDocListItem = sourceDocuments[0];

	// Get full source document with storage_key
	const sourceDoc = await getSourceDocumentById({
		userId,
		documentId: sourceDocListItem.id,
	});

	if (!sourceDoc) {
		throw new Error("Source document not found");
	}

	if (!sourceDoc.storage_key) {
		throw new Error("Source document has no storage path");
	}

	// Construct full path to PDF file
	const BASE_STORAGE_PATH = path.join(
		process.cwd(),
		".data",
		"source-documents",
	);
	const pdfPath = path.join(BASE_STORAGE_PATH, sourceDoc.storage_key);

	// Get canonical page rules to check for excluded pages
	const canonicalPageRules = await listRules({
		projectId: run.projectId,
		includeDeleted: false,
	});

	// Get user settings for API key
	const userSettings = await getUserSettings({ userId });

	const apiKey = userSettings?.openrouterApiKey || undefined;

	// TODO: Get exclude regions from database
	const excludeRegions: Region[] = [];

	if (!run.totalPages) {
		throw new Error("Detection run has no total pages");
	}

	// Calculate which pages to process and which context pages are needed
	const { pagesToProcess, contextPagesNeeded } = calculatePagesToProcess({
		totalPages: run.totalPages,
		pageRangeStart: run.pageRangeStart,
		pageRangeEnd: run.pageRangeEnd,
		canonicalPageRules,
	});

	if (pagesToProcess.length === 0) {
		throw new Error("No pages to process (all pages may be excluded)");
	}

	// Initialize page memory
	const pageMemory: PageMemory = { pages: new Map() };

	// Pre-extract initial pages (first 2 pages to process + their context)
	const firstPage = pagesToProcess[0];
	const secondPage = pagesToProcess.length > 1 ? pagesToProcess[1] : null;

	const initialPagesToExtract = new Set<number>();
	initialPagesToExtract.add(firstPage);
	if (secondPage) initialPagesToExtract.add(secondPage);

	// Add context pages for the initial pages
	if (contextPagesNeeded.has(firstPage - 1)) {
		initialPagesToExtract.add(firstPage - 1);
	}
	if (contextPagesNeeded.has(firstPage + 1)) {
		initialPagesToExtract.add(firstPage + 1);
	}
	if (secondPage && contextPagesNeeded.has(secondPage + 1)) {
		initialPagesToExtract.add(secondPage + 1);
	}

	const initialPages = await extractPages({
		pdfPath,
		pageNumbers: Array.from(initialPagesToExtract),
		excludeRegions,
	});

	for (const [pageNum, atoms] of initialPages) {
		pageMemory.pages.set(pageNum, atoms);
	}

	// Load pre-existing mentions for fuzzy bbox dedupe (all types for this document).
	// Use withUserContext so RLS returns rows when called from background detection.
	const existingMentionsList =
		await indexMentionRepo.listIndexMentionsWithUserContext({
			userId,
			projectId: run.projectId,
			documentId: sourceDoc.id,
			includeDeleted: false,
		});
	const existingForFuzzyDoc: FuzzyExistingMention[] = existingMentionsList.map(
		(m) => ({
			pageNumber: m.pageNumber,
			textSpan: m.textSpan,
			bboxes: m.bboxes as FuzzyExistingMention["bboxes"],
			projectIndexTypeId: m.indexTypes[0]?.projectIndexTypeId ?? "",
		}),
	);

	// Process each page with sliding window
	for (const pageNum of pagesToProcess) {
		// Check if cancelled
		const currentRun = await detectionRepo.getDetectionRun({ userId, runId });
		if (currentRun?.status === "cancelled") {
			return;
		}

		// Ensure we have the context pages for this page
		const contextPagesBefore = pageNum - 1;
		const contextPagesAfter = pageNum + 1;

		const pagesToEnsure: number[] = [];

		if (
			contextPagesBefore >= 1 &&
			contextPagesNeeded.has(contextPagesBefore) &&
			!pageMemory.pages.has(contextPagesBefore)
		) {
			pagesToEnsure.push(contextPagesBefore);
		}

		if (
			contextPagesAfter <= run.totalPages &&
			contextPagesNeeded.has(contextPagesAfter) &&
			!pageMemory.pages.has(contextPagesAfter)
		) {
			pagesToEnsure.push(contextPagesAfter);
		}

		// Extract any missing context pages
		if (pagesToEnsure.length > 0) {
			const additionalPages = await extractPages({
				pdfPath,
				pageNumbers: pagesToEnsure,
				excludeRegions,
			});

			for (const [extractedPageNum, atoms] of additionalPages) {
				pageMemory.pages.set(extractedPageNum, atoms);
			}
		}

		// Build prompt text (uses 25% context, 100% current)
		const promptText = buildPromptText({ pageMemory, currentPage: pageNum });

		// Build detection prompt
		const prompt = buildDetectionPrompt({
			pageTexts: {
				previous: promptText.previousContext,
				current: promptText.currentPage,
				next: promptText.nextContext,
			},
			indexType: run.indexType,
			primaryPageNumber: pageNum,
		});

		// Call LLM
		const llmResponse = await callLLMForDetection({
			prompt,
			model: run.model,
			apiKey,
		});

		console.log(
			`Page ${pageNum}: LLM returned ${llmResponse.entries.length} entries, ${llmResponse.mentions.length} mentions`,
		);

		// Search for mentions in the current page text
		const searchResult = searchMentionsInText({
			mentions: llmResponse.mentions,
			fullText: promptText.currentPage,
		});

		console.log(
			`Page ${pageNum}: Found ${searchResult.found.length} mentions, ${searchResult.notFound.length} not found, ${searchResult.ambiguous.length} ambiguous`,
		);

		if (searchResult.notFound.length > 0) {
			console.warn(
				`Page ${pageNum}: ${searchResult.notFound.length} mentions not found in text`,
				searchResult.notFound,
			);
		}

		if (searchResult.ambiguous.length > 0) {
			console.warn(
				`Page ${pageNum}: ${searchResult.ambiguous.length} ambiguous mentions (found multiple times, using first occurrence)`,
				searchResult.ambiguous,
			);
		}

		// Recalculate char positions for indexable atoms only
		// (original positions include non-indexable words, but our text doesn't)
		const allPageAtoms = pageMemory.pages.get(pageNum) || [];
		const indexableAtomsWithCorrectedPositions =
			recalculateCharPositionsForIndexable({
				atoms: allPageAtoms,
			});

		// Map positions to bboxes
		const mappingResult = mapPositionsToBBoxes({
			mentionsWithPositions: searchResult.found,
			textAtoms: indexableAtomsWithCorrectedPositions,
		});

		console.log(
			`Page ${pageNum}: ${mappingResult.mapped.length} successful mappings, ${mappingResult.failed.length} failed`,
		);

		if (mappingResult.failed.length > 0) {
			console.warn(
				`Page ${pageNum}: ${mappingResult.failed.length} failed bbox mappings`,
				mappingResult.failed,
			);
		}

		// Get suppressed suggestions for this project
		const suppressedList = await detectionRepo.getSuppressedSuggestions({
			userId,
			projectId: run.projectId,
		});

		// Filter out suppressed entries
		const unsuppressedEntries = llmResponse.entries.filter((entry) => {
			const normalizedLabel = entry.label
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, "-");
			const isSuppressed = suppressedList.some(
				(s) =>
					s.indexType === entry.indexType &&
					s.normalizedLabel === normalizedLabel,
			);
			return !isSuppressed;
		});

		console.log(
			`Page ${pageNum}: ${unsuppressedEntries.length} unsuppressed entries (${llmResponse.entries.length - unsuppressedEntries.length} suppressed)`,
		);

		// Persist suggested entries and mentions
		let entriesCreated = 0;
		let mentionsCreated = 0;

		for (const entry of unsuppressedEntries) {
			// Get or verify project index type
			const projectIndexTypeId = await detectionRepo.getProjectIndexTypeByType({
				userId,
				projectId: run.projectId,
				indexType: entry.indexType,
			});

			if (!projectIndexTypeId) {
				console.warn(
					`Project index type not found for ${entry.indexType}, skipping entry "${entry.label}"`,
				);
				continue;
			}

			// Create entry
			const entryId = await detectionRepo.createSuggestedEntry({
				userId,
				projectId: run.projectId,
				projectIndexTypeId,
				detectionRunId: run.id,
				label: entry.label,
				meaningType: entry.meaningType,
				meaningId: entry.meaningId,
			});

			entriesCreated++;

			// Find mentions for this entry
			const entryMentions = mappingResult.mapped.filter(
				(m) => m.entryLabel === entry.label && m.indexType === entry.indexType,
			);

			console.log(
				`Entry "${entry.label}" (${entry.indexType}): Found ${entryMentions.length} mentions`,
			);

			// Fuzzy dedupe against pre-existing mentions (same page, text, ≥90% bbox overlap)
			const candidates: Array<{
				pageNumber: number;
				textSpan: string;
				bboxes: (typeof entryMentions)[0]["bboxes"];
				projectIndexTypeId: string;
			}> = entryMentions.map((m) => ({
				pageNumber: m.pageNumber,
				textSpan: m.textSpan,
				bboxes: m.bboxes,
				projectIndexTypeId,
			}));
			const filteredCandidates = filterFuzzyDuplicateCandidates(
				candidates,
				existingForFuzzyDoc,
				{ overlapThreshold: DEFAULT_OVERLAP_THRESHOLD },
			);
			const filteredIndices = new Set(
				filteredCandidates.map((c) =>
					candidates.indexOf(c as (typeof candidates)[number]),
				),
			);

			// Create mentions (on conflict do nothing; only count actual inserts)
			for (let i = 0; i < entryMentions.length; i++) {
				if (!filteredIndices.has(i)) continue;
				const mention = entryMentions[i];
				try {
					const id = await detectionRepo.createSuggestedMention({
						userId,
						entryId,
						documentId: sourceDoc.id,
						detectionRunId: run.id,
						pageNumber: mention.pageNumber,
						textSpan: mention.textSpan,
						bboxes: mention.bboxes,
						projectIndexTypeId,
					});
					if (id != null) mentionsCreated++;
				} catch (error) {
					console.error(
						`Failed to create mention for entry "${entry.label}":`,
						error,
					);
				}
			}
		}

		// Update progress
		await detectionRepo.updateDetectionRunProgress({
			userId,
			input: {
				runId,
				progressPage: pageNum,
				entriesCreated,
				mentionsCreated,
			},
		});

		// Cleanup memory: Remove pages that are no longer needed
		// We keep pages that are needed as context for remaining pages
		const currentPageIndex = pagesToProcess.indexOf(pageNum);
		const remainingPages = pagesToProcess.slice(currentPageIndex + 1);

		for (const [cachedPageNum] of pageMemory.pages) {
			// Keep the current page and any pages needed as context for remaining pages
			let isStillNeeded = cachedPageNum === pageNum;

			for (const futurePageNum of remainingPages) {
				if (
					cachedPageNum === futurePageNum ||
					cachedPageNum === futurePageNum - 1 ||
					cachedPageNum === futurePageNum + 1
				) {
					isStillNeeded = true;
					break;
				}
			}

			if (!isStillNeeded) {
				pageMemory.pages.delete(cachedPageNum);
			}
		}
	}

	// Update status to completed
	await detectionRepo.updateDetectionRunStatus({
		userId,
		input: {
			runId,
			status: "completed",
			finishedAt: new Date(),
		},
	});
};

// ============================================================================
// Helper Functions
// ============================================================================

const calculateSettingsHash = ({
	projectId,
	indexType,
	model,
}: {
	projectId: string;
	indexType: string;
	model: string;
}): string => {
	const data = JSON.stringify({
		projectId,
		indexType,
		model,
	});
	return crypto.createHash("sha256").update(data).digest("hex");
};

const calculateMatcherSettingsHash = ({
	projectId,
	indexType,
	scope,
	pageId,
	indexEntryGroupIds,
	runAllGroups,
	pageRangeStart,
	pageRangeEnd,
}: {
	projectId: string;
	indexType: string;
	scope: string;
	pageId?: string;
	indexEntryGroupIds?: string[];
	runAllGroups?: boolean;
	pageRangeStart?: number;
	pageRangeEnd?: number;
}): string => {
	const data = JSON.stringify({
		projectId,
		indexType,
		scope,
		pageId,
		indexEntryGroupIds,
		runAllGroups,
		pageRangeStart,
		pageRangeEnd,
	});
	return crypto.createHash("sha256").update(data).digest("hex");
};
