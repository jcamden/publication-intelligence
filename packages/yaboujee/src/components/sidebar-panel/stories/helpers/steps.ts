import type {
	StorybookCanvas,
	StoryContext,
	StoryUser,
} from "@pubint/yaboujee/_stories";
import { expect } from "@storybook/test";
import { sidebarPanelSelectors } from "./selectors";

export const closePanelButtonHasAccessibleName = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryContext["step"];
}) => {
	await step("Close panel button accessible name is Close panel", async () => {
		const closeButton = sidebarPanelSelectors.closePanelButton(canvas);
		await expect(closeButton).toHaveAccessibleName("Close panel");
	});
};

export const clickClosePanelButton = async ({
	canvas,
	user,
	step,
}: {
	canvas: StorybookCanvas;
	user: StoryUser;
	step: StoryContext["step"];
}) => {
	await step("Click Close panel button", async () => {
		const closeButton = sidebarPanelSelectors.closePanelButton(canvas);
		await user.click(closeButton);
	});
};

export const contentIsVisible = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryContext["step"];
}) => {
	await step("Panel content is visible", async () => {
		const content = sidebarPanelSelectors.content(canvas);
		await expect(content).toBeVisible();
	});
};

export const noHeadingsInDocument = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryContext["step"];
}) => {
	await step("Heading count is zero", async () => {
		const headings = sidebarPanelSelectors.allHeadings(canvas);
		await expect(headings.length).toBe(0);
	});
};

export const noButtonsInDocument = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryContext["step"];
}) => {
	await step("Button count is zero", async () => {
		const buttons = sidebarPanelSelectors.allButtons(canvas);
		await expect(buttons.length).toBe(0);
	});
};

export const panelHasClassName = async ({
	canvas,
	className,
	step,
}: {
	canvas: StorybookCanvas;
	className: string;
	step: StoryContext["step"];
}) => {
	await step(`Panel root has class ${className}`, async () => {
		const panel = sidebarPanelSelectors.panel(canvas);
		await expect(panel).toHaveClass(className);
	});
};

export const closeButtonIsVisible = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryContext["step"];
}) => {
	await step("Close panel button is visible", async () => {
		const closeButton = sidebarPanelSelectors.closePanelButton(canvas);
		await expect(closeButton).toBeVisible();
	});
};
