import type { Meta, StoryObj } from "@storybook/react";
import { MentionDetailsPopover } from "../mention-details-popover";

const mockIndexEntries = [
	{ id: "entry-1", label: "Critique of Pure Reason", parentId: "parent-1" },
	{ id: "parent-1", label: "Kant", parentId: null },
	{ id: "entry-2", label: "Philosophy", parentId: null },
	{ id: "entry-3", label: "Theory of Forms", parentId: "parent-3" },
	{ id: "parent-3", label: "The Republic", parentId: "parent-2" },
	{ id: "parent-2", label: "Plato", parentId: null },
	{ id: "entry-4", label: "Very Long Grandchild Entry", parentId: "parent-5" },
	{ id: "parent-5", label: "Very Long Child Entry", parentId: "parent-4" },
	{ id: "parent-4", label: "Very Long Parent Entry", parentId: null },
	{ id: "entry-5", label: "Aristotle", parentId: null },
	{ id: "entry-6", label: "Nicomachean Ethics", parentId: "entry-5" },
];

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
			indexType: "subject",
			type: "text" as const,
		},
		existingEntries: mockIndexEntries,
		onDelete: ({ mentionId }: { mentionId: string }) => {
			console.log("Delete clicked:", mentionId);
		},
		onClose: ({
			mentionId,
			entryId,
			entryLabel,
			text,
			pageSublocation,
		}: {
			mentionId: string;
			entryId?: string;
			entryLabel?: string;
			text?: string;
			pageSublocation?: string | null;
		}) => {
			console.log("Close:", {
				mentionId,
				entryId,
				entryLabel,
				text,
				pageSublocation,
			});
		},
		onCancel: () => {
			console.log("Cancel clicked");
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
			indexType: "subject",
			type: "text" as const,
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
			indexType: "subject",
			type: "text" as const,
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
			indexType: "scripture",
			type: "text" as const,
		},
	},
};

export const RegionMention: Story = {
	args: {
		mention: {
			id: "mention-5",
			pageNumber: 15,
			text: "Figure 3.2: Neural Network Architecture",
			entryLabel: "Aristotle",
			entryId: "entry-5",
			indexType: "subject",
			type: "region" as const,
		},
	},
};
