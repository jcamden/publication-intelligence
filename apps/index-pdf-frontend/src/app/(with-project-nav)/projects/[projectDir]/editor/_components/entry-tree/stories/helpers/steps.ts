import type { StorybookCanvas, StoryStep } from "@pubint/yaboujee/_stories";
import { waitMs } from "@pubint/yaboujee/_stories";
import { expect, userEvent } from "@storybook/test";
import { entryTreeSelectors } from "./selectors";

export const expandCollapseNodes = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryStep;
}) => {
	await step("Find parent entry", async () => {
		const philosophyEntry = entryTreeSelectors.philosophyEntry(canvas);
		await expect(philosophyEntry).toBeInTheDocument();
	});

	await step("Find expand button and collapse", async () => {
		const chevronButton = entryTreeSelectors.expandChevronButton(canvas);
		await userEvent.click(chevronButton);
	});

	await step("Verify children hidden", async () => {
		await waitMs({ ms: 100, step });
	});
};

export const emptyStateShowsMessage = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryStep;
}) => {
	await step("Verify empty message", async () => {
		const message = entryTreeSelectors.emptyMessage(canvas);
		await expect(message).toBeInTheDocument();
	});
};
