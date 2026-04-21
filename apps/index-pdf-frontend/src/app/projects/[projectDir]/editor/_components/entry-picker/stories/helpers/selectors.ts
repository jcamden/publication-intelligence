import type { StorybookCanvas } from "@pubint/yaboujee/_stories";

export const entryPickerSelectors = {
	combobox: (canvas: StorybookCanvas) => canvas.getByRole("combobox"),
	result: (canvas: StorybookCanvas) => canvas.getByTestId("result"),
	createNewEntryButton: (body: StorybookCanvas, name: RegExp) =>
		body.getByRole("button", { name }),
	emptyStateMessage: (body: StorybookCanvas) =>
		body.getByText(/No entries found/i),
};
