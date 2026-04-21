import path from "node:path";
import type { ParserProfile } from "@pubint/core";
import { getParserProfile } from "@pubint/core";
import { logEvent } from "../../../logger";
import { listRules } from "../../canonical-page-rule/canonical-page-rule.repo";
import {
	getSourceDocumentById,
	listSourceDocumentsByProject,
} from "../../source-document/source-document.repo";
import { buildAliasIndex, scanTextWithAliasIndex } from "../alias/alias-engine";
import type { ResolvedAliasMatch } from "../alias/alias-engine.types";
import * as detectionRepo from "../detection.repo";
import type { MatcherMentionCandidate } from "../detection.types";
import { mapPositionsToBBoxes } from "../layout/charAt-mapping.utils";
import { resolvePageIdToDocumentPageNumber } from "../layout/page-id.utils";
import {
	buildSearchablePageText,
	extractPages,
	type PageMemory,
	type Region,
	recalculateCharPositionsForIndexable,
} from "../layout/text-extraction.utils";
import { resolveAndPersistCandidates } from "../resolution/entry-resolution.service";
import { runScriptureDetectionOnPage } from "../scripture/scripture-detection-on-page";
import * as indexEntryGroupRepo from "./index-entry-group.repo";
import {
	dedupeMatcherCandidates,
	sortMatcherCandidates,
} from "./matcher-candidates";
import { calculatePagesToProcess, isPageExcluded } from "./page-planning";

export const processMatcher = async ({
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

	const groupIds = await indexEntryGroupRepo.resolveRunGroupIds({
		userId,
		projectId: run.projectId,
		projectIndexTypeId,
		indexEntryGroupIds: run.indexEntryGroupIds,
		runAllGroups: run.runAllGroups,
	});

	const runAllMatchers = groupIds.length === 0;

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

	const runMatcherIds = [...new Set(aliases.map((a) => a.matcherId))];

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
