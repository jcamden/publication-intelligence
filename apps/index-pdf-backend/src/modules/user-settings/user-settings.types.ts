import { z } from "zod";

// ============================================================================
// DTOs - Data Transfer Objects
// ============================================================================

export const GetUserSettingsSchema = z.object({});

export type GetUserSettingsInput = z.infer<typeof GetUserSettingsSchema>;

export const UpdateUserSettingsSchema = z.object({
	openrouterApiKey: z.string().optional(),
	defaultDetectionModel: z.string().optional(),
});

export type UpdateUserSettingsInput = z.infer<typeof UpdateUserSettingsSchema>;

export const ListModelsSchema = z.object({});

export type ListModelsInput = z.infer<typeof ListModelsSchema>;

// ============================================================================
// Domain Types
// ============================================================================

export type UserSettings = {
	openrouterApiKey: string | null;
	defaultDetectionModel: string | null;
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
