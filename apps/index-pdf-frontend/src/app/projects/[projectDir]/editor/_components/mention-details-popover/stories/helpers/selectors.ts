import type { StorybookCanvas } from "@pubint/yaboujee/_stories";

export const mentionDetailsSelectors = {
	cancelButton: (canvas: StorybookCanvas) =>
		canvas.getByRole("button", { name: /cancel/i }),
	closeButton: (canvas: StorybookCanvas) =>
		canvas.getByRole("button", { name: /close/i }),
	deleteButton: (canvas: StorybookCanvas) =>
		canvas.getByRole("button", { name: /delete/i }),
	editButton: (canvas: StorybookCanvas) =>
		canvas.getByRole("button", { name: /^edit$/i }),
	entryCombobox: (canvas: StorybookCanvas) =>
		canvas.getByTestId("entry-combobox"),
	regionTextInput: (canvas: StorybookCanvas) =>
		canvas.getByTestId("region-text-input"),
	saveButton: (canvas: StorybookCanvas) =>
		canvas.getByRole("button", { name: /save/i }),
	sublocationInput: (canvas: StorybookCanvas) =>
		canvas.getByTestId("sublocation-input"),
};
