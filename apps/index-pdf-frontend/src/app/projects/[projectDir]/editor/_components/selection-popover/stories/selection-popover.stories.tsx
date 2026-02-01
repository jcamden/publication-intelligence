import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { SelectionPopover } from "../selection-popover";
import { SelectionPopoverWrapper } from "./shared";

const meta: Meta<typeof SelectionPopover> = {
	title: "Projects/[ProjectDir]/Editor/SelectionPopover",
	component: SelectionPopover,
	tags: ["autodocs"],
	parameters: {
		layout: "centered",
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => (
		<SelectionPopoverWrapper
			selectedText="The quick brown fox jumps over the lazy dog"
			isCreating={false}
			onCreateMention={fn()}
			onCancel={fn()}
		/>
	),
};

export const LongText: Story = {
	render: () => (
		<SelectionPopoverWrapper
			selectedText="This is a very long text selection that will be truncated to show only the first sixty characters and then add an ellipsis"
			isCreating={false}
			onCreateMention={fn()}
			onCancel={fn()}
		/>
	),
};

export const Creating: Story = {
	render: () => (
		<SelectionPopoverWrapper
			selectedText="Selected text"
			isCreating={true}
			onCreateMention={fn()}
			onCancel={fn()}
		/>
	),
};
