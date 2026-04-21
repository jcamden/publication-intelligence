import type { StorybookCanvas } from "@pubint/yaboujee/_stories";

export const entryCreationModalSelectors = {
	cancelButton: (body: StorybookCanvas) =>
		body.getByRole("button", { name: "Cancel" }),
	createButton: (body: StorybookCanvas) =>
		body.getByRole("button", { name: "Create" }),
	dialog: (body: StorybookCanvas) => body.getByRole("dialog", { hidden: true }),
	labelInput: (body: StorybookCanvas) => body.getByLabelText("Label"),
	parentEntryCombobox: (body: StorybookCanvas) =>
		body.getByRole("combobox", { name: /parent entry/i }),
	parentEntryInput: (body: StorybookCanvas) =>
		body.getByLabelText(/Parent Entry/),
	/** Top-level "Philosophy" row (exact label), not nested "Philosophy → …". */
	philosophyTopLevelOption: (body: StorybookCanvas) =>
		body.getByRole("option", { name: "Philosophy" }),
	validationAlert: (body: StorybookCanvas) => body.getByRole("alert"),
};
