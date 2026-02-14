import type { LLMMention } from "./detection.types";

// ============================================================================
// Types
// ============================================================================

export type TextSearchResult = {
	mention: LLMMention;
	charStart: number;
	charEnd: number;
};

export type TextSearchResults = {
	found: TextSearchResult[];
	notFound: Array<{ mention: LLMMention; error: string }>;
	ambiguous: Array<{ mention: LLMMention; occurrences: number }>;
};

// ============================================================================
// Text Search
// ============================================================================

/**
 * Find all occurrences of a text span in the full text
 */
const findAllOccurrences = ({
	textSpan,
	fullText,
}: {
	textSpan: string;
	fullText: string;
}): number[] => {
	const positions: number[] = [];
	let searchFrom = 0;

	while (searchFrom < fullText.length) {
		const index = fullText.indexOf(textSpan, searchFrom);
		if (index === -1) break;

		positions.push(index);
		searchFrom = index + 1; // Move past this occurrence
	}

	return positions;
};

/**
 * Search for mentions in text and return their positions
 *
 * For each mention:
 * - If found exactly once: Success
 * - If found multiple times: Take the first occurrence (mark as ambiguous)
 * - If not found: Error
 */
export const searchMentionsInText = ({
	mentions,
	fullText,
}: {
	mentions: LLMMention[];
	fullText: string;
}): TextSearchResults => {
	const found: TextSearchResult[] = [];
	const notFound: Array<{ mention: LLMMention; error: string }> = [];
	const ambiguous: Array<{ mention: LLMMention; occurrences: number }> = [];

	for (const mention of mentions) {
		const occurrences = findAllOccurrences({
			textSpan: mention.textSpan,
			fullText,
		});

		if (occurrences.length === 0) {
			notFound.push({
				mention,
				error: `Text span "${mention.textSpan}" not found in document`,
			});
		} else if (occurrences.length === 1) {
			// Perfect: found exactly once
			found.push({
				mention,
				charStart: occurrences[0],
				charEnd: occurrences[0] + mention.textSpan.length,
			});
		} else {
			// Ambiguous: found multiple times, take first occurrence
			ambiguous.push({
				mention,
				occurrences: occurrences.length,
			});

			found.push({
				mention,
				charStart: occurrences[0],
				charEnd: occurrences[0] + mention.textSpan.length,
			});
		}
	}

	return { found, notFound, ambiguous };
};
