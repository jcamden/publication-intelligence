import type { StorybookCanvas } from "@pubint/yaboujee/_stories";

export const pdfHighlightLayerSelectors = {
	highlightButtons: (canvas: StorybookCanvas) => canvas.getAllByRole("button"),
};
