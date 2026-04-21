import type { StorybookCanvas } from "@pubint/yaboujee/_stories";

export const pdfFileUploadSelectors = {
	callbackStatus: (canvas: StorybookCanvas) =>
		canvas.getByTestId("callback-status"),

	uploadContainer: (canvas: StorybookCanvas) =>
		canvas.getByTestId("upload-container"),

	allButtons: (canvas: StorybookCanvas) => canvas.getAllByRole("button"),

	clearButton: (canvas: StorybookCanvas) => {
		const buttons = pdfFileUploadSelectors.allButtons(canvas);
		return buttons[buttons.length - 1];
	},

	errorText: (canvas: StorybookCanvas, text: string) => canvas.getByText(text),
};
