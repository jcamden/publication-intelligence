/**
 * Scripture citation ref parser (Phase 3). Parses a normalized local window
 * into ParsedRefSegment[] for book-only, chapter/verse, verse lists, and ranges.
 * Window is assumed normalized (lowercase, collapsed whitespace, dash normalized).
 */

import { normalize } from "../text/normalization";
import type {
	CitationParseResult,
	CitationSegment,
	ParsedRefSegment,
} from "./parser-profile.types";

/** Result of scanning for standalone ref spans (no book prefix). */
export type StandaloneRefSpan = {
	start: number;
	end: number;
	refText: string;
};

/** Hyphen, en-dash, em-dash: match normalized and typographic dashes in refs (e.g. 1:6–28:69). */
const DASH_CHAR_CLASS = "[-\u2013\u2014]";

/**
 * Ref-like patterns for standalone detection. Only formats that clearly indicate
 * scripture (ch:v, ch:v-v, cross-chapter, verse lists). Excludes chapter-only and
 * chapter-range to avoid false positives (e.g. "page 1", "chapter 2").
 */
const STANDALONE_REF_PATTERNS = [
	new RegExp(`\\d+:\\d+[a-z]?${DASH_CHAR_CLASS}\\d+:\\d+[a-z]?`, "gi"), // cross-chapter: 1:20-2:4, 1:6–28:69
	new RegExp(
		`\\d+[.:]\\d+[a-z]?(${DASH_CHAR_CLASS}\\d+[a-z]?)?(\\s*,\\s*\\d+([a-z])?(${DASH_CHAR_CLASS}\\d+[a-z]?)?)+`,
		"gi",
	), // verse list: 27:1-8, 9-14
	new RegExp(`\\d+[.:]\\d+[a-z]?${DASH_CHAR_CLASS}\\d+[a-z]?`, "gi"), // verse range: 1:2-4
	/\d+[.:]\d+[a-z]?/g, // ch:v or ch.v: 4:35, 1.2
];

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
	const tokens = ref.split(/[\s:.,;-]+/).filter(Boolean);
	return tokens.every((t) => /^\d+[a-z]?$/i.test(t));
}

