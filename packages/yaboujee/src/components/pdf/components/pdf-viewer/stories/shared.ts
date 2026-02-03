import { expect, waitFor } from "@storybook/test";
import type { PdfHighlight } from "../../../../../types";
import type { PdfViewerProps } from "../pdf-viewer";

export const defaultArgs: Pick<PdfViewerProps, "url" | "scale"> = {
	url: "/sample.pdf",
	scale: 0.5,
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

/**
 * Wait for PDF canvas to render
 * Common assertion used across multiple tests
 */
export const waitForPdfCanvas = async ({
	canvasElement,
	timeout = 10000,
}: {
	canvasElement: HTMLElement;
	timeout?: number;
}) => {
	await waitFor(
		async () => {
			const pdfCanvas = canvasElement.querySelector("canvas");
			await expect(pdfCanvas).toBeTruthy();
		},
		{ timeout },
	);
};

/**
 * Wait for text layer to render with spans
 * Common assertion for text layer tests
 */
export const waitForTextLayer = async ({
	canvasElement,
	timeout = 10000,
}: {
	canvasElement: HTMLElement;
	timeout?: number;
}) => {
	await waitFor(
		async () => {
			const textLayer = canvasElement.querySelector(".textLayer");
			if (!textLayer) throw new Error("Text layer not found");
			const textSpans = textLayer.querySelectorAll("span");
			if (textSpans.length === 0) throw new Error("Text layer has no spans");
		},
		{ timeout },
	);
};

/**
 * Select all text in the text layer
 * Used in VRT tests to show selected text visually
 */
export const selectAllTextInLayer = ({
	canvasElement,
}: {
	canvasElement: HTMLElement;
}) => {
	const textLayer = canvasElement.querySelector(".textLayer");
	if (textLayer) {
		const range = document.createRange();
		range.selectNodeContents(textLayer);
		const selection = window.getSelection();
		selection?.removeAllRanges();
		selection?.addRange(range);
	}
};

/**
 * Create a text selection on the first span in the text layer
 * Used in interaction tests to create draft highlights
 *
 * @returns Promise that resolves when selection is created
 */
export const selectFirstTextSpan = async ({
	canvasElement,
}: {
	canvasElement: HTMLElement;
}): Promise<void> => {
	await waitForTextLayer({ canvasElement });

	// Wait for text layer to be fully rendered
	await new Promise((resolve) => setTimeout(resolve, 500));

	const textLayer = canvasElement.querySelector(".textLayer");
	if (!textLayer) {
		throw new Error("Text layer not found");
	}

	const firstSpan = textLayer.querySelector("span");
	if (!firstSpan) {
		throw new Error("No text spans found");
	}

	const range = document.createRange();
	range.selectNodeContents(firstSpan);
	const selection = window.getSelection();
	selection?.removeAllRanges();
	selection?.addRange(range);

	// Wait for selection to be applied
	await new Promise((resolve) => setTimeout(resolve, 100));
};

/**
 * Create a text selection across multiple spans (simulating multi-line selection)
 * Used to test multi-bbox highlight creation
 *
 * @param spanCount - Number of spans to select across (must be >= 2)
 * @returns Promise that resolves when selection is created
 */
export const selectAcrossMultipleSpans = async ({
	canvasElement,
	spanCount = 2,
}: {
	canvasElement: HTMLElement;
	spanCount?: number;
}): Promise<void> => {
	if (spanCount < 2) {
		throw new Error("spanCount must be at least 2 for multi-line selection");
	}

	await waitForTextLayer({ canvasElement });

	// Wait for text layer to be fully rendered
	await new Promise((resolve) => setTimeout(resolve, 500));

	const textLayer = canvasElement.querySelector(".textLayer");
	if (!textLayer) {
		throw new Error("Text layer not found");
	}

	const textSpans = textLayer.querySelectorAll("span");
	if (textSpans.length < spanCount) {
		throw new Error(
			`Not enough text spans: need ${spanCount}, found ${textSpans.length}`,
		);
	}

	// Select from start of first span to end of last span
	const range = document.createRange();
	range.setStart(textSpans[0].firstChild || textSpans[0], 0);
	range.setEnd(
		textSpans[spanCount - 1].firstChild || textSpans[spanCount - 1],
		textSpans[spanCount - 1].textContent?.length || 1,
	);

	const selection = window.getSelection();
	selection?.removeAllRanges();
	selection?.addRange(range);

	// Wait for selection to be applied
	await new Promise((resolve) => setTimeout(resolve, 100));
};
