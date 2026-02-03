import type { Meta, StoryObj } from "@storybook/react";
import { MentionDetailsPopover } from "../mention-details-popover";

const meta = {
	title: "Projects/[ProjectDir]/Editor/MentionDetailsPopover",
	component: MentionDetailsPopover,
	parameters: {
		layout: "centered",
	},
	args: {
		mention: {
			id: "mention-1",
			pageNumber: 42,
			text: "This is an example text snippet from the PDF document that was highlighted by the user",
			entryLabel: "Kant → Critique of Pure Reason",
			entryId: "entry-1",
			indexTypes: ["subject"],
		},
		onEdit: ({ mentionId }) => {
			console.log("Edit clicked:", mentionId);
		},
		onDelete: ({ mentionId }) => {
			console.log("Delete clicked:", mentionId);
		},
	},
} satisfies Meta<typeof MentionDetailsPopover>;

export default meta;
type Story = StoryObj<typeof MentionDetailsPopover>;

export const Default: Story = {};

export const ShortText: Story = {
	args: {
		mention: {
			id: "mention-2",
			pageNumber: 1,
			text: "Short text",
			entryLabel: "Philosophy",
			entryId: "entry-2",
			indexTypes: ["subject"],
		},
	},
};

export const LongText: Story = {
	args: {
		mention: {
			id: "mention-3",
			pageNumber: 99,
			text: "This is a very long text snippet that exceeds 100 characters and should be truncated with ellipsis to prevent the popover from becoming too wide and unwieldy for the user interface",
			entryLabel: "Plato → The Republic → Theory of Forms",
			entryId: "entry-3",
			indexTypes: ["subject", "author"],
		},
	},
};

export const LongEntryLabel: Story = {
	args: {
		mention: {
			id: "mention-4",
			pageNumber: 7,
			text: "Selected text",
			entryLabel:
				"Very Long Parent Entry → Very Long Child Entry → Very Long Grandchild Entry",
			entryId: "entry-4",
			indexTypes: ["scripture"],
		},
	},
};
