import type {
	StorybookCanvas,
	StoryContext,
	StoryUser,
} from "@pubint/yaboujee/_stories";
import { expect } from "@storybook/test";
import {
	windowTopBarSelectors,
	windowTopBarWithinSelectors,
} from "./selectors";

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
		await user.click(windowTopBarSelectors.maximizeButton(canvas));
	});
};

export const maximizeButtonIsVisible = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryContext["step"];
}) => {
	await step("Maximize button is visible", async () => {
		await expect(windowTopBarSelectors.maximizeButton(canvas)).toBeVisible();
	});
};

export const restoreButtonIsVisible = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryContext["step"];
}) => {
	await step("Restore button is visible", async () => {
		await expect(windowTopBarSelectors.restoreButton(canvas)).toBeVisible();
	});
};

export const clickRestoreButton = async ({
	canvas,
	user,
	step,
}: {
	canvas: StorybookCanvas;
	user: StoryUser;
	step: StoryContext["step"];
}) => {
	await step("Click Restore button", async () => {
		await user.click(windowTopBarSelectors.restoreButton(canvas));
	});
};

export const clickCloseButton = async ({
	canvas,
	user,
	step,
}: {
	canvas: StorybookCanvas;
	user: StoryUser;
	step: StoryContext["step"];
}) => {
	await step("Click Close button", async () => {
		await user.click(windowTopBarSelectors.closeButton(canvas));
	});
};

export const closeButtonIsVisible = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryContext["step"];
}) => {
	await step("Close button is visible", async () => {
		await expect(windowTopBarSelectors.closeButton(canvas)).toBeVisible();
	});
};

export const clickUnpopButton = async ({
	canvas,
	user,
	step,
}: {
	canvas: StorybookCanvas;
	user: StoryUser;
	step: StoryContext["step"];
}) => {
	await step("Click Return to sidebar button", async () => {
		await user.click(windowTopBarSelectors.unpopButton(canvas));
	});
};

export const unpopButtonIsVisible = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryContext["step"];
}) => {
	await step("Return to sidebar button is visible", async () => {
		await expect(windowTopBarSelectors.unpopButton(canvas)).toBeVisible();
	});
};

export const unpopVisibleAndCloseVisibleByRegion = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryContext["step"];
}) => {
	await step("Unpop button visible when sidebar expanded", async () => {
		await expect(
			windowTopBarWithinSelectors.unpopInSidebarVisible(canvas),
		).toBeVisible();
	});

	await step("Close button visible when sidebar collapsed", async () => {
		await expect(
			windowTopBarWithinSelectors.closeInSidebarCollapsed(canvas),
		).toBeVisible();
	});
};

export const twoToolbarButtonsAreVisible = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryContext["step"];
}) => {
	await step("Two toolbar buttons are visible", async () => {
		const buttons = windowTopBarSelectors.allButtons(canvas);
		for (const button of buttons) {
			await expect(button).toBeVisible();
		}
		await expect(buttons.length).toBe(2);
	});
};
