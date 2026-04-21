import type {
	StorybookCanvas,
	StoryContext,
	StoryUser,
} from "@pubint/yaboujee/_stories";
import { expect, waitFor } from "@storybook/test";
import { draggableSidebarSelectors } from "./selectors";

export const expandedCountShows = async ({
	canvas,
	expected,
	step,
}: {
	canvas: StorybookCanvas;
	expected: string;
	step: StoryContext["step"];
}) => {
	await step(`Expanded count shows ${expected}`, async () => {
		const el = draggableSidebarSelectors.expandedCount(canvas);
		await expect(el).toHaveTextContent(expected);
	});
};

export const clickPagesAccordionTrigger = async ({
	canvas,
	user,
	step,
}: {
	canvas: StorybookCanvas;
	user: StoryUser;
	step: StoryContext["step"];
}) => {
	await step("Click Pages section trigger", async () => {
		const trigger = draggableSidebarSelectors.pagesSectionTrigger(canvas);
		await user.click(trigger);
	});
};

export const popOutButtonsExist = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryContext["step"];
}) => {
	await step("At least one Pop out to window control exists", async () => {
		const buttons = draggableSidebarSelectors.popOutButtons(canvas);
		await expect(buttons.length).toBeGreaterThan(0);
	});
};

export const clickFirstPopOutButton = async ({
	canvas,
	user,
	step,
}: {
	canvas: StorybookCanvas;
	user: StoryUser;
	step: StoryContext["step"];
}) => {
	await step("Click first Pop out to window control", async () => {
		const buttons = draggableSidebarSelectors.popOutButtons(canvas);
		await user.click(buttons[0]);
	});
};

export const clickAccordionTriggersForLabels = async ({
	canvas,
	user,
	labels,
	step,
}: {
	canvas: StorybookCanvas;
	user: StoryUser;
	labels: string[];
	step: StoryContext["step"];
}) => {
	for (const [i, label] of labels.entries()) {
		const expected = String(i + 1);
		await step(`Click ${label} section trigger`, async () => {
			const trigger = draggableSidebarSelectors.accordionTriggerFromLabelText(
				canvas,
				label,
			);
			await user.click(trigger);
		});

		await step(`Expanded count shows ${expected}`, async () => {
			await waitFor(() =>
				expect(
					draggableSidebarSelectors.expandedCount(canvas),
				).toHaveTextContent(expected),
			);
		});
	}
};
