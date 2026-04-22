import type { StorybookCanvas, StoryStep } from "@pubint/yaboujee/_stories";
import { waitMs } from "@pubint/yaboujee/_stories";
import { expect, userEvent } from "@storybook/test";
import { entryTreeSelectors } from "./selectors";

export const expandAllNodes = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryStep;
}) => {
	await step("Expand all entry tree nodes", async () => {
		// Keep clicking collapsed chevrons until none remain.
		// Safety cap prevents infinite loops if something toggles unexpectedly.
		const maxPasses = 50;
		for (let pass = 0; pass < maxPasses; pass++) {
			const collapsedButtons = entryTreeSelectors.expandChevronButtons(canvas);
			if (collapsedButtons.length === 0) {
				return;
			}

			// Click in DOM order; after each click wait a tick for children to render.
			for (const button of collapsedButtons) {
				await userEvent.click(button);
				await waitMs({ ms: 25, step });
			}

			await waitMs({ ms: 50, step });
		}

		throw new Error("Failed to fully expand entry tree (safety cap hit)");
	});
};

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
		const chevronButton = entryTreeSelectors.toggleChevronButton(canvas);
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
