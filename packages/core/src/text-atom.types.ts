/**
 * TextAtom - In-memory representation of word-level text from PDF
 *
 * TextAtoms are ephemeral - created during extraction, used for LLM processing,
 * and discarded after use. They enable deterministic re-extraction for Stage B
 * mention detection without storing 45k+ rows per 200-page book.
 *
 * Re-extraction is fast (~50-100ms per page) and deterministic when based on
 * the same indexableText.
 */

export type BBox = {
	x0: number;
	y0: number;
	x1: number;
	y1: number;
};

export type TextAtom = {
	/** Temporary ID for LLM response mapping (e.g., "atom_1234") */
	id: string;

	/** The word text */
	word: string;

	/** PyMuPDF coordinates {x0, y0, x1, y1} - origin at bottom-left */
	bbox: BBox;

	/** Character offset in indexableText (start) */
	charStart: number;

	/** Character offset in indexableText (end, exclusive) */
	charEnd: number;

	/** Which page this atom is on */
	pageNumber: number;

	/** Reading order within page */
	sequence: number;

	/** False if within exclude region */
	isIndexable: boolean;

	/** OCR confidence (0-1), if applicable */
	confidence?: number;

	/** Font metadata from PDF */
	fontName?: string;

	/** Font size in points */
	fontSize?: number;
};

export type PageDimensions = {
	width: number;
	height: number;
};

export type ExtractionStatus =
	| "not_started"
	| "in_progress"
	| "completed"
	| "failed";
