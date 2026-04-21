import type { StorybookCanvas } from "@pubint/yaboujee/_stories";

export const pdfThumbnailSelectors = {
	containerByTestId: (canvas: StorybookCanvas, testId: string) =>
		canvas.getByTestId(testId),
};
