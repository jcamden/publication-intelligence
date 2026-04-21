import type { StorybookCanvas } from "@pubint/yaboujee/_stories";
import { within } from "@storybook/test";

export const editorInteractionSelectors = {
	highlightLayer: (canvas: StorybookCanvas) =>
		canvas.queryByTestId("pdf-highlight-layer"),

	highlight: (canvas: StorybookCanvas, testId: string) =>
		canvas.getByTestId(testId),

	documentBody: () => within(document.body),

	pdfAnnotationPopover: () =>
		document.querySelector("[data-pdf-annotation-popover]"),
};
