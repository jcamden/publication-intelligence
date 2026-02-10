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
	description: string | null;
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
	variants?: IndexVariant[];
	mentionCount?: number;
	childCount?: number;
};

export type IndexVariant = {
	id: string;
	entryId: string;
	text: string;
	variantType: string;
	revision: number;
	createdAt: string;
	updatedAt: string | null;
};

export type IndexEntryListItem = {
	id: string;
	projectIndexTypeId: string;
	slug: string;
	label: string;
	description: string | null;
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
	variants: IndexVariant[];
	createdAt: string;
	updatedAt: string | null;
};

export type IndexEntrySearchResult = {
	id: string;
	label: string;
	slug: string;
	description: string | null;
	parentId: string | null;
	parent?: {
		id: string;
		label: string;
	} | null;
	variants: IndexVariant[];
	matchType: "label" | "variant";
	matchedText?: string;
};

// ============================================================================
// Zod Schemas for Validation
// ============================================================================

export const CreateIndexEntrySchema = z.object({
	projectId: z.string().uuid(),
	projectIndexTypeId: z.string().uuid(),
	label: z.string().min(1).max(200),
	slug: z.string().min(1).max(200),
	parentId: z.string().uuid().optional(),
	variants: z.array(z.string()).optional(),
	description: z.string().optional(),
});

export type CreateIndexEntryInput = z.infer<typeof CreateIndexEntrySchema>;

export const UpdateIndexEntrySchema = z.object({
	id: z.string().uuid(),
	projectId: z.string().uuid(),
	projectIndexTypeId: z.string().uuid(),
	label: z.string().min(1).max(200).optional(),
	description: z.string().optional().nullable(),
	variants: z.array(z.string()).optional(),
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
