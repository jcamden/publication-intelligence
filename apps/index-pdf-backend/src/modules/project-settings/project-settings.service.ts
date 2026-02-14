import * as projectSettingsRepo from "./project-settings.repo";
import type {
	GetProjectSettingsInput,
	OpenRouterModel,
	OpenRouterModelsResponse,
	ProjectSettings,
	UpdateProjectSettingsInput,
} from "./project-settings.types";

// ============================================================================
// Service Layer - Business Logic
// ============================================================================

export const getProjectSettings = async ({
	userId,
	input,
}: {
	userId: string;
	input: GetProjectSettingsInput;
}): Promise<ProjectSettings | null> => {
	return await projectSettingsRepo.getProjectSettings({
		userId,
		projectId: input.projectId,
	});
};

export const updateProjectSettings = async ({
	userId,
	input,
}: {
	userId: string;
	input: UpdateProjectSettingsInput;
}): Promise<ProjectSettings> => {
	return await projectSettingsRepo.upsertProjectSettings({
		userId,
		projectId: input.projectId,
		openrouterApiKey: input.openrouterApiKey,
		defaultDetectionModel: input.defaultDetectionModel,
	});
};

export const listAvailableModels = async ({
	userId,
	projectId,
}: {
	userId: string;
	projectId: string;
}): Promise<OpenRouterModel[]> => {
	// Get project settings to use the API key
	const settings = await projectSettingsRepo.getProjectSettings({
		userId,
		projectId,
	});

	// Use project API key if available, otherwise fall back to env var
	const apiKey = settings?.openrouterApiKey || process.env.OPENROUTER_API_KEY;

	if (!apiKey) {
		// Return a default list of free models if no API key
		return getDefaultFreeModels();
	}

	try {
		const response = await fetch("https://openrouter.ai/api/v1/models", {
			headers: {
				Authorization: `Bearer ${apiKey}`,
			},
		});

		if (!response.ok) {
			console.error("Failed to fetch OpenRouter models:", response.statusText);
			return getDefaultFreeModels();
		}

		const data = (await response.json()) as OpenRouterModelsResponse;

		// Filter and sort models
		return data.data
			.filter((model) => {
				// Include models that are available and not deprecated
				return !model.id.includes("deprecated");
			})
			.sort((a, b) => {
				// Sort free models first, then by name
				const aPrice = Number.parseFloat(a.pricing.prompt);
				const bPrice = Number.parseFloat(b.pricing.prompt);

				if (aPrice === 0 && bPrice !== 0) return -1;
				if (aPrice !== 0 && bPrice === 0) return 1;

				return a.name.localeCompare(b.name);
			});
	} catch (error) {
		console.error("Error fetching OpenRouter models:", error);
		return getDefaultFreeModels();
	}
};

// ============================================================================
// Helper Functions
// ============================================================================

const getDefaultFreeModels = (): OpenRouterModel[] => {
	return [
		{
			id: "meta-llama/llama-3.2-3b-instruct:free",
			name: "Meta: Llama 3.2 3B Instruct (free)",
			description: "Fast, efficient 3B parameter model from Meta",
			context_length: 131072,
			pricing: {
				prompt: "0",
				completion: "0",
			},
		},
		{
			id: "google/gemini-flash-1.5:free",
			name: "Google: Gemini Flash 1.5 (free)",
			description: "Fast and versatile model from Google",
			context_length: 1048576,
			pricing: {
				prompt: "0",
				completion: "0",
			},
		},
		{
			id: "mistralai/mistral-7b-instruct:free",
			name: "Mistral: 7B Instruct (free)",
			description: "Efficient 7B parameter model",
			context_length: 32768,
			pricing: {
				prompt: "0",
				completion: "0",
			},
		},
		{
			id: "openai/gpt-4o-mini",
			name: "OpenAI: GPT-4o Mini",
			description: "Cost-effective GPT-4 variant",
			context_length: 128000,
			pricing: {
				prompt: "0.00015",
				completion: "0.0006",
			},
		},
		{
			id: "anthropic/claude-3.5-haiku",
			name: "Anthropic: Claude 3.5 Haiku",
			description: "Fast and affordable Claude model",
			context_length: 200000,
			pricing: {
				prompt: "0.0008",
				completion: "0.004",
			},
		},
	];
};
