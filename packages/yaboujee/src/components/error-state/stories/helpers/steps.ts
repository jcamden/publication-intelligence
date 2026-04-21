import type { StoryContext } from "@pubint/yaboujee/_stories";
import { expect } from "@storybook/test";
import { errorStateSelectors } from "./selectors";

type StorybookCanvas = ReturnType<typeof import("@storybook/test")["within"]>;

export const clickRetryButton = async ({
	canvas,
	user,
	step,
}: {
	canvas: StorybookCanvas;
	user: ReturnType<typeof import("@storybook/test")["userEvent"]["setup"]>;
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
