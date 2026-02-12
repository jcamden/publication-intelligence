import { z } from "zod";
import type { IndexType } from "../../db/schema/index-type-config";

// ============================================================================
// Type Definitions - ProjectHighlightConfig domain types
// ============================================================================

// Highlight types include both index types and region types
export type HighlightType =
	| "subject"
	| "author"
	| "scripture"
	| "exclude"
	| "page_number";

export const EnableProjectHighlightConfigSchema = z.object({
	projectId: z.string().uuid(),
	highlightType: z.enum([
		"subject",
		"author",
		"scripture",
		"exclude",
		"page_number",
	]),
	colorHue: z.number().int().min(0).max(360),
});

export type EnableProjectHighlightConfigInput = z.infer<
	typeof EnableProjectHighlightConfigSchema
>;

export const UpdateProjectHighlightConfigSchema = z.object({
	colorHue: z.number().int().min(0).max(360).optional(),
	visible: z.boolean().optional(),
});

export type UpdateProjectHighlightConfigInput = z.infer<
	typeof UpdateProjectHighlightConfigSchema
>;

// Legacy exports for backward compatibility during migration
export const EnableProjectIndexTypeSchema = EnableProjectHighlightConfigSchema;
export type EnableProjectIndexTypeInput = EnableProjectHighlightConfigInput;
export const UpdateProjectIndexTypeSchema = UpdateProjectHighlightConfigSchema;
export type UpdateProjectIndexTypeInput = UpdateProjectHighlightConfigInput;

// Removed: Reordering is now a client-side concern (sorting in UI)
// export const ReorderProjectIndexTypesSchema = z.object({
// 	projectId: z.string().uuid(),
// 	order: z.array(
// 		z.object({
// 			id: z.string().uuid(),
// 			ordinal: z.number().int().min(0),
// 		}),
// 	),
// });
//
// export type ReorderProjectIndexTypesInput = z.infer<
// 	typeof ReorderProjectIndexTypesSchema
// >;

export type ProjectHighlightConfig = {
	id: string;
	project: {
		id: string;
	};
	highlightType: HighlightType;
	displayName: string;
	description: string;
	colorHue: number;
	visible: boolean;
	created_at: string;
	updated_at: string | null;
	deleted_at: string | null;
	entry_count: number;
	is_deleted: boolean;
};

export type ProjectHighlightConfigListItem = {
	id: string;
	colorHue: number;
	visible: boolean;
	highlightType: HighlightType;
	displayName: string;
	entry_count: number;
};

export type AvailableHighlightType = {
	highlightType: HighlightType;
	displayName: string;
	description: string;
	defaultHue: number;
};

// Legacy exports for backward compatibility
export type ProjectIndexType = ProjectHighlightConfig & {
	indexType: IndexType;
};
export type ProjectIndexTypeListItem = ProjectHighlightConfigListItem & {
	indexType: IndexType;
};
export type AvailableIndexType = AvailableHighlightType & {
	indexType: IndexType;
	defaultColor: string;
};
