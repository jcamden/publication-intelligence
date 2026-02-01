import {
	defaultGlobals,
	visualRegressionTestConfig,
} from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { SelectionPopover } from "../../selection-popover";
import { SelectionPopoverWrapper } from "../shared";

const meta: Meta<typeof SelectionPopover> = {
	title:
		"Projects/[ProjectDir]/Editor/SelectionPopover/tests/Visual Regression Tests",
	component: SelectionPopover,
	parameters: {
		...visualRegressionTestConfig,
		layout: "centered",
	},
	tags: ["visual-regression"],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Basic popover in light mode
 */
export const LightMode: Story = {
	globals: {
		...defaultGlobals,
	},
	render: () => (
		<SelectionPopoverWrapper
			selectedText="The quick brown fox jumps over the lazy dog"
			isCreating={false}
			onCreateMention={fn()}
			onCancel={fn()}
		/>
	),
};

/**
 * Basic popover in dark mode
 */
export const DarkMode: Story = {
	globals: {
		...defaultGlobals,
		theme: "dark",
	},
	render: () => (
		<SelectionPopoverWrapper
			selectedText="The quick brown fox jumps over the lazy dog"
			isCreating={false}
			onCreateMention={fn()}
			onCancel={fn()}
		/>
	),
};
