import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within } from "@storybook/test";
import { MentionDetailsPopover } from "../../mention-details-popover";

const meta = {
	title:
		"Projects/[ProjectDir]/Editor/MentionDetailsPopover/tests/Visual Regression Tests",
	component: MentionDetailsPopover,
	parameters: {
		layout: "centered",
	},
} satisfies Meta<typeof MentionDetailsPopover>;

export default meta;
type Story = StoryObj<typeof MentionDetailsPopover>;

const defaultGlobals = {
	theme: "light" as const,
	backgrounds: { value: "light" },
};

const defaultMention = {
	id: "mention-1",
	pageNumber: 42,
	text: "This is an example text snippet from the PDF document that was highlighted by the user",
	entryLabel: "Kant → Critique of Pure Reason",
	entryId: "entry-1",
	indexTypes: ["subject"],
};

export const Default: Story = {
	args: {
		mention: defaultMention,
		onEdit: () => {},
		onDelete: () => {},
		onClose: () => {},
	},
	globals: {
		...defaultGlobals,
		viewport: { value: "mobile1" },
	},
};

export const DefaultDark: Story = {
	args: {
		mention: defaultMention,
		onEdit: () => {},
		onDelete: () => {},
		onClose: () => {},
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
			indexTypes: ["author"],
		},
		onEdit: () => {},
		onDelete: () => {},
		onClose: () => {},
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
			indexTypes: ["subject", "author"],
		},
		onEdit: () => {},
		onDelete: () => {},
		onClose: () => {},
	},
	globals: {
		...defaultGlobals,
		viewport: { value: "mobile1" },
	},
};

export const HoverEditButton: Story = {
	args: {
		mention: defaultMention,
		onEdit: () => {},
		onDelete: () => {},
		onClose: () => {},
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
		onEdit: () => {},
		onDelete: () => {},
		onClose: () => {},
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

/**
 * Multiselect with all three types selected
 */
export const ThreeTypesSelected: Story = {
	args: {
		mention: {
			id: "mention-5",
			pageNumber: 42,
			text: "All types mention text",
			entryLabel: "Philosophy Entry",
			entryId: "entry-5",
			indexTypes: ["subject", "author", "scripture"],
		},
		onEdit: () => {},
		onDelete: () => {},
		onClose: () => {},
	},
	globals: {
		...defaultGlobals,
		viewport: { value: "mobile1" },
	},
};

/**
 * Multiselect dropdown in open state
 */
export const DropdownOpen: Story = {
	args: {
		mention: {
			id: "mention-6",
			pageNumber: 42,
			text: "Example text",
			entryLabel: "Test Entry",
			entryId: "entry-6",
			indexTypes: ["subject", "author"],
		},
		onEdit: () => {},
		onDelete: () => {},
		onClose: () => {},
	},
	globals: {
		...defaultGlobals,
		viewport: { value: "mobile1" },
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// Open the dropdown
		const selectTrigger = canvas.getByTestId("index-types-select");
		await userEvent.click(selectTrigger);

		// Wait for dropdown animation to complete
		await new Promise((resolve) => setTimeout(resolve, 300));
	},
};
