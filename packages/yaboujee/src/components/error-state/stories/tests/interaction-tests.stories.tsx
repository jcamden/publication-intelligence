import { defaultInteractionTestMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within } from "@storybook/test";
import { ErrorState } from "../../error-state";

const meta = {
	...defaultInteractionTestMeta,
	title: "Components/ErrorState/tests/Interaction Tests",
	component: ErrorState,
	tags: ["interaction-test"],
} satisfies Meta<typeof ErrorState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ClickRetryButton: Story = {
	args: {
		title: "Failed to load data",
		message: "An error occurred while loading the data.",
		onRetry: fn(),
	},
	play: async ({ canvasElement, args, step }) => {
		const canvas = within(canvasElement);
		const onRetry = args.onRetry as ReturnType<typeof fn>;

		// Reset mock to ensure clean state for test run
		onRetry.mockClear();

		await step("Click retry button", async () => {
			const retryButton = canvas.getByRole("button", { name: /try again/i });
			await userEvent.click(retryButton);
		});

		await step("Verify onRetry was called", async () => {
			await expect(onRetry).toHaveBeenCalledTimes(1);
		});
	},
};
