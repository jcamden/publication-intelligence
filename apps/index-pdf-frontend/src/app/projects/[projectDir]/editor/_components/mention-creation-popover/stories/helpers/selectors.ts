import type { StorybookCanvas } from "@pubint/yaboujee/_stories";

export const mentionCreationSelectors = {
	combobox: (canvas: StorybookCanvas) => canvas.getByRole("combobox"),
	entryPlaceholder: (canvas: StorybookCanvas) =>
		canvas.getByPlaceholderText("Select entry..."),
	searchOrCreateInput: (canvas: StorybookCanvas) =>
		canvas.getByPlaceholderText("Search or create..."),
	attachButton: (canvas: StorybookCanvas) =>
		canvas.getByRole("button", { name: "Attach" }),
	cancelButton: (canvas: StorybookCanvas) =>
		canvas.getByRole("button", { name: "Cancel" }),
	result: (canvas: StorybookCanvas) => canvas.getByTestId("result"),
	regionNameInput: (canvas: StorybookCanvas) =>
		canvas.getByLabelText("Region name"),
	createNewEntryButton: (body: StorybookCanvas, pattern: RegExp) =>
		body.getByRole("button", { name: pattern }),
	entryCreationModal: (body: StorybookCanvas) =>
		body.getByRole("dialog", { hidden: true }),
	modalTitle: (body: StorybookCanvas) => body.getByText("Create Index Entry"),
	labelInput: (body: StorybookCanvas) => body.getByLabelText("Label"),
	modalCreateButton: (body: StorybookCanvas) =>
		body.getByRole("button", { name: /^Create$/i }),
};
