import { z } from "zod";

// ============================================================================
// DTOs - Data Transfer Objects
// ============================================================================

export const RunDetectionSchema = z
	.object({
		projectId: z.string().uuid("Invalid project ID"),
		indexType: z.string().min(1, "Index type is required"),
		model: z.string().min(1, "Model is required"),
		promptVersion: z.string().default("v1"),
		pageRangeStart: z.number().int().min(1).optional(),
		pageRangeEnd: z.number().int().min(1).optional(),
	})
	.refine(
		(data) => {
			if (data.pageRangeStart && data.pageRangeEnd) {
				return data.pageRangeStart <= data.pageRangeEnd;
			}
			return true;
		},
		{
			message: "pageRangeStart must be <= pageRangeEnd",
		},
	);

export type RunDetectionInput = z.infer<typeof RunDetectionSchema>;

export const GetDetectionRunSchema = z.object({
	runId: z.string().uuid("Invalid run ID"),
});

export type GetDetectionRunInput = z.infer<typeof GetDetectionRunSchema>;

export const ListDetectionRunsSchema = z.object({
	projectId: z.string().uuid("Invalid project ID"),
});

export type ListDetectionRunsInput = z.infer<typeof ListDetectionRunsSchema>;

export const CancelDetectionRunSchema = z.object({
	runId: z.string().uuid("Invalid run ID"),
});

export type CancelDetectionRunInput = z.infer<typeof CancelDetectionRunSchema>;

// ============================================================================
// Domain Types
// ============================================================================

export type DetectionRunStatus =
	| "queued"
	| "running"
	| "completed"
	| "failed"
	| "cancelled";

export type DetectionRun = {
	id: string;
	projectId: string;
	status: DetectionRunStatus;
	createdAt: Date;
	startedAt: Date | null;
	finishedAt: Date | null;
	progressPage: number | null;
	totalPages: number | null;
	pageRangeStart: number | null;
	pageRangeEnd: number | null;
	model: string;
	promptVersion: string;
	settingsHash: string;
	indexType: string;
	errorMessage: string | null;
	costEstimateUsd: string | null;
	actualCostUsd: string | null;
	entriesCreated: number | null;
	mentionsCreated: number | null;
};

export type DetectionRunListItem = {
	id: string;
	projectId: string;
	status: DetectionRunStatus;
	createdAt: Date;
	startedAt: Date | null;
	finishedAt: Date | null;
	progressPage: number | null;
	totalPages: number | null;
	pageRangeStart: number | null;
	pageRangeEnd: number | null;
	model: string;
	indexType: string;
	entriesCreated: number | null;
	mentionsCreated: number | null;
};

export type CreateDetectionRunInput = {
	projectId: string;
	indexType: string;
	model: string;
	promptVersion: string;
	settingsHash: string;
	totalPages: number;
	pageRangeStart?: number;
	pageRangeEnd?: number;
};

export type UpdateDetectionRunStatusInput = {
	runId: string;
	status: DetectionRunStatus;
	startedAt?: Date;
	finishedAt?: Date;
	errorMessage?: string;
};

export type UpdateDetectionRunProgressInput = {
	runId: string;
	progressPage: number;
	entriesCreated?: number;
	mentionsCreated?: number;
};

// ============================================================================
// LLM Response Types
// ============================================================================

export type LLMIndexEntry = {
	label: string;
	indexType: string;
	meaningType?: string;
	meaningId?: string;
	description?: string;
};

export type LLMMention = {
	entryLabel: string;
	indexType: string;
	pageNumber: number;
	textSpan: string;
};

export type LLMDetectionResponse = {
	entries: LLMIndexEntry[];
	mentions: LLMMention[];
};

// ============================================================================
// Suppression Types
// ============================================================================

export type SuppressedSuggestion = {
	id: string;
	projectId: string;
	indexType: string;
	normalizedLabel: string;
	meaningType: string | null;
	meaningId: string | null;
	scope: string | null;
	suppressionMode: string | null;
	suppressedAt: Date;
	suppressedBy: string | null;
	reason: string | null;
};

export type CreateSuppressionInput = {
	projectId: string;
	indexType: string;
	normalizedLabel: string;
	meaningType?: string | null;
	meaningId?: string | null;
	suppressedBy?: string;
	reason?: string;
};
