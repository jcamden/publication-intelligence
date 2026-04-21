import type { StorybookCanvas, StoryStep } from "@pubint/yaboujee/_stories";
import { waitMs } from "@pubint/yaboujee/_stories";
import { expect, userEvent, waitFor, within } from "@storybook/test";
import { deleteMentionDialogSelectors } from "./selectors";

const storyBody = (): StorybookCanvas => within(document.body);

export const waitForDeleteMentionDialog = async ({
	step,
}: {
	step: StoryStep;
}) => {
	const body = storyBody();
	await step("Wait for dialog to appear", async () => {
		await waitFor(
			async () => {
				const dialog = deleteMentionDialogSelectors.alertDialog(body);
				await expect(dialog).toBeInTheDocument();
			},
			{ timeout: 1000 },
		);
	});
};

export const clickDeleteInDialog = async ({ step }: { step: StoryStep }) => {
	const body = storyBody();
	await step("Click Delete button", async () => {
		await userEvent.click(deleteMentionDialogSelectors.deleteButton(body));
	});
};

export const clickCancelInDialog = async ({ step }: { step: StoryStep }) => {
	const body = storyBody();
	await step("Click Cancel button", async () => {
		await userEvent.click(deleteMentionDialogSelectors.cancelButton(body));
	});
};

export const expectDeleteMentionDialogContent = async ({
	step,
}: {
	step: StoryStep;
}) => {
	const body = storyBody();
	await waitForDeleteMentionDialog({ step });

	await step("Verify title is displayed", async () => {
		await expect(deleteMentionDialogSelectors.title(body)).toBeInTheDocument();
	});

	await step("Verify description is displayed", async () => {
		await expect(
			deleteMentionDialogSelectors.description(body),
		).toBeInTheDocument();
	});

	await step("Verify both buttons are present", async () => {
		await expect(
			deleteMentionDialogSelectors.cancelButton(body),
		).toBeInTheDocument();
		await expect(
			deleteMentionDialogSelectors.deleteButton(body),
		).toBeInTheDocument();
	});
};

/** VRT: brief pause so dialog paint is stable before capture. */
export const vrtPauseBeforeDialogSnapshot = async ({
	step,
}: {
	step: StoryStep;
}) => {
	await waitMs({ ms: 100, step });
};
