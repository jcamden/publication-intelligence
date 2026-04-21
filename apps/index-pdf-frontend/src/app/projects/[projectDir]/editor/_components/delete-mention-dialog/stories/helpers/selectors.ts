import type { StorybookCanvas } from "@pubint/yaboujee/_stories";

export const deleteMentionDialogSelectors = {
	alertDialog: (body: StorybookCanvas) => body.getByRole("alertdialog"),
	cancelButton: (body: StorybookCanvas) =>
		body.getByRole("button", { name: /cancel/i }),
	deleteButton: (body: StorybookCanvas) =>
		body.getByRole("button", { name: /delete/i }),
	description: (body: StorybookCanvas) =>
		body.getByText(/this will remove the highlight/i),
	title: (body: StorybookCanvas) => body.getByText(/delete highlight/i),
};
