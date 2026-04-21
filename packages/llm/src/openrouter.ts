// ============================================================================
// OpenRouter Client
// ============================================================================

export type OpenRouterMessage = {
	role: "system" | "user" | "assistant";
	content: string;
};

export type OpenRouterRequest = {
	model: string;
	messages: OpenRouterMessage[];
	temperature?: number;
	max_tokens?: number;
	response_format?: { type: "json_object" };
};

export type OpenRouterResponse = {
	id: string;
	model: string;
	choices: Array<{
		message: {
			role: string;
			content: string;
		};
		finish_reason: string;
	}>;
	usage: {
		prompt_tokens: number;
		completion_tokens: number;
		total_tokens: number;
	};
};

export type OpenRouterCallResult = {
	content: string;
	usage: {
		promptTokens: number;
		completionTokens: number;
		totalTokens: number;
	};
};

export const callOpenRouter = async ({
	model,
	messages,
	temperature = 0.2,
	maxTokens = 4000,
	apiKey,
}: {
	model: string;
	messages: OpenRouterMessage[];
	temperature?: number;
	maxTokens?: number;
	apiKey?: string;
}): Promise<OpenRouterCallResult> => {
	const effectiveApiKey = apiKey || process.env.OPENROUTER_API_KEY;

	if (!effectiveApiKey) {
		throw new Error(
			"OpenRouter API key is required. Please configure it in project settings or set OPENROUTER_API_KEY environment variable.",
		);
	}

	const request: OpenRouterRequest = {
		model,
		messages,
		temperature,
		max_tokens: maxTokens,
		response_format: { type: "json_object" },
	};

	const response = await fetch(
		"https://openrouter.ai/api/v1/chat/completions",
		{
			method: "POST",
			headers: {
				Authorization: `Bearer ${effectiveApiKey}`,
				"Content-Type": "application/json",
				"HTTP-Referer": "https://indexpdf.com",
				"X-Title": "Index PDF - Concept Detection",
			},
			body: JSON.stringify(request),
		},
	);

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
	}

	const data = (await response.json()) as OpenRouterResponse;

	if (!data.choices || data.choices.length === 0) {
		throw new Error("OpenRouter returned no choices");
	}

	const content = data.choices[0].message.content;

	return {
		content,
		usage: {
			promptTokens: data.usage.prompt_tokens,
			completionTokens: data.usage.completion_tokens,
			totalTokens: data.usage.total_tokens,
		},
	};
};
