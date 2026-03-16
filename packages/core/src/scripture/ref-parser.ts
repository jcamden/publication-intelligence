/**
 * Scripture citation ref parser (Phase 3). Parses a normalized local window
 * into ParsedRefSegment[] for book-only, chapter/verse, verse lists, and ranges.
 * Window is assumed normalized (lowercase, collapsed whitespace, dash normalized).
 */

import { normalize } from "../text/normalization";
import type {
	CitationParseResult,
	CitationSegment,
	CitationStopReason,
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
function _blockStartsWithBookName(block: string): boolean {
	const t = block.trim();
	if (t.length === 0) return false;
	// Starts with letters (possibly with dots) before any digit = book name
	const beforeDigit = t.match(/^\s*([a-z.]+)/i);
	return Boolean(beforeDigit && beforeDigit[1].length > 1);
}

/** Ref-like characters: digits, separators, spaces. Letters and ) end the block. */
function isRefChar(c: string): boolean {
	if (c.length !== 1) return false;
	return /[\d:.,\-\s\u2013\u2014]/.test(c) || c === ";";
}

/** Read a word (letters and dots) starting at pos. Returns word and end index (exclusive). */
function readWord(window: string, pos: number): { word: string; end: number } {
	let end = pos;
	while (end < window.length && /[\p{L}.]/u.test(window[end])) end++;
	return { word: window.slice(pos, end).toLowerCase(), end };
}

/**
 * Find the end of the current ref block and why we stopped.
 * From start: optional "and ", then ref content until ; or letter or ) or end.
 * If we hit a letter, read word: if in otherBookAliases -> new_book else prose.
 */
function scanBlockEnd(
	window: string,
	start: number,
	otherBookAliases: string[] | undefined,
): {
	blockEnd: number;
	stopReason: CitationStopReason;
	afterSemicolon: boolean;
} {
	let pos = start;
	const len = window.length;
	// Optional "and " at start of block
	const andMatch = window.slice(pos).match(/^\s*and\s+/i);
	if (andMatch) pos += andMatch[0].length;

	const blockStart = pos;
	while (pos < len) {
		const c = window[pos];
		if (c === ")") {
			return {
				blockEnd: pos,
				stopReason: "closing_paren",
				afterSemicolon: false,
			};
		}
		if (c === ";") {
			return {
				blockEnd: pos,
				stopReason: "end_of_input",
				afterSemicolon: true,
			};
		}
		if (/[\p{L}]/u.test(c)) {
			// Verse suffix (e.g. 3a, 3b): single letter a-z immediately after a digit
			if (
				pos > blockStart &&
				/\d/.test(window[pos - 1]) &&
				/^[a-z]$/i.test(c)
			) {
				pos++;
				continue;
			}
			const { word, end } = readWord(window, pos);
			if (word === "and") {
				pos = end;
				while (pos < len && /\s/.test(window[pos])) pos++;
				continue;
			}
			const isOtherBook =
				otherBookAliases?.length &&
				otherBookAliases.some((alias) => alias.toLowerCase().trim() === word);
			return {
				blockEnd: pos,
				stopReason: isOtherBook ? "new_book" : "prose",
				afterSemicolon: false,
			};
		}
		if (!isRefChar(c)) {
			// Invalid ref character
			return {
				blockEnd: pos,
				stopReason: "invalid_syntax",
				afterSemicolon: false,
			};
		}
		pos++;
	}
	return {
		blockEnd: pos,
		stopReason: "end_of_input",
		afterSemicolon: false,
	};
}

/** Map parsed segments to CitationSegments with source offsets relative to window. */
function segmentsWithOffsetsInWindow(
	segments: ParsedRefSegment[],
	blockStart: number,
	blockText: string,
): CitationSegment[] {
	const trimmed = blockText.trim();
	const leadingSpaces = blockText.length - blockText.trimStart().length;
	const result: CitationSegment[] = [];
	let searchFrom = 0;
	for (const seg of segments) {
		const refText = seg.refText ?? "";
		if (refText.length === 0) {
			result.push({
				...seg,
				sourceStart: blockStart + leadingSpaces,
				sourceEnd: blockStart + leadingSpaces,
			});
			continue;
		}
		const idx = trimmed.indexOf(refText, searchFrom);
		const startInBlock =
			idx >= 0 ? leadingSpaces + idx : leadingSpaces + searchFrom;
		const endInBlock = startInBlock + refText.length;
		result.push({
			refText: seg.refText,
			chapter: seg.chapter,
			chapterEnd: seg.chapterEnd,
			verseStart: seg.verseStart,
			verseEnd: seg.verseEnd,
			verseSuffix: seg.verseSuffix,
			sourceStart: blockStart + startInBlock,
			sourceEnd: blockStart + endInBlock,
		});
		searchFrom = idx >= 0 ? idx + refText.length : searchFrom;
	}
	return result;
}

/**
 * Consume the citation tail after an alias. Uses a consuming parser: advances
 * through the window, parses ref blocks (semicolon-separated), stops on new book,
 * prose, invalid syntax, or closing paren. Returns rich result with consumed span
 * and segment source offsets relative to the window.
 */
function parseAfterAliasImpl(args: {
	normalizedWindow: string;
	otherBookAliases?: string[];
}): CitationParseResult {
	const { normalizedWindow, otherBookAliases } = args;
	const window = normalizedWindow;
	const len = window.length;

	// Skip leading whitespace to find where to start scanning
	let pos = 0;
	while (pos < len && /\s/.test(window[pos])) pos++;

	const allSegments: CitationSegment[] = [];
	let stopReason: CitationStopReason = "end_of_input";
	let consumedStart = pos;
	let consumedEnd = pos;

	while (pos < len) {
		// Skip space and optional "and " at start of each block
		while (pos < len && /\s/.test(window[pos])) pos++;
		const andMatch = window.slice(pos).match(/^\s*and\s+/i);
		if (andMatch) pos += andMatch[0].length;

		if (pos >= len) break;

		// Consumed span starts at first ref character (after any per-block leading space)
		if (allSegments.length === 0) consumedStart = pos;

		const {
			blockEnd,
			stopReason: reason,
			afterSemicolon,
		} = scanBlockEnd(window, pos, otherBookAliases);

		const blockText = window.slice(pos, blockEnd);
		const trimmed = blockText.trim();

		if (trimmed.length > 0) {
			if (!looksLikeRef(trimmed)) {
				stopReason = "prose";
				break;
			}
			const segments = parseBlock(trimmed);
			if (segments.length === 0) {
				stopReason = "invalid_syntax";
				break;
			}
			const withOffsets = segmentsWithOffsetsInWindow(segments, pos, blockText);
			allSegments.push(...withOffsets);
		}

		// Consumed span ends at last ref character (exclude trailing space after block)
		const leadingSpacesInBlock =
			blockText.length - blockText.trimStart().length;
		consumedEnd =
			trimmed.length > 0
				? pos + leadingSpacesInBlock + trimmed.length
				: blockEnd;

		if (
			reason === "new_book" ||
			reason === "prose" ||
			reason === "closing_paren" ||
			reason === "invalid_syntax"
		) {
			stopReason = reason;
			break;
		}

		if (afterSemicolon) {
			pos = blockEnd + 1; // past the semicolon
			consumedEnd = pos;
			continue;
		}

		break;
	}

	const consumedText = window.slice(consumedStart, consumedEnd);

	let status: "match" | "book_only" | "no_match" | "ambiguous" = "no_match";
	if (allSegments.length === 0) {
		if (
			consumedStart >= len ||
			window.slice(consumedStart).trim().length === 0
		) {
			status = "book_only";
		} else {
			status = "no_match";
		}
	} else if (
		allSegments.length === 1 &&
		(allSegments[0].refText ?? "") === ""
	) {
		status = "book_only";
	} else {
		status = "match";
	}

	const hasExplicitRefSyntax =
		allSegments.some(
			(s) =>
				(s.refText?.length ?? 0) > 0 &&
				(s.chapter !== undefined || /\d/.test(s.refText ?? "")),
		) ?? false;

	return {
		status,
		consumedText,
		consumedStart,
		consumedEnd,
		segments: allSegments,
		stopReason,
		hasExplicitRefSyntax,
	};
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

	const result = parseAfterAliasImpl({
		normalizedWindow: ref,
		otherBookAliases: undefined,
	});
	return result.segments.map((s) => ({
		refText: s.refText,
		chapter: s.chapter,
		chapterEnd: s.chapterEnd,
		verseStart: s.verseStart,
		verseEnd: s.verseEnd,
		verseSuffix: s.verseSuffix,
	}));
}

function contextPrecheck(localWindow: string): boolean {
	return localWindow.trim().length > 0;
}

/** parseAfterAlias: consume citation tail after alias; returns rich result. */
function parseAfterAlias(args: {
	normalizedWindow: string;
	otherBookAliases?: string[];
}): CitationParseResult {
	return parseAfterAliasImpl(args);
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
