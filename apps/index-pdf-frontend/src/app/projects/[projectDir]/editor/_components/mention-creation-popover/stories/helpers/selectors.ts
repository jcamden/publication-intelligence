import type { StorybookCanvas } from "@pubint/yaboujee/_stories";

export const mentionCreationSelectors = {
	attachButton: (canvas: StorybookCanvas) =>
		canvas.getByRole("button", { name: "Attach" }),
	cancelButton: (canvas: StorybookCanvas) =>
		canvas.getByRole("button", { name: "Cancel" }),
	combobox: (canvas: StorybookCanvas) => canvas.getByRole("combobox"),
	createNewEntryButton: (body: StorybookCanvas, pattern: RegExp) =>
		body.getByRole("button", { name: pattern }),
	entryCreationModal: (body: StorybookCanvas) =>
		body.getByRole("dialog", { hidden: true }),
	entryPlaceholder: (canvas: StorybookCanvas) =>
		canvas.getByPlaceholderText("Select entry..."),
	labelInput: (body: StorybookCanvas) => body.getByLabelText("Label"),
	modalCreateButton: (body: StorybookCanvas) =>
		body.getByRole("button", { name: /^Create$/i }),
	modalTitle: (body: StorybookCanvas) => body.getByText("Create Index Entry"),
	regionNameInput: (canvas: StorybookCanvas) =>
		canvas.getByLabelText("Region name"),
	result: (canvas: StorybookCanvas) => canvas.getByTestId("result"),
	searchOrCreateInput: (canvas: StorybookCanvas) =>
		canvas.getByPlaceholderText("Search or create..."),
};
