import { z } from "zod";

// ============================================================================
// DTOs - Data Transfer Objects
// ============================================================================

export const CreateProjectSchema = z.object({
	title: z.string().min(1, "Title is required").max(500),
	description: z.string().max(2000).optional(),
	workspace: z.string().uuid().optional(),
});

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;

export const UpdateProjectSchema = z.object({
	title: z.string().min(1).max(500).optional(),
	description: z.string().max(2000).optional().nullable(),
	workspace: z.string().uuid().optional().nullable(),
});

export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;

// ============================================================================
// Domain Types
// ============================================================================

export type Project = {
	id: string;
	title: string;
	description: string | null;
	workspace: { id: string } | null;
	owner: { id: string; email: string };
	collaborators: Array<{ id: string; email: string }>;
	created_at: Date;
	updated_at: Date | null;
	deleted_at: Date | null;
	document_count: number;
	entry_count: number;
	is_deleted: boolean;
};

export type ProjectListItem = {
	id: string;
	title: string;
	description: string | null;
	document_count: number;
	entry_count: number;
	created_at: Date;
	updated_at: Date | null;
};
