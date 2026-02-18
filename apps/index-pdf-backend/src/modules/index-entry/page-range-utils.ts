/**
 * Normalize mention page data to [start, end] pairs (end = pageNumberEnd ?? pageNumber).
 */
type PageSpan = { pageNumber: number; pageNumberEnd?: number | null };

const toRanges = (mentions: PageSpan[]): [number, number][] =>
	mentions.map((m) => [m.pageNumber, m.pageNumberEnd ?? m.pageNumber]);

/**
 * Merge overlapping or adjacent ranges, sort by start, then format as "1–3, 5, 7".
 * Single-page ranges render as "5"; multi-page as "5–7".
 */
export const mergeAndFormatPageRanges = ({
	mentions,
}: {
	mentions: PageSpan[];
}): string => {
	if (mentions.length === 0) return "";

	const ranges = toRanges(mentions);
	const merged: [number, number][] = [];

	for (const [start, end] of ranges.sort((a, b) => a[0] - b[0])) {
		const last = merged[merged.length - 1];
		if (last != null && start <= last[1] + 1) {
			last[1] = Math.max(last[1], end);
		} else {
			merged.push([start, end]);
		}
	}

	return merged.map(([s, e]) => (s === e ? String(s) : `${s}–${e}`)).join(", ");
};
