import { z } from "zod";
import type { IndexType } from "../../db/schema/index-type-config";

// ============================================================================
// Type Definitions - ProjectIndexType domain types
// ============================================================================

export const EnableProjectIndexTypeSchema = z.object({
	projectId: z.string().uuid(),
	indexType: z.enum([
		"subject",
		"author",
		"scripture",
		"bibliography",
		"person",
		"place",
		"concept",
		"organization",
		"event",
	]),
	color: z
		.string()
		.regex(/^#[0-9A-Fa-f]{6}$/)
		.optional(),
	ordinal: z.number().int().min(0).optional(),
});

export type EnableProjectIndexTypeInput = z.infer<
	typeof EnableProjectIndexTypeSchema
>;

export const UpdateProjectIndexTypeSchema = z.object({
	color: z
		.string()
		.regex(/^#[0-9A-Fa-f]{6}$/)
		.optional(),
	visible: z.boolean().optional(),
});

export type UpdateProjectIndexTypeInput = z.infer<
	typeof UpdateProjectIndexTypeSchema
>;

export const ReorderProjectIndexTypesSchema = z.object({
	projectId: z.string().uuid(),
	order: z.array(
		z.object({
			id: z.string().uuid(),
			ordinal: z.number().int().min(0),
		}),
	),
});

export type ReorderProjectIndexTypesInput = z.infer<
	typeof ReorderProjectIndexTypesSchema
>;

export type ProjectIndexType = {
	id: string;
	project: {
		id: string;
	};
	indexType: IndexType;
	displayName: string;
	description: string;
	ordinal: number;
	color: string;
	visible: boolean;
	created_at: string;
	updated_at: string | null;
	deleted_at: string | null;
	entry_count: number;
	is_deleted: boolean;
};

export type ProjectIndexTypeListItem = {
	id: string;
	ordinal: number;
	color: string;
	visible: boolean;
	indexType: IndexType;
	displayName: string;
	entry_count: number;
};

export type AvailableIndexType = {
	indexType: IndexType;
	displayName: string;
	description: string;
	defaultColor: string;
	defaultOrdinal: number;
};
