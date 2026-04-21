import { callOpenRouter } from "@pubint/llm";
import { logEvent } from "../../logger";
import type { LLMDetectionResponse } from "./detection.types";

// ============================================================================
// LLM Detection Call (domain-specific JSON shape)
// ============================================================================

export const callLLMForDetection = async ({
	prompt,
	model,
	apiKey,
}: {
	prompt: string;
	model: string;
	apiKey?: string;
}): Promise<LLMDetectionResponse> => {
	// Combine system prompt and user prompt into a single user message
	// Some models (like Gemma 3) don't support system messages
	const combinedPrompt = `${buildSystemPrompt()}\n\n---\n\n${prompt}`;

	const messages = [
		{
			role: "user" as const,
			content: combinedPrompt,
		},
	];

	const response = await callOpenRouter({
		model,
		messages,
		temperature: 0.2,
		maxTokens: 8000,
		apiKey,
	});

	try {
		// Strip markdown code blocks if present
		let cleanedContent = response.content.trim();

		// Remove ```json or ``` wrappers
		if (cleanedContent.startsWith("```")) {
			cleanedContent = cleanedContent.replace(/^```(?:json)?\n?/, "");
			cleanedContent = cleanedContent.replace(/\n?```$/, "");
			cleanedContent = cleanedContent.trim();
		}

		const parsed = JSON.parse(cleanedContent) as LLMDetectionResponse;
		return parsed;
	} catch (error) {
		const preview =
			response.content.length > 2000
				? `${response.content.slice(0, 2000)}…`
				: response.content;
		logEvent({
			event: "detection.llm_parse_failed",
			context: {
				metadata: {
					rawContentPreview: preview,
					parseError: error instanceof Error ? error.message : String(error),
				},
			},
		});
		throw new Error(
			`Failed to parse LLM response: ${error instanceof Error ? error.message : String(error)}. Check backend logs for raw response.`,
		);
	}
};

// ============================================================================
// System Prompt
// ============================================================================

const buildSystemPrompt = (): string => {
	return `You are an expert indexer for academic and technical publications. Your task is to analyze text and identify concepts that should appear in a back-of-book index.

**Your task:**
1. Identify important concepts, terms, entities, and topics that a reader would want to look up
2. For each concept, find ALL mentions in the text
3. Use precise character offsets (charAt positions) to reference each mention

**CRITICAL: You must return ONLY valid, parseable JSON. No markdown, no code blocks, no explanatory text.**

**CRITICAL: Response Format**

You MUST return a JSON object with EXACTLY this structure. Do NOT include any other fields:

{
  "entries": [
    {
      "label": "string",
      "indexType": "subject" | "author" | "scripture",
      "meaningType": "string (optional)",
      "meaningId": "string (optional)",
      "description": "string (optional)"
    }
  ],
  "mentions": [
    {
      "entryLabel": "string",
      "indexType": "subject" | "author" | "scripture",
      "pageNumber": number,
      "textSpan": "string"
    }
  ]
}

**IMPORTANT: Each mention object should have ONLY these 4 fields:**
- entryLabel (must match an entry label exactly)
- indexType (must match: "subject", "author", or "scripture")
- pageNumber (the page number, in this case always the primary page)
- textSpan (the exact text as it appears in the document)

**DO NOT include charStart, charEnd, or any other fields in mentions!**

**Text Span Rules:**
- textSpan must be the EXACT text as it appears in the document
- Include all punctuation, spaces, and special characters exactly
- Keep textSpans short and precise (typically 5-50 characters)
- For scripture references, copy the exact format (e.g., "Lev 25:47" not "Leviticus 25:47")
- For author names, use the exact format that appears (e.g., "Milgrom" or "J. Milgrom")

**Index Type Guidelines:**
- "subject": General concepts, topics, terminology, methods, theories
- "author": Person names, author citations
- "scripture": Biblical or religious text references

**Quality Guidelines:**
- Be selective: Only index significant concepts, not every noun
- Use canonical forms: "machine learning" not "Machine Learning"
- Group related terms: "neural network" should be one entry, not separate
- Include cross-references in description if helpful
- Verify your character offsets are accurate

**JSON Formatting Rules:**
- Escape all special characters in strings (quotes, backslashes, newlines)
- Use double quotes for all strings
- Ensure all arrays and objects are properly closed
- Do not include trailing commas
- Do not wrap the JSON in markdown code blocks

Return ONLY valid JSON, no additional text.`;
};
