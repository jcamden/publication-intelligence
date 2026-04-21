import type { BBox } from "@pubint/core";

/**
 * Wire-format types for JSON returned by the PyMuPDF Python extractor (JS ↔ Python contract).
 */

export type PyMuPDFWord = {
	text: string;
	bbox: BBox;
	block_no: number;
	line_no: number;
	word_no: number;
};

export type PyMuPDFPage = {
	page_number: number;
	text: string;
	words: PyMuPDFWord[];
	dimensions: {
		width: number;
		height: number;
	};
};

export type PyMuPDFResult = {
	pages: PyMuPDFPage[];
};
