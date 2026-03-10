/**
 * Scripture citation ref parser (Phase 3). Parses a normalized local window
 * into ParsedRefSegment[] for book-only, chapter/verse, verse lists, and ranges.
 * Window is assumed normalized (lowercase, collapsed whitespace, dash normalized).
 */

import type { ParsedRefSegment } from "./parser-profile.types";

const SCRIPTURE_PROFILE_ID = "scripture-biblical";

/**
 * Extract ref portion: skip leading book name (single word: letters/dots) until first digit or end.
 * Prefix before first digit must be empty or one book-like token so we reject "see page 1".
 */
function refPortion(window: string): string | null {
	const trimmed = window.trim();
	const match = trimmed.match(/\d/);
	if (match?.index === undefined) return null;
	const prefix = trimmed.slice(0, match.index).trim();
	if (prefix.length > 0 && !/^[a-z.]+$/i.test(prefix)) return null; // not a single book-like word
	return trimmed.slice(match.index).trim();
}

/** Ref portion must only contain digits, separators (:.,;-), spaces, and optional verse suffixes (e.g. 3a). Reject "1 and 2", "see page 1" (page is not a suffix). */
function looksLikeRef(ref: string): boolean {
	const tokens = ref.split(/[\s:.,;\-]+/).filter(Boolean);
	return tokens.every((t) => /^\d+[a-z]?$/i.test(t));
}

/** Optional verse suffix (3a, 3b). Return numeric value, ref text, and optional suffix. */
function parseVerseNum(s: string): { num: number; refText: string; suffix?: string } {
	const m = s.match(/^(\d+)([a-z])?$/i);
	if (m) {
		const num = Number.parseInt(m[1], 10);
		const refText = m[2] ? `${m[1]}${m[2].toLowerCase()}` : m[1];
		const suffix = m[2] ? m[2].toLowerCase() : undefined;
		return { num, refText, suffix };
	}
	const n = Number.parseInt(s, 10);
	return { num: Number.isNaN(n) ? 0 : n, refText: s };
}

/** Parse a single ref token (no commas): ch, ch-ch, ch:v, ch.v, ch:v-v, cross-chapter. Returns one segment, or two for cross-chapter. */
function parseSingleRef(block: string): ParsedRefSegment | ParsedRefSegment[] | null {
	const t = block.trim();
	if (t.length === 0) return null;

	// Cross-chapter: 1:20-2:4 → two segments (1:20 to end of ch1, 2:1-4)
	const cross = t.match(/^(\d+)[:.](\d+)-(\d+)[:.](\d+)$/);
	if (cross) {
		const c1 = Number.parseInt(cross[1], 10);
		const v1 = Number.parseInt(cross[2], 10);
		const c2 = Number.parseInt(cross[3], 10);
		const v2 = Number.parseInt(cross[4], 10);
		return [
			{ refText: `${c1}:${v1}`, chapter: c1, verseStart: v1 },
			{ refText: `${c2}:1-${v2}`, chapter: c2, verseStart: 1, verseEnd: v2 },
		];
	}

	// ch:v-v (same chapter): 1:2-4
	const verseRange = t.match(/^(\d+)[:.](\d+)-(\d+)$/);
	if (verseRange) {
		const ch = Number.parseInt(verseRange[1], 10);
		const v1 = parseVerseNum(verseRange[2]);
		const v2 = parseVerseNum(verseRange[3]);
		const seg: ParsedRefSegment = {
			refText: t,
			chapter: ch,
			verseStart: v1.num,
			verseEnd: v2.num,
		};
		if (v1.suffix) seg.verseSuffix = v1.suffix;
		return seg;
	}

	// ch:v or ch.v (single verse, optional suffix): 1:2, 1.2, 1:3a
	const singleVerse = t.match(/^(\d+)[:.](\d+)([a-z])?$/i);
	if (singleVerse) {
		const ch = Number.parseInt(singleVerse[1], 10);
		const v = parseVerseNum(singleVerse[2] + (singleVerse[3] ?? ""));
		const seg: ParsedRefSegment = {
			refText: singleVerse[3] ? `${singleVerse[1]}:${v.refText}` : t,
			chapter: ch,
			verseStart: v.num,
			verseEnd: v.num,
		};
		if (v.suffix) seg.verseSuffix = v.suffix;
		return seg;
	}

	// Chapter range: 1-3 (chapters, not verses; verse mode requires : or .)
	const chRange = t.match(/^(\d+)-(\d+)$/);
	if (chRange) {
		const c1 = Number.parseInt(chRange[1], 10);
		const c2 = Number.parseInt(chRange[2], 10);
		return { refText: t, chapter: c1, chapterEnd: c2 };
	}

	// Chapter only: 1, 2
	const chOnly = t.match(/^(\d+)$/);
	if (chOnly) {
		const ch = Number.parseInt(chOnly[1], 10);
		return { refText: t, chapter: ch };
	}

	return null;
}

