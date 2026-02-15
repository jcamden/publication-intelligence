import { z } from "zod";

// ============================================================================
// TypeScript Types
// ============================================================================

export type BoundingBox = {
	x: number;
	y: number;
	width: number;
	height: number;
	rotation?: number;
};

export type IndexMention = {
	id: string;
	entryId: string;
	documentId: string;
	pageNumber: number;
	pageNumberEnd: number | null;
	textSpan: string;
	startOffset: number | null;
	endOffset: number | null;
	bboxes: BoundingBox[] | null;
	rangeType: "single_page" | "page_range" | "passim";
	mentionType: "text" | "region";
	suggestedByLlmId: string | null;
	detectionRunId: string | null;
	note: string | null;
	revision: number;
	createdAt: string;
	updatedAt: string | null;
	deletedAt: string | null;
	entry?: {
		id: string;
		label: string;
		projectIndexTypeId: string;
	};
	document?: {
		id: string;
		title: string;
	};
	indexTypes?: Array<{
		id: string;
		projectIndexTypeId: string;
		projectIndexType: {
			id: string;
			indexType: string;
			colorHue: number;
		};
	}>;
};

export type IndexMentionListItem = {
	id: string;
	entryId: string;
	entry: {
		id: string;
		label: string;
	};
	pageNumber: number;
	textSpan: string;
	bboxes: BoundingBox[] | null;
	mentionType: "text" | "region";
	detectionRunId: string | null;
	indexTypes: Array<{
		projectIndexTypeId: string;
		indexType: string;
		colorHue: number;
	}>;
	createdAt: string;
};

// ============================================================================
// Zod Schemas for Validation
// ============================================================================

export const BoundingBoxSchema = z.object({
	x: z.number(),
	y: z.number(),
	width: z.number(),
	height: z.number(),
	rotation: z.number().optional(),
});

export const ListIndexMentionsSchema = z.object({
	projectId: z.string().uuid(),
	documentId: z.string().uuid().optional(),
	pageNumber: z.number().int().optional(),
	projectIndexTypeIds: z.array(z.string().uuid()).optional(),
	includeDeleted: z.boolean().optional(),
});

export type ListIndexMentionsInput = z.infer<typeof ListIndexMentionsSchema>;

export const CreateIndexMentionSchema = z.object({
	documentId: z.string().uuid(),
	entryId: z.string().uuid(),
	pageNumber: z.number().int().min(1),
	textSpan: z.string().min(1),
	bboxesPdf: z.array(BoundingBoxSchema),
	projectIndexTypeIds: z.array(z.string().uuid()).min(1),
	mentionType: z.enum(["text", "region"]).optional().default("text"),
});

export type CreateIndexMentionInput = z.infer<typeof CreateIndexMentionSchema>;

export const UpdateIndexMentionSchema = z.object({
	id: z.string().uuid(),
	projectId: z.string().uuid(),
	documentId: z.string().uuid(),
	pageNumber: z.number().int(),
	entryId: z.string().uuid().optional(),
	textSpan: z.string().optional(),
	projectIndexTypeIds: z.array(z.string().uuid()).min(1).optional(),
});

export type UpdateIndexMentionInput = z.infer<typeof UpdateIndexMentionSchema>;

export const UpdateIndexMentionTypesSchema = z.object({
	mentionIds: z.array(z.string().uuid()).min(1),
	projectIndexTypeIds: z.array(z.string().uuid()).min(1),
	operation: z.enum(["replace", "add", "remove"]),
});

export type UpdateIndexMentionTypesInput = z.infer<
	typeof UpdateIndexMentionTypesSchema
>;

export const BulkCreateIndexMentionsSchema = z.object({
	mentions: z
		.array(
			z.object({
				documentId: z.string().uuid(),
				entryId: z.string().uuid(),
				pageNumber: z.number().int(),
				textSpan: z.string(),
				bboxesPdf: z.array(BoundingBoxSchema),
				projectIndexTypeIds: z.array(z.string().uuid()),
				mentionType: z.enum(["text", "region"]).optional().default("text"),
			}),
		)
		.min(1)
		.max(100),
});

export type BulkCreateIndexMentionsInput = z.infer<
	typeof BulkCreateIndexMentionsSchema
>;

export const DeleteIndexMentionSchema = z.object({
	id: z.string().uuid(),
	projectId: z.string().uuid(),
	documentId: z.string().uuid(),
	pageNumber: z.number().int(),
});

export type DeleteIndexMentionInput = z.infer<typeof DeleteIndexMentionSchema>;
