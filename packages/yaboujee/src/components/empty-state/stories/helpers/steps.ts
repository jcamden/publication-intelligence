import type {
	StorybookCanvas,
	StoryContext,
	StoryUser,
} from "@pubint/yaboujee/_stories";
import { expect } from "@storybook/test";
import { emptyStateSelectors } from "./selectors";

export const clickActionButton = async ({
	canvas,
	user,
	step,
}: {
	canvas: StorybookCanvas;
	user: StoryUser;
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
