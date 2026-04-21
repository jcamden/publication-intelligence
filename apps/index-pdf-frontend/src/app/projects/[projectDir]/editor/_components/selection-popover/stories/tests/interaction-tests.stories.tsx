import { defaultInteractionTestMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { SelectionPopover } from "../../selection-popover";
import {
	clickCancel,
	clickCreateMention,
	expectButtonsDisabledDuringCreation,
	expectTruncatedSelectionPreview,
} from "../helpers/steps";
import { SelectionPopoverWrapper } from "../shared";

const meta: Meta<typeof SelectionPopover> = {
	...defaultInteractionTestMeta,
	title:
		"Projects/[ProjectDir]/Editor/SelectionPopover/tests/Interaction Tests",
	component: SelectionPopover,
	parameters: {
		...defaultInteractionTestMeta.parameters,
		layout: "centered",
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const CreateMentionClick: Story = {
	render: () => {
		const handleCreate = fn();
		return (
			<SelectionPopoverWrapper
				selectedText="Test selection"
				isCreating={false}
				onCreateMention={handleCreate}
				onCancel={fn()}
			/>
		);
	},
	play: async ({ step }) => {
		await clickCreateMention({ step });
	},
};

export const CancelClick: Story = {
	render: () => {
		const handleCancel = fn();
		return (
			<SelectionPopoverWrapper
				selectedText="Test selection"
				isCreating={false}
				onCreateMention={fn()}
				onCancel={handleCancel}
			/>
		);
	},
	play: async ({ step }) => {
		await clickCancel({ step });
	},
};

export const DisabledDuringCreation: Story = {
	render: () => {
		return (
			<SelectionPopoverWrapper
				selectedText="Test selection"
				isCreating={true}
				onCreateMention={fn()}
				onCancel={fn()}
			/>
		);
	},
	play: async ({ step }) => {
		await expectButtonsDisabledDuringCreation({ step });
	},
};

export const TextTruncation: Story = {
	render: () => {
		const longText =
			"This is a very long text selection that should be truncated to sixty characters and show an ellipsis";
		return (
			<SelectionPopoverWrapper
				selectedText={longText}
				isCreating={false}
				onCreateMention={fn()}
				onCancel={fn()}
			/>
		);
	},
	play: async ({ step }) => {
		await expectTruncatedSelectionPreview({ step });
	},
};
