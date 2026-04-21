import type { StorybookCanvas } from "@pubint/yaboujee/_stories";

export const entryCreationModalSelectors = {
	dialog: (body: StorybookCanvas) => body.getByRole("dialog", { hidden: true }),
	labelInput: (body: StorybookCanvas) => body.getByLabelText("Label"),
	parentEntryInput: (body: StorybookCanvas) =>
		body.getByLabelText(/Parent Entry/),
	parentEntryCombobox: (body: StorybookCanvas) =>
		body.getByRole("combobox", { name: /parent entry/i }),
	/** Top-level "Philosophy" row (exact label), not nested "Philosophy → …". */
	philosophyTopLevelOption: (body: StorybookCanvas) =>
		body.getByRole("option", { name: "Philosophy" }),
	createButton: (body: StorybookCanvas) =>
		body.getByRole("button", { name: "Create" }),
	cancelButton: (body: StorybookCanvas) =>
		body.getByRole("button", { name: "Cancel" }),
	validationAlert: (body: StorybookCanvas) => body.getByRole("alert"),
};
