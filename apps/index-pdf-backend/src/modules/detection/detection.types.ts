import { z } from "zod";

// ============================================================================
// Index entry group validated enums (Task 6.1)
// ============================================================================

/** Valid sort modes for index entry groups (aligned with DB enum). */
export const INDEX_ENTRY_GROUP_SORT_MODES = [
	"a_z",
	"canon_book_order", // Legacy; treat as protestant
	"custom",
	"protestant",
	"roman_catholic",
	"tanakh",
	"eastern_orthodox",
] as const;

export type IndexEntryGroupSortMode =
	(typeof INDEX_ENTRY_GROUP_SORT_MODES)[number];

export const indexEntryGroupSortModeSchema = z.enum(
	INDEX_ENTRY_GROUP_SORT_MODES,
);

/** Canon IDs that can be used as sort modes (scripture groups only). */
export const CANON_SORT_MODES = [
	"protestant",
	"roman_catholic",
	"tanakh",
	"eastern_orthodox",
] as const;

export type CanonSortMode = (typeof CANON_SORT_MODES)[number];

export function isCanonSortMode(
	mode: IndexEntryGroupSortMode,
): mode is CanonSortMode {
	return CANON_SORT_MODES.includes(mode as CanonSortMode);
}

/** Resolve sort mode to canon ID for book-order lookup. canon_book_order is legacy → protestant. */
export function getCanonIdForSortMode(
	mode: IndexEntryGroupSortMode,
): CanonSortMode | null {
	if (isCanonSortMode(mode)) return mode;
	if (mode === "canon_book_order") return "protestant";
	return null;
}

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
		pageRangeStart: z.number().int().min(1).optional(),
		pageRangeEnd: z.number().int().min(1).optional(),
	})
	.refine(
		(data) => {
			if (data.pageRangeStart != null && data.pageRangeEnd != null) {
				return data.pageRangeStart <= data.pageRangeEnd;
			}
			return true;
		},
		{
			message: "pageRangeStart must be <= pageRangeEnd",
			path: ["pageRangeEnd"],
		},
	)
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

export const ListIndexEntryGroupsSchema = z.object({
	projectId: z.string().uuid("Invalid project ID"),
	projectIndexTypeId: z.string().uuid("Invalid project index type ID"),
});

export type ListIndexEntryGroupsInput = z.infer<
	typeof ListIndexEntryGroupsSchema
>;

export const CancelDetectionRunSchema = z.object({
	runId: z.string().uuid("Invalid run ID"),
});

export type CancelDetectionRunInput = z.infer<typeof CancelDetectionRunSchema>;

/** Create index entry group input. */
export const CreateIndexEntryGroupSchema = z.object({
	projectId: z.string().uuid(),
	projectIndexTypeId: z.string().uuid(),
	name: z.string().min(1),
	sortMode: indexEntryGroupSortModeSchema.default("a_z"),
});

export type CreateIndexEntryGroupSchemaInput = z.infer<
	typeof CreateIndexEntryGroupSchema
>;

/** Update index entry group input. */
export const UpdateIndexEntryGroupSchema = z.object({
	groupId: z.string().uuid("Invalid group ID"),
	name: z.string().min(1).optional(),
	sortMode: indexEntryGroupSortModeSchema.optional(),
});

export type UpdateIndexEntryGroupSchemaInput = z.infer<
	typeof UpdateIndexEntryGroupSchema
>;

// ============================================================================
// Index entry group membership schemas
// ============================================================================

export const GetIndexEntryGroupSchema = z.object({
	groupId: z.string().uuid("Invalid group ID"),
});

export type GetIndexEntryGroupInput = z.infer<typeof GetIndexEntryGroupSchema>;

export const DeleteIndexEntryGroupSchema = z.object({
	groupId: z.string().uuid("Invalid group ID"),
	/** When true, soft-deletes all entries in the group (with cascade to children) before deleting the group. */
	deleteEntries: z.boolean().optional().default(false),
});

export type DeleteIndexEntryGroupInput = z.infer<
	typeof DeleteIndexEntryGroupSchema
>;

export const AddEntryToGroupSchema = z.object({
	groupId: z.string().uuid("Invalid group ID"),
	entryId: z.string().uuid("Invalid entry ID"),
	position: z.number().int().min(0).optional(),
});

export type AddEntryToGroupInput = z.infer<typeof AddEntryToGroupSchema>;

export const RemoveEntryFromGroupSchema = z.object({
	groupId: z.string().uuid("Invalid group ID"),
	entryId: z.string().uuid("Invalid entry ID"),
});

export type RemoveEntryFromGroupInput = z.infer<
	typeof RemoveEntryFromGroupSchema
>;

export const ReorderGroupEntriesSchema = z.object({
	groupId: z.string().uuid("Invalid group ID"),
	entryIds: z.array(z.string().uuid()).min(1, "At least one entry ID required"),
});

export type ReorderGroupEntriesInput = z.infer<
	typeof ReorderGroupEntriesSchema
>;

export const ReorderGroupsSchema = z.object({
	projectId: z.string().uuid("Invalid project ID"),
	projectIndexTypeId: z.string().uuid("Invalid project index type ID"),
	groupIds: z.array(z.string().uuid()),
});

export type ReorderGroupsInput = z.infer<typeof ReorderGroupsSchema>;

export const MergeGroupsSchema = z.object({
	sourceGroupId: z.string().uuid("Invalid source group ID"),
	targetGroupId: z.string().uuid("Invalid target group ID"),
});

export type MergeGroupsInput = z.infer<typeof MergeGroupsSchema>;

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
	phase: string | null;
	phaseProgress: string | null;
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
	phase: string | null;
	phaseProgress: string | null;
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
	pageRangeStart?: number;
	pageRangeEnd?: number;
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
	phase?: string | null;
	/** Stored as text/numeric string by Drizzle numeric mapping. */
	phaseProgress?: string | null;
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
	chapterStart?: number;
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
	/** True when candidate is from standalone ref scan (no book in alias window); assign to Unknown, book-level only. */
	isUnknownBook?: boolean;
};

// ============================================================================
// Scripture detection page result (testable two-pass output)
// ============================================================================

/** One span attached to an alias (matcher pass): ref segments or alias-only or fallback. */
export type ScripturePageAliasAttachedSpan = {
	pageCharStart: number;
	pageCharEnd: number;
	segments: MatcherMentionParserSegment[];
	groupId: string;
	matcherId: string;
	entryId: string;
	indexType: string;
	/** True when emitted as book-level fallback after parse returned no segments. */
	fallbackBookLevel?: boolean;
};

/** One span from the bookless scan (Unknown pass). */
export type ScripturePageUnknownSpan = {
	pageCharStart: number;
	pageCharEnd: number;
	segments: MatcherMentionParserSegment[];
};

/** Result of running both scripture detection passes on a page (matcher + bookless). For testing. */
export type ScriptureDetectionPageResult = {
	aliasAttached: ScripturePageAliasAttachedSpan[];
	unknownSpans: ScripturePageUnknownSpan[];
};
