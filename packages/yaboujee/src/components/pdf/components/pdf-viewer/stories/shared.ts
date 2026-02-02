import { expect, waitFor } from "@storybook/test";
import type { PdfHighlight } from "../../../../../types";
import type { PdfViewerProps } from "../pdf-viewer";

export const defaultArgs: Pick<PdfViewerProps, "url" | "scale"> = {
	url: "/sample.pdf",
	scale: 1.25,
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
		bbox: { x: 20, y: 772, width: 100, height: 15 },
	},
	{
		id: "top-right",
		pageNumber: 1,
		label: "Top-Right Corner",
		text: "Should be in top-right corner",
		bbox: { x: 492, y: 772, width: 100, height: 15 },
	},
	{
		id: "center",
		pageNumber: 1,
		label: "Center",
		text: "Should be in the center of the page",
		bbox: { x: 256, y: 388, width: 100, height: 15 },
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
