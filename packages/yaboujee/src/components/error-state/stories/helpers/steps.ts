import type {
	StorybookCanvas,
	StoryContext,
	StoryUser,
} from "@pubint/yaboujee/_stories";
import { expect } from "@storybook/test";
import { errorStateSelectors } from "./selectors";

export const clickRetryButton = async ({
	canvas,
	user,
	step,
}: {
	canvas: StorybookCanvas;
	user: StoryUser;
	step: StoryContext["step"];
}) => {
	await step("Click Try Again button", async () => {
		const retryButton = errorStateSelectors.retryButton(canvas);
		await user.click(retryButton);
	});
};

export const onRetryCallbackIsCalledOnce = async ({
	onRetry,
	step,
}: {
	onRetry: ReturnType<typeof import("@storybook/test")["fn"]>;
	step: StoryContext["step"];
}) => {
	await step("Retry callback is called once", async () => {
		await expect(onRetry).toHaveBeenCalledTimes(1);
	});
};
