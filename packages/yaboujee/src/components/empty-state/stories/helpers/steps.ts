import type { StoryContext } from "@storybook/react";
import { expect } from "@storybook/test";
import { emptyStateSelectors } from "./selectors";

type StorybookCanvas = ReturnType<typeof import("@storybook/test")["within"]>;

export const clickActionButton = async ({
	canvas,
	user,
	step,
}: {
	canvas: StorybookCanvas;
	user: ReturnType<typeof import("@storybook/test")["userEvent"]["setup"]>;
	step: StoryContext["step"];
}) => {
	await step("Click action button", async () => {
		const button = emptyStateSelectors.actionButton(canvas);
		await user.click(button);
	});
};

export const actionClickCallbackIsCalledOnce = async ({
	onActionClick,
	step,
}: {
	onActionClick: ReturnType<typeof import("@storybook/test")["fn"]>;
	step: StoryContext["step"];
}) => {
	await step("Action click callback is called once", async () => {
		await expect(onActionClick).toHaveBeenCalledTimes(1);
	});
};
