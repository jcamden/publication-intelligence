import type { StorybookCanvas } from "@pubint/yaboujee/_stories";
import { within } from "@storybook/test";

export type PdfAnnotationPopoverStorySelectors = {
	result: (canvas: StorybookCanvas) => HTMLElement;
	anchor: (canvas: StorybookCanvas) => HTMLElement;
	documentBody: () => StorybookCanvas;
	popoverText: (text: string) => HTMLElement;
	popoverContent: () => HTMLElement;
	cancelButton: () => HTMLElement;
};

export const pdfAnnotationPopoverSelectors: PdfAnnotationPopoverStorySelectors =
	{
		result: (canvas: StorybookCanvas) => canvas.getByTestId("result"),

		anchor: (canvas: StorybookCanvas) => canvas.getByTestId("anchor"),

		documentBody: () => within(document.body),

		popoverText: (text: string) =>
			pdfAnnotationPopoverSelectors.documentBody().getByText(text),

		popoverContent: () =>
			pdfAnnotationPopoverSelectors
				.documentBody()
				.getByTestId("popover-content"),

		cancelButton: () =>
			pdfAnnotationPopoverSelectors
				.documentBody()
				.getByRole("button", { name: "Cancel" }),
	};
