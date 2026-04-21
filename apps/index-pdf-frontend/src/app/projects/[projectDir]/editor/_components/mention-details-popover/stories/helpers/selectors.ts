import type { StorybookCanvas } from "@pubint/yaboujee/_stories";

export const mentionDetailsSelectors = {
	editButton: (canvas: StorybookCanvas) =>
		canvas.getByRole("button", { name: /^edit$/i }),
	closeButton: (canvas: StorybookCanvas) =>
		canvas.getByRole("button", { name: /close/i }),
	cancelButton: (canvas: StorybookCanvas) =>
		canvas.getByRole("button", { name: /cancel/i }),
	saveButton: (canvas: StorybookCanvas) =>
		canvas.getByRole("button", { name: /save/i }),
	deleteButton: (canvas: StorybookCanvas) =>
		canvas.getByRole("button", { name: /delete/i }),
	entryCombobox: (canvas: StorybookCanvas) =>
		canvas.getByTestId("entry-combobox"),
	sublocationInput: (canvas: StorybookCanvas) =>
		canvas.getByTestId("sublocation-input"),
	regionTextInput: (canvas: StorybookCanvas) =>
		canvas.getByTestId("region-text-input"),
};
