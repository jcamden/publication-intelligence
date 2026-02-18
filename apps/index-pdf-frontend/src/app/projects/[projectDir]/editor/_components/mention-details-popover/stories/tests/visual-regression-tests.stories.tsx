import { defaultGlobals, defaultVrtMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within } from "@storybook/test";
import { MentionDetailsPopover } from "../../mention-details-popover";

const mockIndexEntries = [
	{ id: "entry-1", label: "Critique of Pure Reason", parentId: "parent-1" },
	{ id: "parent-1", label: "Kant", parentId: null },
	{ id: "entry-2", label: "Philosophy", parentId: null },
	{ id: "entry-3", label: "The Republic", parentId: "parent-2" },
	{ id: "parent-2", label: "Plato", parentId: null },
	{ id: "entry-5", label: "Philosophy Entry", parentId: null },
	{ id: "entry-6", label: "Test Entry", parentId: null },
];

const meta = {
	...defaultVrtMeta,
	title:
		"Projects/[ProjectDir]/Editor/MentionDetailsPopover/tests/Visual Regression Tests",
	component: MentionDetailsPopover,
	parameters: {
		layout: "centered",
	},
} satisfies Meta<typeof MentionDetailsPopover>;

export default meta;
type Story = StoryObj<typeof MentionDetailsPopover>;

const defaultMention = {
	id: "mention-1",
	pageNumber: 42,
	text: "This is an example text snippet from the PDF document that was highlighted by the user",
	entryLabel: "Kant → Critique of Pure Reason",
	entryId: "entry-1",
	indexType: "subject",
	type: "text" as const,
};

export const Default: Story = {
	args: {
		mention: defaultMention,
		existingEntries: mockIndexEntries,
		onDelete: () => {},
		onClose: () => {},
		onCancel: () => {},
	},
	globals: {
		...defaultGlobals,
		viewport: { value: "mobile1" },
	},
};

export const DefaultDark: Story = {
	args: {
		mention: defaultMention,
		existingEntries: mockIndexEntries,
		onDelete: () => {},
		onClose: () => {},
		onCancel: () => {},
	},
	globals: {
		theme: "dark",
		backgrounds: { value: "dark" },
		viewport: { value: "mobile1" },
	},
};

export const ShortText: Story = {
	args: {
		mention: {
			id: "mention-2",
			pageNumber: 1,
			text: "Short text",
			entryLabel: "Philosophy",
			entryId: "entry-2",
			indexType: "author",
			type: "text" as const,
		},
		existingEntries: mockIndexEntries,
		onDelete: () => {},
		onClose: () => {},
		onCancel: () => {},
	},
	globals: {
		...defaultGlobals,
		viewport: { value: "mobile1" },
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
		existingEntries: mockIndexEntries,
		onDelete: () => {},
		onClose: () => {},
		onCancel: () => {},
	},
	globals: {
		...defaultGlobals,
		viewport: { value: "mobile1" },
	},
};

export const HoverEditButton: Story = {
	args: {
		mention: defaultMention,
		existingEntries: mockIndexEntries,
		onDelete: () => {},
		onClose: () => {},
		onCancel: () => {},
	},
	parameters: {
		pseudo: {
			hover: ['[data-testid="edit-button"]'],
		},
	},
	globals: {
		...defaultGlobals,
		viewport: { value: "mobile1" },
	},
	play: async () => {
		await new Promise((resolve) => setTimeout(resolve, 300));
	},
};

export const HoverDeleteButton: Story = {
	args: {
		mention: defaultMention,
		existingEntries: mockIndexEntries,
		onDelete: () => {},
		onClose: () => {},
		onCancel: () => {},
	},
	parameters: {
		pseudo: {
			hover: ['[data-testid="delete-button"]'],
		},
	},
	globals: {
		...defaultGlobals,
		viewport: { value: "mobile1" },
	},
	play: async () => {
		await new Promise((resolve) => setTimeout(resolve, 300));
	},
};

export const ScriptureIndexType: Story = {
	args: {
		mention: {
			id: "mention-5",
			pageNumber: 42,
			text: "Scripture mention text",
			entryLabel: "Philosophy Entry",
			entryId: "entry-5",
			indexType: "scripture",
			type: "text" as const,
		},
		existingEntries: mockIndexEntries,
		onDelete: () => {},
		onClose: () => {},
		onCancel: () => {},
	},
	globals: {
		...defaultGlobals,
		viewport: { value: "mobile1" },
	},
};

export const EditModeWithSublocation: Story = {
	args: {
		mention: {
			id: "mention-6",
			pageNumber: 42,
			text: "Example text",
			entryLabel: "Test Entry",
			entryId: "entry-6",
			indexType: "subject",
			type: "text" as const,
			pageSublocation: "10:45.a",
		},
		existingEntries: mockIndexEntries,
		onDelete: () => {},
		onClose: () => {},
		onCancel: () => {},
	},
	globals: {
		...defaultGlobals,
		viewport: { value: "mobile1" },
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const editButton = canvas.getByRole("button", { name: /^edit$/i });
		await userEvent.click(editButton);
		await new Promise((resolve) => setTimeout(resolve, 100));
	},
};
