import type { StorybookCanvas } from "@pubint/yaboujee/_stories";

export const pdfHighlightBoxSelectors = {
	highlightByTestId: (canvas: StorybookCanvas, testId: string) =>
		canvas.getByTestId(testId),
};
