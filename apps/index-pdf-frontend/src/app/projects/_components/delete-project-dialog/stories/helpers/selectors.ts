import { within } from "@storybook/test";

export const deleteProjectDialogSelectors = {
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
	documentBody: () => within(document.body),
};
