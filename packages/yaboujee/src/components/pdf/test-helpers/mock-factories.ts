import type { PdfHighlight } from "../../../types";

/**
 * Shared mock factories for PDF component testing
 */

/**
 * Creates a minimal but valid mock PDF file for testing
 * Includes a single blank page that pdfjs can render
 * @param name - Filename for the PDF (default: "sample.pdf")
 * @returns File object with valid PDF content
 */
export const createMockPdfFile = (name = "sample.pdf") => {
	const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/ProcSet [/PDF]
>>
>>
endobj
4 0 obj
<<
/Length 0
>>
stream
endstream
endobj
xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000262 00000 n
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
311
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
