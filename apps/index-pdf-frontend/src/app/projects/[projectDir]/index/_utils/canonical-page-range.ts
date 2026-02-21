import { parsePageRange } from "@pubint/core";

const EN_DASH = "\u2013";

/**
 * Normalize backend page range string (may use en-dash "–") so parsePageRange can parse it.
 */
const normalizePageRangeString = (rangeStr: string): string =>
	rangeStr.replaceAll(EN_DASH, "-").trim();

/**
 * Map document page numbers to canonical page strings and merge consecutive
 * document pages into ranges. Returns a single string like "1–3, 5" (en-dash for ranges).
 *
 * @param documentPageRangeStr - Backend format e.g. "1–3, 5" or "1-3, 5"
 * @param docToCanonical - Map from document page number to canonical page string (fallback: String(docPage))
 */
export const documentPageRangeToCanonicalRangeString = ({
	documentPageRangeStr,
	docToCanonical,
}: {
	documentPageRangeStr: string;
	docToCanonical: Map<number, string>;
}): string => {
	if (!documentPageRangeStr.trim()) return "";

	const normalized = normalizePageRangeString(documentPageRangeStr);
	let documentPages: number[];
	try {
		documentPages = parsePageRange({ rangeStr: normalized });
	} catch {
		return documentPageRangeStr;
	}

	if (documentPages.length === 0) return "";

	const canonicalValues = documentPages.map(
		(docPage) => docToCanonical.get(docPage) ?? String(docPage),
	);

	// Group consecutive document pages into runs (by position in sorted list)
	const runs: { startCanonical: string; endCanonical: string }[] = [];
	let runEndDoc = documentPages[0];
	let runStartCanonical = canonicalValues[0];
	let runEndCanonical = canonicalValues[0];

	for (let i = 1; i < documentPages.length; i++) {
		const docPage = documentPages[i];
		const canonical = canonicalValues[i];
		if (docPage === runEndDoc + 1) {
			runEndDoc = docPage;
			runEndCanonical = canonical;
		} else {
			runs.push({
				startCanonical: runStartCanonical,
				endCanonical: runEndCanonical,
			});
			runEndDoc = docPage;
			runStartCanonical = canonical;
			runEndCanonical = canonical;
		}
	}
	runs.push({
		startCanonical: runStartCanonical,
		endCanonical: runEndCanonical,
	});

	return runs
		.map(({ startCanonical, endCanonical }) =>
			startCanonical === endCanonical
				? startCanonical
				: `${startCanonical}${EN_DASH}${endCanonical}`,
		)
		.join(", ");
};
