import { defaultInteractionTestMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { fn, userEvent, within } from "@storybook/test";
import { ErrorState } from "../../error-state";
import {
	clickRetryButton,
	onRetryCallbackIsCalledOnce,
} from "../helpers/steps";

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
		const user = userEvent.setup();
		const onRetry = args.onRetry as ReturnType<typeof fn>;

		// Reset mock to ensure clean state for test run
		onRetry.mockClear();

		await clickRetryButton({ canvas, user, step });
		await onRetryCallbackIsCalledOnce({ onRetry, step });
	},
};
