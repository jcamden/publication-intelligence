import crypto from "node:crypto";
import path from "node:path";
import { listRules } from "../canonical-page-rule/canonical-page-rule.repo";
import {
	getSourceDocumentById,
	listSourceDocumentsByProject,
} from "../source-document/sourceDocument.repo";
import { getUserSettings } from "../user-settings/user-settings.repo";
import { mapPositionsToBBoxes } from "./charAt-mapping.utils";
import * as detectionRepo from "./detection.repo";
import type {
	CreateDetectionRunInput,
	DetectionRun,
	DetectionRunListItem,
	RunDetectionInput,
} from "./detection.types";
import { callLLMForDetection } from "./openrouter.client";
import { buildDetectionPrompt } from "./prompt.utils";
import {
	buildPromptText,
	extractPages,
	type PageMemory,
	type Region,
	recalculateCharPositionsForIndexable,
} from "./text-extraction.utils";
import { searchMentionsInText } from "./text-search.utils";

// ============================================================================
// Service Layer - Business Logic
// ============================================================================

export const runDetection = async ({
	userId,
	input,
}: {
	userId: string;
	input: RunDetectionInput;
}): Promise<{ runId: string }> => {
	// Get source document
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

	// Calculate settings hash for deduplication
	const settingsHash = calculateSettingsHash({
		projectId: input.projectId,
		indexType: input.indexType,
		model: input.model,
	});

	// Validate page range if provided
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

	// Create detection run record
	const runInput: CreateDetectionRunInput = {
		projectId: input.projectId,
		indexType: input.indexType,
		model: input.model,
		promptVersion: input.promptVersion,
		settingsHash,
		totalPages: sourceDocListItem.page_count,
		pageRangeStart: input.pageRangeStart,
		pageRangeEnd: input.pageRangeEnd,
	};

	const run = await detectionRepo.createDetectionRun({
		userId,
		input: runInput,
	});

	// Process in background (don't await)
	processDetection({ userId, runId: run.id }).catch((err) => {
		console.error("Detection processing error:", err);
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
			.catch((e) => console.error("Failed to update run status:", e));
	});

	return { runId: run.id };
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

// ============================================================================
// Background Processing
// ============================================================================

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
				description: entry.description,
			});

			entriesCreated++;

			// Find mentions for this entry
			const entryMentions = mappingResult.mapped.filter(
				(m) => m.entryLabel === entry.label && m.indexType === entry.indexType,
			);

			console.log(
				`Entry "${entry.label}" (${entry.indexType}): Found ${entryMentions.length} mentions`,
			);

			// Create mentions
			for (const mention of entryMentions) {
				try {
					await detectionRepo.createSuggestedMention({
						userId,
						entryId,
						documentId: sourceDoc.id,
						detectionRunId: run.id,
						pageNumber: mention.pageNumber,
						textSpan: mention.textSpan,
						bboxes: mention.bboxes,
						projectIndexTypeId,
					});

					mentionsCreated++;
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
