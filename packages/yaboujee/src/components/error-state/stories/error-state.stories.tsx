import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { ErrorState } from "../error-state";

const meta: Meta<typeof ErrorState> = {
	title: "Components/ErrorState",
	component: ErrorState,
	parameters: {
		layout: "centered",
	},
	args: {
		onRetry: fn(),
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		title: "Failed to load data",
		message: "An error occurred while loading the data. Please try again.",
	},
};

export const WithoutRetry: Story = {
	args: {
		title: "No data available",
		message: "The requested data could not be found.",
		onRetry: undefined,
	},
};
