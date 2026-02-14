import { z } from "zod";

// ============================================================================
// DTOs - Data Transfer Objects
// ============================================================================

export const GetProjectSettingsSchema = z.object({
	projectId: z.string().uuid("Invalid project ID"),
});

export type GetProjectSettingsInput = z.infer<typeof GetProjectSettingsSchema>;

export const UpdateProjectSettingsSchema = z.object({
	projectId: z.string().uuid("Invalid project ID"),
	openrouterApiKey: z.string().optional(),
	defaultDetectionModel: z.string().optional(),
});

export type UpdateProjectSettingsInput = z.infer<
	typeof UpdateProjectSettingsSchema
>;

export const ListModelsSchema = z.object({
	projectId: z.string().uuid("Invalid project ID"),
});

export type ListModelsInput = z.infer<typeof ListModelsSchema>;

// ============================================================================
// Domain Types
// ============================================================================

export type ProjectSettings = {
	id: string;
	projectId: string;
	openrouterApiKey: string | null;
	defaultDetectionModel: string | null;
	createdAt: Date;
	updatedAt: Date | null;
};

export type OpenRouterModel = {
	id: string;
	name: string;
	description?: string;
	context_length: number;
	pricing: {
		prompt: string;
		completion: string;
	};
	top_provider?: {
		is_moderated: boolean;
		max_completion_tokens: number | null;
	};
};

export type OpenRouterModelsResponse = {
	data: OpenRouterModel[];
};
