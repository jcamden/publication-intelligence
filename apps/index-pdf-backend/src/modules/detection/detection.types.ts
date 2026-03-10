import { getParserProfileIds } from "@pubint/core";
import { z } from "zod";

// ============================================================================
// Index entry group validated enums (Task 6.1)
// ============================================================================

/** Valid sort modes for index entry groups (aligned with DB enum). */
export const INDEX_ENTRY_GROUP_SORT_MODES = [
	"a_z",
	"canon_book_order",
] as const;

export type IndexEntryGroupSortMode = (typeof INDEX_ENTRY_GROUP_SORT_MODES)[number];

export const indexEntryGroupSortModeSchema = z.enum(INDEX_ENTRY_GROUP_SORT_MODES);

/** Parser profile id must be one of the predefined profiles or null (alias-only group). */
export const parserProfileIdSchema = z
	.string()
	.refine((id) => getParserProfileIds().includes(id), {
		message: "Invalid parser profile id",
	})
	.nullable()
	.optional();

// ============================================================================
// DTOs - Data Transfer Objects
// ============================================================================

export const RunLlmSchema = z
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

export type RunLlmInput = z.infer<typeof RunLlmSchema>;

export const RunMatcherSchema = z
	.object({
		projectId: z.string().uuid("Invalid project ID"),
		indexType: z.string().min(1, "Index type is required"),
		scope: z.enum(["project", "page"]),
		pageId: z.string().uuid("Invalid page ID").optional(),
		indexEntryGroupIds: z.array(z.string().uuid()).optional(),
		runAllGroups: z.boolean().optional(),
	})
	.refine(
		(data) => {
			if (data.scope === "page") {
				return typeof data.pageId === "string" && data.pageId.length > 0;
			}
			return true;
		},
		{ message: "pageId is required when scope is page", path: ["pageId"] },
	)
	.refine(
		(data) => {
			const hasGroupIds =
				Array.isArray(data.indexEntryGroupIds) &&
				data.indexEntryGroupIds.length > 0;
			const hasRunAll = data.runAllGroups === true;
			return hasGroupIds !== hasRunAll;
		},
		{
			message:
				"Exactly one of indexEntryGroupIds (non-empty) or runAllGroups (true) is required; they are mutually exclusive",
		},
	);

export type RunMatcherInput = z.infer<typeof RunMatcherSchema>;

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

/** Create index entry group input (parser profile and sort mode validated). */
export const CreateIndexEntryGroupSchema = z.object({
	projectId: z.string().uuid(),
	projectIndexTypeId: z.string().uuid(),
	name: z.string().min(1),
	slug: z.string().min(1),
	parserProfileId: parserProfileIdSchema,
	sortMode: indexEntryGroupSortModeSchema.default("a_z"),
});

export type CreateIndexEntryGroupSchemaInput = z.infer<
	typeof CreateIndexEntryGroupSchema
>;

/** Update index entry group input (parser profile and sort mode validated). */
export const UpdateIndexEntryGroupSchema = z.object({
	name: z.string().min(1).optional(),
	slug: z.string().min(1).optional(),
	parserProfileId: parserProfileIdSchema,
	sortMode: indexEntryGroupSortModeSchema.optional(),
});

export type UpdateIndexEntryGroupSchemaInput = z.infer<
	typeof UpdateIndexEntryGroupSchema
>;

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
	runType: "llm" | "matcher";
	scope: "project" | "page" | null;
	pageId: string | null;
	indexEntryGroupIds: string[] | null;
	runAllGroups: boolean | null;
	status: DetectionRunStatus;
	createdAt: Date;
	startedAt: Date | null;
	finishedAt: Date | null;
	progressPage: number | null;
	totalPages: number | null;
	pageRangeStart: number | null;
	pageRangeEnd: number | null;
	model: string | null;
	promptVersion: string | null;
	settingsHash: string | null;
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
	runType: "llm" | "matcher";
	scope: "project" | "page" | null;
	pageId: string | null;
	indexEntryGroupIds: string[] | null;
	runAllGroups: boolean | null;
	status: DetectionRunStatus;
	createdAt: Date;
	startedAt: Date | null;
	finishedAt: Date | null;
	progressPage: number | null;
	totalPages: number | null;
	pageRangeStart: number | null;
	pageRangeEnd: number | null;
	model: string | null;
	indexType: string;
	entriesCreated: number | null;
	mentionsCreated: number | null;
};

/** Input for creating an LLM detection run */
export type CreateLlmDetectionRunInput = {
	projectId: string;
	indexType: string;
	model: string;
	promptVersion: string;
	settingsHash: string;
	totalPages: number;
	pageRangeStart?: number;
	pageRangeEnd?: number;
};

/** Input for creating a matcher detection run */
export type CreateMatcherDetectionRunInput = {
	projectId: string;
	indexType: string;
	scope: "project" | "page";
	pageId?: string;
	indexEntryGroupIds?: string[];
	runAllGroups?: boolean;
	settingsHash: string;
	totalPages: number;
};

/** Union for run creation (discriminated by usage in repo) */
export type CreateDetectionRunInput =
	| CreateLlmDetectionRunInput
	| CreateMatcherDetectionRunInput;

export function isLlmRunInput(
	input: CreateDetectionRunInput,
): input is CreateLlmDetectionRunInput {
	return (
		"model" in input &&
		typeof (input as CreateLlmDetectionRunInput).model === "string"
	);
}

export function isMatcherRunInput(
	input: CreateDetectionRunInput,
): input is CreateMatcherDetectionRunInput {
	return (
		"scope" in input &&
		typeof (input as CreateMatcherDetectionRunInput).scope === "string"
	);
}

export type UpdateDetectionRunStatusInput = {
	runId: string;
	status: DetectionRunStatus;
	startedAt?: Date;
	finishedAt?: Date;
	errorMessage?: string;
	mentionsCreated?: number;
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
	reason?: string | null;
};

// ============================================================================
// Matcher detection (Phase 4) - in-memory mention candidates
// ============================================================================

/** Optional parser output per segment (e.g. scripture ref). */
export type MatcherMentionParserSegment = {
	refText: string;
	chapter?: number;
	chapterEnd?: number;
	verseStart?: number;
	verseEnd?: number;
	verseSuffix?: string;
};

/** In-memory mention candidate before persistence (Phase 5). Deterministic order: pageNumber, charStart, longer span first. */
export type MatcherMentionCandidate = {
	pageNumber: number;
	groupId: string;
	matcherId: string;
	entryId: string;
	indexType: string;
	textSpan: string;
	charStart: number;
	charEnd: number;
	bboxes: Array<{ x: number; y: number; width: number; height: number }>;
	/** Single segment (Phase 4 legacy); prefer parserSegments when present for scripture. */
	parserSegment?: MatcherMentionParserSegment;
	/** All parsed segments for compound refs (Task 5.2); one resolution unit per segment. */
	parserSegments?: MatcherMentionParserSegment[];
	/** True when candidate was emitted as book-level fallback after parse returned no segments (Task 4.3). */
	fallbackBookLevel?: boolean;
};
