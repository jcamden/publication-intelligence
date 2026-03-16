/**
 * Parser profile contract for local citation parsing (Phase 3 matcher detection).
 * Profiles are used per IndexEntryGroup; the caller extracts a local window
 * around an alias match and runs contextPrecheck then parse.
 */

/**
 * One segment = one child ref for Phase 6 (one mention per segment).
 * refText is the citation fragment for matcher label; chapter/verse optional for book-only.
 */
export type ParsedRefSegment = {
	/** Citation fragment (e.g. "1:1-3", "2", "" for book-only) for matcher label */
	refText: string;
	/** Omitted for book-only refs (e.g. "Romans" with no chapter/verse). */
	chapter?: number;
	/** Present for chapter ranges (e.g. "gen 1-3" = chapters 1–3). Verse mode uses : or . */
	chapterEnd?: number;
	verseStart?: number;
	verseEnd?: number;
	/** Optional verse suffix (e.g. "a" for 3a, "b" for 3b). */
	verseSuffix?: string;
};

/** Why the parser stopped consuming the citation tail. */
export type CitationStopReason =
	| "end_of_input"
	| "new_book"
	| "prose"
	| "invalid_syntax"
	| "closing_paren"
	| "unsupported_pattern";

/** Parse outcome for downstream handling. */
export type CitationParseStatus =
	| "match"
	| "book_only"
	| "no_match"
	| "ambiguous";

/**
 * One parsed segment with source offsets (relative to consumed text or window).
 */
export type CitationSegment = {
	refText: string;
	chapter?: number;
	chapterEnd?: number;
	verseStart?: number;
	verseEnd?: number;
	verseSuffix?: string;
	/** Start offset of this segment's refText in the source. */
	sourceStart: number;
	/** End offset of this segment's refText in the source. */
	sourceEnd: number;
};

/**
 * Rich result from consuming the citation tail after an alias (or from bookless scan).
 */
export type CitationParseResult = {
	status: CitationParseStatus;
	consumedText: string;
	consumedStart: number;
	consumedEnd: number;
	segments: CitationSegment[];
	stopReason: CitationStopReason;
	hasExplicitRefSyntax: boolean;
};

/** Arguments for parseAfterAlias (normalized window after the book alias). */
export type ParseAfterAliasArgs = {
	normalizedWindow: string;
	otherBookAliases?: string[];
};

/** Arguments for optional bookless citation scan. */
export type ScanBooklessArgs = {
	normalizedText: string;
	occupiedRanges: Array<{ start: number; end: number }>;
};

/**
 * Profile interface for local parsing: context precheck, parse, and segment emission.
 * Extended with parseAfterAlias for richer results; optional scanBookless for bookless scan.
 */
export type ParserProfile = {
	id: string;
	/** Return false to skip parsing (e.g. empty/whitespace window). Must not require digits for scripture. */
	contextPrecheck: (localWindow: string) => boolean;
	/** Parse the window and return segments (one per child ref); support book-only as one segment. */
	parse: (localWindow: string) => ParsedRefSegment[];
	/** Consume citation tail after alias; returns rich result with status, consumed span, segment offsets, stop reason. */
	parseAfterAlias: (args: ParseAfterAliasArgs) => CitationParseResult;
	/** Optional: scan for bookless citations (e.g. for Unknown path). */
	scanBookless?: (args: ScanBooklessArgs) => CitationParseResult[];
};
