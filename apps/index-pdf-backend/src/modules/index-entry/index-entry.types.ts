import { z } from "zod";

// ============================================================================
// TypeScript Types
// ============================================================================

export type IndexEntry = {
	id: string;
	projectId: string;
	projectIndexTypeId: string;
	slug: string;
	label: string;
	status: string;
	revision: number;
	parentId: string | null;
	createdAt: string;
	updatedAt: string | null;
	deletedAt: string | null;
	parent?: {
		id: string;
		label: string;
	} | null;
	projectIndexType?: {
		id: string;
		indexType: string;
		colorHue: number;
	};
	matchers?: IndexMatcher[];
	mentionCount?: number;
	childCount?: number;
};

export type IndexMatcher = {
	id: string;
	entryId: string;
	text: string;
	matcherType: string;
	revision: number;
	createdAt: string;
	updatedAt: string | null;
};

export type IndexEntryListItem = {
	id: string;
	projectIndexTypeId: string;
	slug: string;
	label: string;
	status: string;
	parentId: string | null;
	parent?: {
		id: string;
		label: string;
	} | null;
	projectIndexType: {
		id: string;
		indexType: string;
		colorHue: number;
	};
	mentionCount: number;
	childCount: number;
	matchers: IndexMatcher[];
	createdAt: string;
	updatedAt: string | null;
};

export type IndexEntrySearchResult = {
	id: string;
	label: string;
	slug: string;
	parentId: string | null;
	parent?: {
		id: string;
		label: string;
	} | null;
	matchers: IndexMatcher[];
	matchType: "label" | "matcher";
	matchedText?: string;
};

// ============================================================================
// Zod Schemas for Validation
// ============================================================================

export const CreateIndexEntrySchema = z.object({
	projectId: z.string().uuid(),
	projectIndexTypeId: z.string().uuid(),
	label: z.string().min(1).max(200),
	slug: z.string().min(1).max(200).optional(),
	parentId: z.string().uuid().optional(),
	matchers: z.array(z.string()).optional(),
});

export type CreateIndexEntryInput = z.infer<typeof CreateIndexEntrySchema>;

export const UpdateIndexEntrySchema = z.object({
	id: z.string().uuid(),
	projectId: z.string().uuid(),
	projectIndexTypeId: z.string().uuid(),
	label: z.string().min(1).max(200).optional(),
	matchers: z.array(z.string()).optional(),
});

export type UpdateIndexEntryInput = z.infer<typeof UpdateIndexEntrySchema>;

export const UpdateIndexEntryParentSchema = z.object({
	id: z.string().uuid(),
	parentId: z.string().uuid().optional().nullable(),
});

export type UpdateIndexEntryParentInput = z.infer<
	typeof UpdateIndexEntryParentSchema
>;

export const DeleteIndexEntrySchema = z.object({
	id: z.string().uuid(),
	projectId: z.string().uuid(),
	projectIndexTypeId: z.string().uuid(),
	cascadeToChildren: z.boolean().optional().default(false),
});

export type DeleteIndexEntryInput = z.infer<typeof DeleteIndexEntrySchema>;

// ============================================================================
// Cross-Reference Types
// ============================================================================

export type CrossReference = {
	id: string;
	fromEntryId: string;
	toEntryId: string | null;
	arbitraryValue: string | null;
	relationType: "see" | "see_also" | "qv";
	toEntry?: {
		id: string;
		label: string;
	} | null;
};

export type IndexView = {
	entries: IndexEntryListItem[];
	pageRangesByEntryId: Record<string, string>;
	crossReferencesByEntryId: Record<string, CrossReference[]>;
};

export const CreateCrossReferenceSchema = z
	.object({
		fromEntryId: z.string().uuid(),
		toEntryId: z.string().uuid().optional(),
		arbitraryValue: z.string().optional(),
		relationType: z.enum(["see", "see_also", "qv"]),
	})
	.refine(
		(data) => {
			const hasEntry = data.toEntryId != null;
			const hasArbitrary =
				data.arbitraryValue != null && data.arbitraryValue.trim().length > 0;
			return hasEntry !== hasArbitrary;
		},
		{ message: "Provide exactly one of toEntryId or arbitraryValue" },
	);

export type CreateCrossReferenceInput = z.infer<
	typeof CreateCrossReferenceSchema
>;

export const DeleteCrossReferenceSchema = z.object({
	id: z.string().uuid(),
});

export type DeleteCrossReferenceInput = z.infer<
	typeof DeleteCrossReferenceSchema
>;

export const TransferMentionsSchema = z.object({
	fromEntryId: z.string().uuid(),
	toEntryId: z.string().uuid(),
});

export type TransferMentionsInput = z.infer<typeof TransferMentionsSchema>;

export const TransferMatchersSchema = z.object({
	fromEntryId: z.string().uuid(),
	toEntryId: z.string().uuid(),
});

export type TransferMatchersInput = z.infer<typeof TransferMatchersSchema>;
