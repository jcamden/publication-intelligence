import { z } from "zod";

// ============================================================================
// DTOs - Data Transfer Objects
// ============================================================================

export const CreateProjectSchema = z.object({
	title: z.string().min(1, "Title is required").max(500),
	description: z.string().max(2000).optional(),
	project_dir: z
		.string()
		.min(1, "Project directory is required")
		.max(100)
		.regex(
			/^[a-z0-9]+(?:-[a-z0-9]+)*$/,
			"Project directory must be lowercase letters, numbers, and hyphens only (e.g., my-project)",
		),
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
	project_dir: string;
	workspace: { id: string } | null;
	owner: { id: string; email: string };
	collaborators: Array<{ id: string; email: string }>;
	created_at: Date;
	updated_at: Date | null;
	deleted_at: Date | null;
	has_document: boolean;
	entry_count: number;
	is_deleted: boolean;
};

export type ProjectListItem = {
	id: string;
	title: string;
	description: string | null;
	project_dir: string;
	entry_count: number;
	created_at: Date;
	updated_at: Date | null;
	source_document: {
		id: string;
		title: string;
		file_name: string;
		file_size: number | null;
		page_count: number | null;
		storage_key: string;
		status: string;
	} | null;
};
