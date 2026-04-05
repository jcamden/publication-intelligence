/**
 * Scripture detection on a single page: alias-attached refs (matcher pass) and
 * bookless refs → Unknown (bookless pass). Extracted for isolation and testing.
 */
import type { ParserProfile } from "@pubint/core";
import { normalize, normalizeWithOffsetMap } from "@pubint/core";
import type { ResolvedAliasMatch } from "./alias-engine.types";
import type {
	MatcherMentionParserSegment,
	ScriptureDetectionPageResult,
} from "./detection.types";

// ============================================================================
// Constants
// ============================================================================

const PRECHECK_WINDOW_CHARS = 24;
const PARSER_WINDOW_CHARS = 250;
const PARSER_WINDOW_CAP = 300;

// ============================================================================
// Helpers
// ============================================================================

/** Citation-like: digits, spaces, separators. Verse suffix a-z allowed only when immediately after a digit (Task 4.3). */
function isCitationLikeTailChar(pageText: string, index: number): boolean {
	const c = pageText[index];
	if (/[\d\s:.,;\-()]/.test(c)) return true;
	// Optional verse suffix letter (e.g. 3a) only when preceded by a digit
	if (/[a-z]/i.test(c) && index > 0 && /\d/.test(pageText[index - 1]))
		return true;
	return false;
}

// ============================================================================
// Alias-window ref discovery
// ============================================================================

/**
 * Find ref spans in the parse window after an alias. Only assigns refs when the book
 * is clearly declared—no context-based prediction. Truncates the window at the next
 * book alias so refs between books (e.g. "31:6,8" between "rom 10:8" and "Heb 13:5")
 * are not assigned; they go to Unknown via the standalone scan.
 * Exported for tests.
 */
export function findRefSpansInAliasWindow(
	pageText: string,
	aliasEndOffset: number,
	profile: ParserProfile | undefined,
	otherBookNormalizedAliases: string[],
): Array<{
	pageCharStart: number;
	pageCharEnd: number;
	segments: MatcherMentionParserSegment[];
}> {
	if (!profile || !profile.parseAfterAlias) return [];
	const windowStart = aliasEndOffset;
	const precheckSlice = pageText.slice(
		windowStart,
		windowStart + PRECHECK_WINDOW_CHARS,
	);
	if (!profile.contextPrecheck(precheckSlice)) return [];

	const parseSlice = pageText.slice(
		windowStart,
		Math.min(windowStart + PARSER_WINDOW_CHARS, pageText.length),
	);
	const sliceCap = parseSlice.slice(0, PARSER_WINDOW_CAP);
	const { normalizedText, mapNormalizedSpanToOriginalSpan } =
		normalizeWithOffsetMap(sliceCap);

	const result = profile.parseAfterAlias({
		normalizedWindow: normalizedText,
		otherBookAliases: otherBookNormalizedAliases,
	});

	// Use parser status to decide whether to emit alias-attached spans
	if (result.status !== "match" || result.segments.length === 0) {
		return [];
	}
	// Avoid emitting when the parser stopped on invalid_syntax (garbage after alias).
	// Allow end_of_input, new_book, closing_paren, and prose when we have segments.
	// Prose means the citation ended and normal words follow (e.g. "Deut 1:6-18 appointing judges");
	// the parsed ref still attaches to the book.
	if (
		result.stopReason !== "end_of_input" &&
		result.stopReason !== "new_book" &&
		result.stopReason !== "closing_paren" &&
		result.stopReason !== "prose"
	) {
		return [];
	}

	const out: Array<{
		pageCharStart: number;
		pageCharEnd: number;
		segments: MatcherMentionParserSegment[];
	}> = [];

	for (const seg of result.segments) {
		// Map segment source offsets in normalized window back to original page offsets
		const [origStart, origEnd] = mapNormalizedSpanToOriginalSpan(
			seg.sourceStart,
			seg.sourceEnd,
		);

		out.push({
			pageCharStart: windowStart + origStart,
			pageCharEnd: windowStart + origEnd,
			segments: [
				{
					refText: seg.refText,
					chapterStart: seg.chapterStart,
					chapterEnd: seg.chapterEnd,
					verseStart: seg.verseStart,
					verseEnd: seg.verseEnd,
					verseSuffix: seg.verseSuffix,
				},
			],
		});
	}

	return out;
}

/**
 * Compute fallback mention span: alias span + right-extension with citation-like chars only.
 * Stops at first non-citation-like char. Exported for tests.
 */
export function computeFallbackSpan(
	pageText: string,
	originalStart: number,
	originalEnd: number,
): { charStart: number; charEnd: number } {
	const windowEnd = Math.min(
		originalEnd + PARSER_WINDOW_CHARS,
		pageText.length,
	);
	const capEnd = Math.min(originalEnd + PARSER_WINDOW_CAP, pageText.length);
	const limit = Math.min(windowEnd, capEnd);
	let end = originalEnd;
	while (end < limit && isCitationLikeTailChar(pageText, end)) {
		end += 1;
	}
	return { charStart: originalStart, charEnd: end };
}

/**
 * Returns true when context precheck passes but parse returns zero segments (parse-fail-after-context-pass).
 * Used to decide whether to emit a fallback book-level mention (Task 4.3). Exported for tests.
 */
