import type { StorybookCanvas } from "@pubint/yaboujee/_stories";

export const formFooterSelectors = {
	linkByText: (canvas: StorybookCanvas, text: string) => canvas.getByText(text),
};
