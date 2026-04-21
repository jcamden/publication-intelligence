import crypto from "node:crypto";
import { logEvent } from "../../logger";
import { listSourceDocumentsByProject } from "../source-document/source-document.repo";
import * as detectionRepo from "./detection.repo";
import type {
	CreateLlmDetectionRunInput,
	CreateMatcherDetectionRunInput,
	DetectionRun,
	DetectionRunListItem,
	RunLlmInput,
	RunMatcherInput,
} from "./detection.types";
import { processDetection } from "./llm/process-llm";
import { processMatcher } from "./matcher/process-matcher";

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

export {
	dedupeMatcherCandidates,
	sortMatcherCandidates,
} from "./matcher/matcher-candidates";