/** Verse list: 1:1, 2, 3 or 1:1, 3-5, 7. First element must be ch:v/ch.v (verse mode); rest are verses. */
function parseVerseList(block: string): ParsedRefSegment[] {
	const parts = block.split(",").map((p) => p.trim()).filter(Boolean);
	if (parts.length === 0) return [];

	const firstResult = parseSingleRef(parts[0]);
	const first = Array.isArray(firstResult) ? firstResult[0] : firstResult;
	if (!first || first.chapter === undefined) return [];

	const chapter = first.chapter;
	const segments: ParsedRefSegment[] = [...(Array.isArray(firstResult) ? firstResult : [first])];

	for (let i = 1; i < parts.length; i++) {
		const p = parts[i];
		// Verse range in list: 3-5
		const range = p.match(/^(\d+)([a-z])?-(\d+)([a-z])?$/i);
		if (range) {
			const v1 = parseVerseNum(range[1] + (range[2] ?? ""));
			const v2 = parseVerseNum(range[3] + (range[4] ?? ""));
			const seg: ParsedRefSegment = {
				refText: p,
				chapter,
				verseStart: v1.num,
				verseEnd: v2.num,
			};
			if (v1.suffix) seg.verseSuffix = v1.suffix;
			segments.push(seg);
			continue;
		}
		// Single verse in list: 7, 3a
		const single = p.match(/^(\d+)([a-z])?$/i);
		if (single) {
			const v = parseVerseNum(single[1] + (single[2] ?? ""));
			const seg: ParsedRefSegment = {
				refText: v.refText,
				chapter,
				verseStart: v.num,
				verseEnd: v.num,
			};
			if (v.suffix) seg.verseSuffix = v.suffix;
			segments.push(seg);
			continue;
		}
		// Not a verse form; treat as single ref and push if valid
		const one = parseSingleRef(p);
		if (one) {
			if (Array.isArray(one)) segments.push(...one);
			else segments.push(one);
		}
	}

	return segments;
}

/** Verse mode is triggered by : or . (e.g. 1:1 or 2.1). "1, 2, 3" without :/. is chapters, not verse list. */
function isVerseList(block: string): boolean {
	const parts = block.split(",").map((p) => p.trim()).filter(Boolean);
	if (parts.length < 2) return false;
	const first = parts[0];
	return /^\d+[:.]\d+([a-z])?$/i.test(first);
}

function parseBlock(block: string): ParsedRefSegment[] {
	const t = block.trim();
	if (!t) return [];

	if (isVerseList(t)) return parseVerseList(t);
	const single = parseSingleRef(t);
	if (single) return Array.isArray(single) ? single : [single];
	// Comma-separated refs (e.g. 1:1-3, 2:4-5; or 1, 2, 3 = chapters)
	const parts = t.split(",").map((p) => p.trim()).filter(Boolean);
	if (parts.length > 1) {
		const segments: ParsedRefSegment[] = [];
		for (const p of parts) {
			const one = parseSingleRef(p);
			if (one) {
				if (Array.isArray(one)) segments.push(...one);
				else segments.push(one);
			}
		}
		return segments;
	}
	return [];
}

function parseLocalWindow(localWindow: string): ParsedRefSegment[] {
	const trimmed = localWindow.trim();
	if (trimmed.length === 0) return [];

	const ref = refPortion(localWindow);
	// null = no digit (book-only) or invalid prefix (e.g. "see page 1")
	if (ref === null) {
		const hasDigit = /\d/.test(trimmed);
		if (!hasDigit) return [{ refText: "" }]; // book-only
		return []; // invalid prefix
	}
	if (!looksLikeRef(ref)) return [];

	const blocks = ref.split(";").map((b) => b.trim()).filter(Boolean);
	const segments: ParsedRefSegment[] = [];
	for (const block of blocks) {
		segments.push(...parseBlock(block));
	}
	return segments;
}

function contextPrecheck(localWindow: string): boolean {
	return localWindow.trim().length > 0;
}

export const scriptureParserProfile = {
	id: SCRIPTURE_PROFILE_ID,
	contextPrecheck,
	parse: parseLocalWindow,
} as const;