/** Optional verse suffix (3a, 3b). Return numeric value, ref text, and optional suffix. */
function parseVerseNum(s: string): {
	num: number;
	refText: string;
	suffix?: string;
} {
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
function parseSingleRef(
	block: string,
): ParsedRefSegment | ParsedRefSegment[] | null {
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
	const parts = block
		.split(",")
		.map((p) => p.trim())
		.filter(Boolean);
	if (parts.length === 0) return [];

	const firstResult = parseSingleRef(parts[0]);
	const first = Array.isArray(firstResult) ? firstResult[0] : firstResult;
	if (!first || first.chapter === undefined) return [];

	const chapter = first.chapter;
	const segments: ParsedRefSegment[] = [
		...(Array.isArray(firstResult) ? firstResult : [first]),
	];

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

/** Verse mode is triggered by : or . (e.g. 1:1, 1:1-8, or 2.1). "1, 2, 3" without :/. is chapters, not verse list. */
function isVerseList(block: string): boolean {
	const parts = block
		.split(",")
		.map((p) => p.trim())
		.filter(Boolean);
	if (parts.length < 2) return false;
	const first = parts[0];
	// ch:v, ch:v-v, or ch:v (suffix)
	return /^\d+[:.]\d+([a-z])?(-\d+([a-z])?)?$/i.test(first);
}

function parseBlock(block: string): ParsedRefSegment[] {
	const t = block.trim();
	if (!t) return [];

	if (isVerseList(t)) return parseVerseList(t);
	const single = parseSingleRef(t);
	if (single) return Array.isArray(single) ? single : [single];
	// Comma-separated refs (e.g. 1:1-3, 2:4-5; or 1, 2, 3 = chapters)
	const parts = t
		.split(",")
		.map((p) => p.trim())
		.filter(Boolean);
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

/** True if block starts with a book-like word (new book context); stop parsing there. */
function blockStartsWithBookName(block: string): boolean {
	const t = block.trim();
	if (t.length === 0) return false;
	// Starts with letters (possibly with dots) before any digit = book name
	const beforeDigit = t.match(/^\s*([a-z.]+)/i);
	return Boolean(beforeDigit && beforeDigit[1].length > 1);
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

	const blocks = ref
		.split(";")
		.map((b) => b.trim())
		.filter(Boolean);
	const segments: ParsedRefSegment[] = [];
	for (const block of blocks) {
		// Strip leading "and " so "and 6:1" parses as "6:1" (e.g. "Deut 1:5; 4:44; and 6:1")
		const blockWithoutAnd = block.replace(/^and\s+/i, "").trim();
		if (blockStartsWithBookName(blockWithoutAnd)) break; // new book, stop
		if (!looksLikeRef(blockWithoutAnd)) break; // non-ref content, stop
		segments.push(...parseBlock(blockWithoutAnd));
	}
	return segments;
}

function contextPrecheck(localWindow: string): boolean {
	return localWindow.trim().length > 0;
}

/**
 * Map parsed segments to CitationSegments with best-effort source offsets
 * by finding each refText in the consumed text sequentially.
 */
function segmentsWithOffsets(
	segments: ParsedRefSegment[],
	consumedText: string,
): CitationSegment[] {
	const result: CitationSegment[] = [];
	let searchFrom = 0;
	for (const seg of segments) {
		const refText = seg.refText ?? "";
		if (refText.length === 0) {
			result.push({
				...seg,
				sourceStart: searchFrom,
				sourceEnd: searchFrom,
			});
			continue;
		}
		const idx = consumedText.indexOf(refText, searchFrom);
		const start = idx >= 0 ? idx : searchFrom;
		const end = start + refText.length;
		result.push({
			refText: seg.refText,
			chapter: seg.chapter,
			chapterEnd: seg.chapterEnd,
			verseStart: seg.verseStart,
			verseEnd: seg.verseEnd,
			verseSuffix: seg.verseSuffix,
			sourceStart: start,
			sourceEnd: end,
		});
		searchFrom = end;
	}
	return result;
}

/**
 * Compatibility shim: derive CitationParseResult from current parse().
 * Preserves behavior; segment offsets and consumed span are best-effort.
 */
function parseAfterAlias(args: {
	normalizedWindow: string;
	otherBookAliases?: string[];
}): CitationParseResult {
	const { normalizedWindow } = args;
	const trimmed = normalizedWindow.trim();
	const segments = parseLocalWindow(normalizedWindow);

	// Consumed span: whole window (current parser doesn't expose exact consumed length)
	const consumedStart = 0;
	const consumedEnd = trimmed.length;
	const consumedText = trimmed;

	// Status
	let status: "match" | "book_only" | "no_match" | "ambiguous" = "no_match";
	if (segments.length === 0) {
		status = "no_match";
	} else if (segments.length === 1 && segments[0].refText === "") {
		status = "book_only";
	} else {
		status = "match";
	}

	// Stop reason: current parser doesn't expose; assume end_of_input for shim
	const stopReason = "end_of_input" as const;

	// Explicit ref syntax: any segment with non-empty refText and chapter/verse or digit
	const hasExplicitRefSyntax =
		segments.some(
			(s) =>
				s.refText.length > 0 &&
				(s.chapter !== undefined || /\d/.test(s.refText)),
		) ?? false;

	const segmentsWithSource = segmentsWithOffsets(segments, consumedText);

	return {
		status,
		consumedText,
		consumedStart,
		consumedEnd,
		segments: segmentsWithSource,
		stopReason,
		hasExplicitRefSyntax,
	};
}

export const scriptureParserProfile = {
	id: SCRIPTURE_PROFILE_ID,
	contextPrecheck,
	parse: parseLocalWindow,
	parseAfterAlias,
	// scanBookless omitted; optional on ParserProfile
} as const;

/** Scripture-indicating keywords: accept chapter-only/range when preceded by these (e.g. "ch 1-2", "vv. 1-3"). */
const SCRIPTURE_PRECEDING_WORDS = new Set([
	"ch",
	"ch.",
	"verse",
	"verses",
	"v",
	"v.",
	"vv",
	"vv.",
]);

/** Non-scripture keywords: reject chapter-only/range when preceded by these (e.g. "page 1", "no. 5"). */
const NON_SCRIPTURE_PRECEDING_WORDS = new Set([
	"page",
	"pages",
	"pp",
	"pp.",
	"p",
	"p.",
	"no",
	"number",
	"num",
	"n",
	"n.",
	"chapter",
]);

function precedingWord(text: string, position: number): string | null {
	if (position <= 0) return null;
	let end = position;
	while (end > 0 && /\s/.test(text[end - 1])) end--;
	if (end <= 0) return null;
	let start = end;
	while (start > 0 && /[\p{L}\p{N}.]/u.test(text[start - 1])) start--;
	const word = text.slice(start, end).toLowerCase();
	return word.length > 0 ? word : null;
}

export type FindStandaloneRefSpansOptions = {
	/** Include chapter-only and chapter-range (for alias window; use REJECT_PRECEDING_WORDS to filter) */
	includeChapterAndRange?: boolean;
};

/**
 * Find standalone ref spans in text (refs without a preceding book name).
 * Used for contextual scripture detection: "Daniel... in 4:35" where "4:35" is implied Daniel 4:35.
 */
export function findStandaloneRefSpans(
	text: string,
	options: FindStandaloneRefSpansOptions = {},
): StandaloneRefSpan[] {
	const results: StandaloneRefSpan[] = [];
	const seen = new Set<string>();
	const patterns = options.includeChapterAndRange
		? [
				...STANDALONE_REF_PATTERNS,
				/\d+-\d+/g, // chapter range: 13-14
				/\b\d+\b/g, // chapter only: 18
			]
		: STANDALONE_REF_PATTERNS;

	for (const pattern of patterns) {
		pattern.lastIndex = 0;
		let m = pattern.exec(text);
		while (m !== null) {
			const start = m.index;
			const end = start + m[0].length;
			const key = `${start}-${end}`;
			m = pattern.exec(text); // advance before continue to avoid infinite loop
			if (seen.has(key)) continue;
			seen.add(key);

			const refText = text.slice(start, end);
			// Chapter-only/range: accept only when preceded by scripture keywords; reject non-scripture or unknown.
			if (
				options.includeChapterAndRange &&
				(/^\d+$/.test(refText.trim()) || /^\d+-\d+$/.test(refText.trim()))
			) {
				const word = precedingWord(text, start);
				if (word) {
					if (NON_SCRIPTURE_PRECEDING_WORDS.has(word)) continue;
					if (!SCRIPTURE_PRECEDING_WORDS.has(word)) continue; // unknown word → reject
				}
			}
			const normalized = normalize(refText);
			const segments = parseLocalWindow(normalized);
			if (segments.length === 0) continue;
			// Reject book-only (refText empty)
			if (segments.length === 1 && segments[0].refText === "") continue;

			results.push({ start, end, refText });
		}
	}

	// Sort by start, then by length desc (longer first)
	results.sort((a, b) => {
		if (a.start !== b.start) return a.start - b.start;
		return b.end - b.start - (a.end - a.start);
	});

	// Dedupe overlapping: keep longer span
	const deduped: StandaloneRefSpan[] = [];
	for (const r of results) {
		const overlaps = deduped.some((d) => r.start < d.end && r.end > d.start);
		if (!overlaps) deduped.push(r);
	}

	return deduped;
}
