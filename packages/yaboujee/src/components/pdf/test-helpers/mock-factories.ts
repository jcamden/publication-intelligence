import type { PdfHighlight } from "../../../types";

/**
 * Shared mock factories for PDF component testing
 */

/**
 * Creates a minimal mock PDF file for testing
 * @param name - Filename for the PDF (default: "sample.pdf")
 * @returns File object with minimal PDF content
 */
export const createMockPdfFile = (name = "sample.pdf") => {
	const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
%%EOF`;

	return new File([pdfContent], name, { type: "application/pdf" });
};

/**
 * Mock highlights for testing
 * Coordinates are in PDF user space (bottom-left origin, Y increases upward)
 * Assuming standard letter size: 612pt wide x 792pt tall
 */
export const mockHighlights: PdfHighlight[] = [
	{
		id: "top-left",
		pageNumber: 1,
		label: "Top-Left Corner",
		text: "Should be in top-left corner",
		bboxes: [{ x: 20, y: 772, width: 100, height: 15 }],
	},
	{
		id: "top-right",
		pageNumber: 1,
		label: "Top-Right Corner",
		text: "Should be in top-right corner",
		bboxes: [{ x: 492, y: 772, width: 100, height: 15 }],
	},
	{
		id: "center",
		pageNumber: 1,
		label: "Center",
		text: "Should be in the center of the page",
		bboxes: [{ x: 256, y: 388, width: 100, height: 15 }],
	},
];
