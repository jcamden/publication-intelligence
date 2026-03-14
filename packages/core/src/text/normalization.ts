/**
 * Text normalization for matcher-based detection.
 * Contract: NFKC → lowercase → dash normalization → whitespace collapse.
 * Punctuation is preserved (not stripped).
 * Offset spans use half-open intervals [start, end).
 */

/** Unicode dash characters normalized to ASCII hyphen-minus (U+002D) */
const DASH_CHARS =
	/[\u058A\u1806\u2010-\u2015\u2212\u00AD\u2E3A\u2E3B\uFE58\uFE63\uFF0D]/g;

/** Matches one or more whitespace characters (including Unicode) */
const WHITESPACE_RUN = /\s+/g;

/**
 * Normalizes text for matching: NFKC → lowercase → dash norm → whitespace collapse.
 * Does not strip punctuation.
 */
export function normalize(text: string): string {
	const nfkc = text.normalize("NFKC");
	const lower = nfkc.toLowerCase();
	const dashed = lower.replace(DASH_CHARS, "-");
	const collapsed = dashed.replace(WHITESPACE_RUN, " ");
	return collapsed;
}

export type NormalizeWithOffsetMapResult = {
	normalizedText: string;
	/** Maps a normalized string index to the original (pre-normalization) index */
	mapNormalizedIndexToOriginalIndex: (normalizedIndex: number) => number;
	/** Maps a half-open span [start, end) in normalized text to [originalStart, originalEnd) */
	mapNormalizedSpanToOriginalSpan: (
		start: number,
		end: number,
	) => [number, number];
};

/**
 * Normalizes text and returns offset mappings from normalized indices/spans back to original.
 * - Collapse case (e.g. multiple spaces → one): normalized index maps to first original index of the group.
 * - Expansion case (e.g. one original char → multiple normalized): each normalized char maps to same original index.
 */
export function normalizeWithOffsetMap(
	text: string,
): NormalizeWithOffsetMapResult {
	// Build normalized string and mapping array: map[normalizedIndex] = originalIndex
	const map: number[] = [];
	let normalized = "";

	// Step 1: NFKC — process by character so we can track; multi-codepoint composition maps to first original index
	let i = 0;
	while (i < text.length) {
		const nfkc = text[i].normalize("NFKC");
		for (const c of nfkc) {
			map.push(i);
			normalized += c;
		}
		i++;
	}

	// Step 2: lowercase — 1:1, mapping unchanged
	normalized = normalized.toLowerCase();

	// Step 3: dash normalization — 1:1, mapping unchanged
	const afterDash: string[] = [];
	for (let j = 0; j < normalized.length; j++) {
		const char = normalized[j];
		const isDash =
			/[\u058A\u1806\u2010-\u2015\u2212\u00AD\u2E3A\u2E3B\uFE58\uFE63\uFF0D]/.test(
				char,
			);
		afterDash.push(isDash ? "-" : char);
	}
	normalized = afterDash.join("");

	// Step 4: whitespace collapse — many:1, map collapsed run to first original index
	const result: string[] = [];
	const resultMap: number[] = [];
	let k = 0;
	while (k < normalized.length) {
		const startK = k;
		const isSpace = (ch: string) => /\s/.test(ch);
		while (k < normalized.length && isSpace(normalized[k])) {
			k++;
		}
		if (k > startK) {
			// collapse run to single space; map to first original index of run
			result.push(" ");
			resultMap.push(map[startK]);
		} else {
			result.push(normalized[k]);
			resultMap.push(map[k]);
			k++;
		}
	}

	const finalNormalized = result.join("");
	const finalMap = resultMap;

	function mapNormalizedIndexToOriginalIndex(normalizedIndex: number): number {
		if (normalizedIndex < 0 || normalizedIndex >= finalMap.length) {
			return normalizedIndex < 0 ? 0 : text.length;
		}
		return finalMap[normalizedIndex];
	}

	function mapNormalizedSpanToOriginalSpan(
		startIdx: number,
		endIdx: number,
	): [number, number] {
		const oStart =
			startIdx <= 0 ? 0 : mapNormalizedIndexToOriginalIndex(startIdx);
		const oEnd =
			endIdx >= finalMap.length
				? text.length
				: mapNormalizedIndexToOriginalIndex(endIdx);
		return [oStart, oEnd];
	}

	return {
		normalizedText: finalNormalized,
		mapNormalizedIndexToOriginalIndex,
		mapNormalizedSpanToOriginalSpan,
	};
}
