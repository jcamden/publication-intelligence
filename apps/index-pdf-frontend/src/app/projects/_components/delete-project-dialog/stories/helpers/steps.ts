import type { StoryContext, StoryUser } from "@pubint/yaboujee/_stories";
import { waitMs } from "@pubint/yaboujee/_stories";
import { expect, waitFor } from "@storybook/test";
import { deleteProjectDialogSelectors } from "./selectors";

export const alertDialogIsInDocument = async ({
	step,
}: {
	step: StoryContext["step"];
}) => {
	await step("Alert dialog is in the document", async () => {
		await waitFor(async () => {
			await expect(
				deleteProjectDialogSelectors.alertDialog(),
			).toBeInTheDocument();
		});
	});
};

export const waitForProjectLoadDelay = async ({
	step,
}: {
	step: StoryContext["step"];
}) => {
	await waitMs({ ms: 500, step });
};

export const typeWrongConfirmationAndDeleteDisabled = async ({
	user,
	step,
}: {
	user: StoryUser;
	step: StoryContext["step"];
}) => {
	await step("Type wrong confirmation text", async () => {
		const confirmInput = deleteProjectDialogSelectors.confirmInput();
		await user.type(confirmInput, "wrong name");
		const deleteButton = deleteProjectDialogSelectors.deleteButton();
		await expect(deleteButton).toBeDisabled();
	});
};

export const clearAndTypeCorrectProjectName = async ({
	user,
	projectTitle,
	step,
}: {
	user: StoryUser;
	projectTitle: string;
	step: StoryContext["step"];
}) => {
	await step("Clear confirmation field and type project title", async () => {
		const confirmInput = deleteProjectDialogSelectors.confirmInput();
		await user.clear(confirmInput);
		await user.type(confirmInput, projectTitle);
	});

	await waitMs({ ms: 200, step });
};

export const deleteButtonIsEnabled = async ({
	step,
}: {
	step: StoryContext["step"];
}) => {
	await step("Delete button is enabled", async () => {
		const deleteButton = deleteProjectDialogSelectors.deleteButton();
		await expect(deleteButton).toBeEnabled();
	});
};
