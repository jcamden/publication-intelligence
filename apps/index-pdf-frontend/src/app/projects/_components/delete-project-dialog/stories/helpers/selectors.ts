import { within } from "@storybook/test";

export const deleteProjectDialogSelectors = {
	documentBody: () => within(document.body),

	alertDialog: () =>
		deleteProjectDialogSelectors
			.documentBody()
			.getByRole("alertdialog", { hidden: true }),

	confirmInput: () =>
		deleteProjectDialogSelectors
			.documentBody()
			.getByPlaceholderText(/type project name to confirm/i),

	deleteButton: () =>
		deleteProjectDialogSelectors
			.documentBody()
			.getByRole("button", { name: /^delete$/i }),
};
