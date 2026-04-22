import path from "node:path";
import { listRules } from "../../canonical-page-rule/canonical-page-rule.repo";
import * as indexMentionRepo from "../../index-mention/index-mention.repo";
import {
	getSourceDocumentById,
	listSourceDocumentsByProject,
} from "../../source-document/source-document.repo";
import { getUserSettings } from "../../user-settings/user-settings.repo";
import * as detectionRepo from "../detection.repo";
import { detectionEventBus } from "../events";
import {
	DEFAULT_OVERLAP_THRESHOLD,
	type FuzzyExistingMention,
	filterFuzzyDuplicateCandidates,
} from "../layout/bbox-overlap.utils";
import { mapPositionsToBBoxes } from "../layout/charAt-mapping.utils";
import {
	buildPromptText,
	extractPages,
	type PageMemory,
	type Region,
	recalculateCharPositionsForIndexable,
} from "../layout/text-extraction.utils";
import { searchMentionsInText } from "../layout/text-search.utils";
import { calculatePagesToProcess } from "../matcher/page-planning";
import { callLLMForDetection } from "./llm-detection.client";
import { buildDetectionPrompt } from "./prompt.utils";

export const processDetection = async ({
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

	await detectionRepo.updateDetectionRunStatus({
		userId,
		input: {
			runId,
			status: "running",
			startedAt: new Date(),
		},
	});
	detectionEventBus.emit(runId, { type: "run.status", status: "running" });
	detectionEventBus.emit(runId, { type: "phase.start", name: "scan" });

	let entriesCreated = 0;
	let mentionsCreated = 0;

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

	const userSettings = await getUserSettings({ userId });

	const apiKey = userSettings?.openrouterApiKey || undefined;

	const excludeRegions: Region[] = [];

	if (!run.totalPages) {
		throw new Error("Detection run has no total pages");
	}

	const { pagesToProcess, contextPagesNeeded } = calculatePagesToProcess({
		totalPages: run.totalPages,
		pageRangeStart: run.pageRangeStart,
		pageRangeEnd: run.pageRangeEnd,
		canonicalPageRules,
	});

	if (pagesToProcess.length === 0) {
		throw new Error("No pages to process (all pages may be excluded)");
	}

	const pageMemory: PageMemory = { pages: new Map() };

	const firstPage = pagesToProcess[0];
	const secondPage = pagesToProcess.length > 1 ? pagesToProcess[1] : null;

	const initialPagesToExtract = new Set<number>();
	initialPagesToExtract.add(firstPage);
	if (secondPage) initialPagesToExtract.add(secondPage);

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

	// Hoisted per-run: suppression list and index-type id lookups.
	const suppressedList = await detectionRepo.getSuppressedSuggestions({
		userId,
		projectId: run.projectId,
	});

	const projectIndexTypeIdByType = new Map<string, string | null>();
	const getProjectIndexTypeIdCached = async (
		indexType: string,
	): Promise<string | null> => {
		if (projectIndexTypeIdByType.has(indexType)) {
			return projectIndexTypeIdByType.get(indexType) ?? null;
		}
		const id = await detectionRepo.getProjectIndexTypeByType({
			userId,
			projectId: run.projectId,
			indexType,
		});
		projectIndexTypeIdByType.set(indexType, id);
		return id;
	};

	for (const pageNum of pagesToProcess) {
		const mentionsCreatedBeforePage = mentionsCreated;
		const currentRun = await detectionRepo.getDetectionRun({ userId, runId });
		if (currentRun?.status === "cancelled") {
			return;
		}

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

		const promptText = buildPromptText({ pageMemory, currentPage: pageNum });

		const prompt = buildDetectionPrompt({
			pageTexts: {
				previous: promptText.previousContext,
				current: promptText.currentPage,
				next: promptText.nextContext,
			},
			indexType: run.indexType,
			primaryPageNumber: pageNum,
		});

		const llmResponse = await callLLMForDetection({
			prompt,
			model: run.model,
			apiKey,
		});

		console.log(
			`Page ${pageNum}: LLM returned ${llmResponse.entries.length} entries, ${llmResponse.mentions.length} mentions`,
		);

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

		const allPageAtoms = pageMemory.pages.get(pageNum) || [];
		const indexableAtomsWithCorrectedPositions =
			recalculateCharPositionsForIndexable({
				atoms: allPageAtoms,
			});

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

		for (const entry of unsuppressedEntries) {
			const projectIndexTypeId = await getProjectIndexTypeIdCached(
				entry.indexType,
			);

			if (!projectIndexTypeId) {
				console.warn(
					`Project index type not found for ${entry.indexType}, skipping entry "${entry.label}"`,
				);
				continue;
			}

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

			const entryMentions = mappingResult.mapped.filter(
				(m) => m.entryLabel === entry.label && m.indexType === entry.indexType,
			);

			console.log(
				`Entry "${entry.label}" (${entry.indexType}): Found ${entryMentions.length} mentions`,
			);

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

		await detectionRepo.updateDetectionRunProgress({
			userId,
			input: {
				runId,
				progressPage: pageNum,
				entriesCreated,
				mentionsCreated,
				phase: "scan",
				phaseProgress: String(
					Math.min(
						1,
						(pagesToProcess.indexOf(pageNum) + 1) /
							Math.max(1, pagesToProcess.length),
					),
				),
			},
		});
		detectionEventBus.emit(runId, {
			type: "page.scanned",
			pageNumber: pageNum,
			totalPages: pagesToProcess.length,
			mentionsDelta: mentionsCreated - mentionsCreatedBeforePage,
		});

		const currentPageIndex = pagesToProcess.indexOf(pageNum);
		const remainingPages = pagesToProcess.slice(currentPageIndex + 1);

		for (const [cachedPageNum] of pageMemory.pages) {
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

	await detectionRepo.updateDetectionRunStatus({
		userId,
		input: {
			runId,
			status: "completed",
			finishedAt: new Date(),
		},
	});
	detectionEventBus.emit(runId, { type: "phase.end", name: "scan" });
	detectionEventBus.emit(runId, { type: "phase.start", name: "finalize" });
	detectionEventBus.emit(runId, { type: "phase.end", name: "finalize" });
	detectionEventBus.emit(runId, { type: "run.done", status: "completed" });
};
