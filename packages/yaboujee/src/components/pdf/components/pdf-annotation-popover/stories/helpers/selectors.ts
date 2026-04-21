import type { StorybookCanvas } from "@pubint/yaboujee/_stories";
import { within } from "@storybook/test";

export type PdfAnnotationPopoverStorySelectors = {
	anchor: (canvas: StorybookCanvas) => HTMLElement;
	cancelButton: () => HTMLElement;
	documentBody: () => StorybookCanvas;
	popoverContent: () => HTMLElement;
	popoverText: (text: string) => HTMLElement;
	result: (canvas: StorybookCanvas) => HTMLElement;
};

export const pdfAnnotationPopoverSelectors: PdfAnnotationPopoverStorySelectors =
	{
		anchor: (canvas: StorybookCanvas) => canvas.getByTestId("anchor"),
		cancelButton: () =>
			pdfAnnotationPopoverSelectors
				.documentBody()
				.getByRole("button", { name: "Cancel" }),
		documentBody: () => within(document.body),
		popoverContent: () =>
			pdfAnnotationPopoverSelectors
				.documentBody()
				.getByTestId("popover-content"),
		popoverText: (text: string) =>
			pdfAnnotationPopoverSelectors.documentBody().getByText(text),
		result: (canvas: StorybookCanvas) => canvas.getByTestId("result"),
	};
