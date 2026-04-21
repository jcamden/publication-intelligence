import type { StorybookCanvas } from "@pubint/yaboujee/_stories";

export const deleteMentionDialogSelectors = {
	alertDialog: (body: StorybookCanvas) => body.getByRole("alertdialog"),
	deleteButton: (body: StorybookCanvas) =>
		body.getByRole("button", { name: /delete/i }),
	cancelButton: (body: StorybookCanvas) =>
		body.getByRole("button", { name: /cancel/i }),
	title: (body: StorybookCanvas) => body.getByText(/delete highlight/i),
	description: (body: StorybookCanvas) =>
		body.getByText(/this will remove the highlight/i),
};
