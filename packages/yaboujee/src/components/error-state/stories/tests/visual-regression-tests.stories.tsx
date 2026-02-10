import { defaultGlobals, defaultVrtMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { ErrorState } from "../../error-state";

const meta = {
	...defaultVrtMeta,
	title: "Components/ErrorState/tests/Visual Regression Tests",
	component: ErrorState,
	tags: ["visual-test"],
} satisfies Meta<typeof ErrorState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	globals: {
		...defaultGlobals,
		viewport: { value: "mobile1", isRotated: true },
	},
	args: {
		title: "Failed to load data",
		message: "An error occurred while loading the data. Please try again.",
		onRetry: fn(),
	},
};