export function shouldEmitFallbackMention(
	pageText: string,
	aliasEndOffset: number,
	profile: ParserProfile | undefined,
): boolean {
	if (!profile) return false;
	const windowStart = aliasEndOffset;
	const precheckSlice = pageText.slice(
		windowStart,
		windowStart + PRECHECK_WINDOW_CHARS,
	);
	if (!profile.contextPrecheck(precheckSlice)) return false;
	const parseSlice = pageText.slice(
		windowStart,
		Math.min(windowStart + PARSER_WINDOW_CHARS, pageText.length),
	);
	const sliceCap = parseSlice.slice(0, PARSER_WINDOW_CAP);
	const segments = profile.parse(normalize(sliceCap));
	// Emit fallback when there are no ref segments, or only book-only segments (refText empty)
	const hasRealRef = segments.some((s) => (s.refText ?? "").trim().length > 0);
	return !hasRealRef;
}

// ============================================================================
// Bookless (Unknown) scan
// ============================================================================

/**
 * Page-wide bookless scan used to emit `Unknown` scripture candidates.
 * Uses the parser's bookless scan surface and maps parser-emitted offsets back to page offsets.
 * Exported for tests.
 */
export function findBooklessUnknownRefSpansOnPage(args: {
	pageText: string;
	profile: ParserProfile | undefined;
	coveredRanges: Array<{ start: number; end: number }>;
}): Array<{
	pageCharStart: number;
	pageCharEnd: number;
	segments: MatcherMentionParserSegment[];
}> {
	const { pageText, profile, coveredRanges } = args;
	if (!profile?.scanBookless) return [];

	const { normalizedText, mapNormalizedSpanToOriginalSpan } =
		normalizeWithOffsetMap(pageText);

	const results = profile.scanBookless({ normalizedText, occupiedRanges: [] });
	if (results.length === 0) return [];

	const spans: Array<{
		pageCharStart: number;
		pageCharEnd: number;
		segments: MatcherMentionParserSegment[];
	}> = [];

	for (const r of results) {
		if (r.status !== "match") continue;
		for (const seg of r.segments ?? []) {
			const refText = seg.refText ?? "";
			if (refText.trim().length === 0) continue; // book-only should not emit unknown ref spans

			const [origStart, origEnd] = mapNormalizedSpanToOriginalSpan(
				seg.sourceStart,
				seg.sourceEnd,
			);
			if (origEnd <= origStart) continue;

			const overlapsCovered = coveredRanges.some(
				(c) => origStart < c.end && c.start < origEnd,
			);
			if (overlapsCovered) continue;

			spans.push({
				pageCharStart: origStart,
				pageCharEnd: origEnd,
				segments: [
					{
						refText,
						chapterStart: seg.chapterStart,
						chapterEnd: seg.chapterEnd,
						verseStart: seg.verseStart,
						verseEnd: seg.verseEnd,
						verseSuffix: seg.verseSuffix,
					},
				],
			});
		}
	}

	return spans;
}

// ============================================================================
// Main entry: two-pass page result
// ============================================================================

/**
 * Runs both scripture detection passes on a page: alias-attached refs (matcher pass)
 * and bookless refs → Unknown (bookless pass). Exported for tests.
 *
 * @param pageText - Normalized or raw page text (will be normalized internally for parser).
 * @param matches - Alias matches for this page (e.g. from scanTextWithAliasIndex).
 * @param profile - Parser profile (scripture-biblical) or null for alias-only.
 * @returns aliasAttached spans (with match metadata) and unknownSpans (bookless).
 */
export function runScriptureDetectionOnPage(
	pageText: string,
	matches: ResolvedAliasMatch[],
	profile: ParserProfile | null,
): ScriptureDetectionPageResult {
	const aliasAttached: ScriptureDetectionPageResult["aliasAttached"] = [];

	for (const match of matches) {
		if (profile === null) {
			aliasAttached.push({
				pageCharStart: match.originalStart,
				pageCharEnd: match.originalEnd,
				segments: [],
				groupId: match.groupId,
				matcherId: match.matcherId,
				entryId: match.entryId,
				indexType: match.indexType,
			});
			continue;
		}

		const otherBookNormalizedAliases = [
			...new Set(
				matches
					.filter((m) => m.matcherId !== match.matcherId)
					.map((m) => normalize(m.matchedAlias))
					.filter((alias) => alias.trim().length > 0),
			),
		];
		const refSpans = findRefSpansInAliasWindow(
			pageText,
			match.originalEnd,
			profile,
			otherBookNormalizedAliases,
		);

		if (refSpans.length > 0) {
			refSpans.forEach((ref, i) => {
				// First segment only: span from alias start so highlight covers "Gen 1:1-3". Later segments (e.g. "4-5", "2:6-7") must not include the book in their bbox.
				const pageCharStart = i === 0 ? match.originalStart : ref.pageCharStart;
				aliasAttached.push({
					pageCharStart,
					pageCharEnd: ref.pageCharEnd,
					segments: ref.segments,
					groupId: match.groupId,
					matcherId: match.matcherId,
					entryId: match.entryId,
					indexType: match.indexType,
				});
			});
		} else if (
			shouldEmitFallbackMention(pageText, match.originalEnd, profile)
		) {
			const fallbackSpan = computeFallbackSpan(
				pageText,
				match.originalStart,
				match.originalEnd,
			);
			aliasAttached.push({
				pageCharStart: fallbackSpan.charStart,
				pageCharEnd: fallbackSpan.charEnd,
				segments: [],
				groupId: match.groupId,
				matcherId: match.matcherId,
				entryId: match.entryId,
				indexType: match.indexType,
				fallbackBookLevel: true,
			});
		}
	}

	const coveredRanges = aliasAttached.map((s) => ({
		start: s.pageCharStart,
		end: s.pageCharEnd,
	}));
	const unknownSpans = profile?.scanBookless
		? findBooklessUnknownRefSpansOnPage({
				pageText,
				profile,
				coveredRanges,
			})
		: [];

	return { aliasAttached, unknownSpans };
}
