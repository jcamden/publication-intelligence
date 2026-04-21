import type { StorybookCanvas } from "@pubint/yaboujee/_stories";
import { within } from "@storybook/test";

export const editorInteractionSelectors = {
	documentBody: () => within(document.body),
	highlight: (canvas: StorybookCanvas, testId: string) =>
		canvas.getByTestId(testId),
	highlightLayer: (canvas: StorybookCanvas) =>
		canvas.queryByTestId("pdf-highlight-layer"),
	pdfAnnotationPopover: () =>
		document.querySelector("[data-pdf-annotation-popover]"),
};
