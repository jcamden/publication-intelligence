import type {
	StorybookCanvas,
	StoryContext,
	StoryUser,
} from "@pubint/yaboujee/_stories";
import { expect } from "@storybook/test";
import { windowInteractionSelectors } from "./selectors";

export const focusStateShows = async ({
	canvas,
	expected,
	step,
}: {
	canvas: StorybookCanvas;
	expected: string;
	step: StoryContext["step"];
}) => {
	await step(`Focus state shows ${expected}`, async () => {
		const el = windowInteractionSelectors.focusState(canvas);
		await expect(el).toHaveTextContent(expected);
	});
};

export const clickWindowTitleHeading = async ({
	canvas,
	user,
	name,
	step,
}: {
	canvas: StorybookCanvas;
	user: StoryUser;
	name: RegExp;
	step: StoryContext["step"];
}) => {
	await step("Click window title heading", async () => {
		const heading = windowInteractionSelectors.windowTitleHeading(canvas, name);
		await user.click(heading);
	});
};

export const maximizedStateShows = async ({
	canvas,
	expected,
	step,
}: {
	canvas: StorybookCanvas;
	expected: string;
	step: StoryContext["step"];
}) => {
	await step(`Maximized state shows ${expected}`, async () => {
		const el = windowInteractionSelectors.maximizedState(canvas);
		await expect(el).toHaveTextContent(expected);
	});
};

export const clickMaximizeButton = async ({
	canvas,
	user,
	step,
}: {
	canvas: StorybookCanvas;
	user: StoryUser;
	step: StoryContext["step"];
}) => {
	await step("Click Maximize button", async () => {
		const btn = windowInteractionSelectors.maximizeButton(canvas);
		await user.click(btn);
	});
};

export const unpopAndCloseButtonsAreVisible = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryContext["step"];
}) => {
	await step("Unpop and Close toolbar buttons are visible", async () => {
		const withUnpop = windowInteractionSelectors.regionByTestId(
			canvas,
			"with-unpop",
		);
		const unpopButton = windowInteractionSelectors.unpopButtonIn(
			withUnpop as HTMLElement,
		);
		await expect(unpopButton).toBeVisible();

		const withClose = windowInteractionSelectors.regionByTestId(
			canvas,
			"with-close",
		);
		const closeButton = windowInteractionSelectors.closeButtonIn(
			withClose as HTMLElement,
		);
		await expect(closeButton).toBeVisible();
	});
};

export const scrollTestHeadingIsVisible = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryContext["step"];
}) => {
	await step("Scroll test window title heading is visible", async () => {
		const heading = windowInteractionSelectors.windowTitleHeading(
			canvas,
			/scroll test/i,
		);
		await expect(heading).toBeVisible();
	});
};
