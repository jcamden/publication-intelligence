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
	verseStart?: number;
	verseEnd?: number;
};

/**
 * Profile interface for local parsing: context precheck, parse, and segment emission.
 */
export type ParserProfile = {
	id: string;
	/** Return false to skip parsing (e.g. empty/whitespace window). Must not require digits for scripture. */
	contextPrecheck: (localWindow: string) => boolean;
	/** Parse the window and return segments (one per child ref); support book-only as one segment. */
	parse: (localWindow: string) => ParsedRefSegment[];
};
