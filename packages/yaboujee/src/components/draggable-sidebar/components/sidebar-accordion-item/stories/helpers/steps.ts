import type {
	StorybookCanvas,
	StoryContext,
	StoryUser,
} from "@pubint/yaboujee/_stories";
import { expect } from "@storybook/test";
import { sidebarAccordionItemSelectors } from "./selectors";

export const clickPopOutButton = async ({
	canvas,
	user,
	step,
}: {
	canvas: StorybookCanvas;
	user: StoryUser;
	step: StoryContext["step"];
}) => {
	await step("Click Pop out to window button", async () => {
		const btn = sidebarAccordionItemSelectors.popOutButton(canvas);
		await user.click(btn);
	});
};

export const popOutButtonAccessibleName = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryContext["step"];
}) => {
	await step(
		"Pop out button accessible name is Pop out to window",
		async () => {
			const btn = sidebarAccordionItemSelectors.popOutButton(canvas);
			await expect(btn).toHaveAccessibleName("Pop out to window");
		},
	);
};

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
		await expect(
			sidebarAccordionItemSelectors.expandedCount(canvas),
		).toHaveTextContent(expected);
	});
};

export const clickTestSectionTrigger = async ({
	canvas,
	user,
	step,
}: {
	canvas: StorybookCanvas;
	user: StoryUser;
	step: StoryContext["step"];
}) => {
	await step("Click Test Section accordion trigger", async () => {
		const trigger = sidebarAccordionItemSelectors.sectionTrigger(canvas);
		await user.click(trigger);
	});
};

export const dragHandleIsButtonAndVisible = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryContext["step"];
}) => {
	await step("Drag handle is visible with role button", async () => {
		const handle = sidebarAccordionItemSelectors.dragHandle(canvas);
		await expect(handle).toBeVisible();
		await expect(handle).toHaveAttribute("role", "button");
	});
};

export const expandedStateShows = async ({
	canvas,
	expected,
	step,
}: {
	canvas: StorybookCanvas;
	expected: string;
	step: StoryContext["step"];
}) => {
	await step(`Expanded state label shows ${expected}`, async () => {
		await expect(
			sidebarAccordionItemSelectors.expandedState(canvas),
		).toHaveTextContent(expected);
	});
};

export const clickDragHandle = async ({
	canvas,
	user,
	step,
}: {
	canvas: StorybookCanvas;
	user: StoryUser;
	step: StoryContext["step"];
}) => {
	await step("Click Drag to reorder control", async () => {
		const handle = sidebarAccordionItemSelectors.dragHandle(canvas);
		await user.click(handle);
	});
};
