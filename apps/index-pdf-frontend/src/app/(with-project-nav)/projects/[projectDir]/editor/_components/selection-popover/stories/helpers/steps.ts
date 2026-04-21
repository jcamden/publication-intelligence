import type { StorybookCanvas, StoryStep } from "@pubint/yaboujee/_stories";
import { expect, userEvent, waitFor, within } from "@storybook/test";
import { selectionPopoverSelectors } from "./selectors";

const storyBody = (): StorybookCanvas => within(document.body);

export const clickCreateMention = async ({ step }: { step: StoryStep }) => {
	const body = storyBody();
	await step("Click create mention button", async () => {
		const createButton = selectionPopoverSelectors.createMentionButton(body);
		await waitFor(
			async () => {
				await expect(createButton).toBeVisible();
			},
			{ timeout: 500 },
		);
		await expect(createButton).toBeEnabled();
		await userEvent.click(createButton);
	});
};

export const clickCancel = async ({ step }: { step: StoryStep }) => {
	const body = storyBody();
	await step("Click cancel button", async () => {
		const cancelButton = selectionPopoverSelectors.cancelButton(body);
		await waitFor(
			async () => {
				await expect(cancelButton).toBeVisible();
			},
			{ timeout: 500 },
		);
		await expect(cancelButton).toBeEnabled();
		await userEvent.click(cancelButton);
	});
};

export const expectButtonsDisabledDuringCreation = async ({
	step,
}: {
	step: StoryStep;
}) => {
	const body = storyBody();
	await step("Verify buttons are disabled during creation", async () => {
		const createButton = selectionPopoverSelectors.creatingButton(body);
		const cancelButton = selectionPopoverSelectors.cancelButton(body);

		await expect(createButton).toBeDisabled();
		await expect(cancelButton).toBeDisabled();
	});
};

export const expectTruncatedSelectionPreview = async ({
	step,
}: {
	step: StoryStep;
}) => {
	const body = storyBody();
	await step("Verify text is truncated with ellipsis", async () => {
		const textPreview = selectionPopoverSelectors.truncatedTextPreview(body);
		await waitFor(
			async () => {
				await expect(textPreview).toBeVisible();
			},
			{ timeout: 500 },
		);
	});
};
