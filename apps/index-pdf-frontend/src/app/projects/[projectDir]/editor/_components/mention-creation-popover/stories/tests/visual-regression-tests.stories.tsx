import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within } from "@storybook/test";
import { MentionCreationPopover } from "../../mention-creation-popover";
import { mockDraft, mockIndexEntries, mockRegionDraft } from "../shared";

const meta = {
	title:
		"Projects/[ProjectDir]/Editor/MentionCreationPopover/tests/Visual Regression Tests",
	component: MentionCreationPopover,
	parameters: {
		layout: "padded",
		pseudo: {
			hover: false,
			active: false,
			focus: false,
		},
	},
} satisfies Meta<typeof MentionCreationPopover>;

export default meta;
type Story = StoryObj<typeof meta>;

const defaultGlobals = {
	theme: "light" as const,
	viewport: undefined as
		| { value: string; isRotated?: boolean }
		| string
		| undefined,
};

export const Default: Story = {
	args: {
		draft: mockDraft,
		existingEntries: mockIndexEntries,
		onAttach: () => {},
		onCancel: () => {},
	},
	globals: {
		...defaultGlobals,
		viewport: { value: "mobile1" },
	},
};

export const DefaultDark: Story = {
	...Default,
	globals: {
		...defaultGlobals,
		theme: "dark",
		viewport: { value: "mobile1" },
	},
};

export const WithSearchResults: Story = {
	args: Default.args,
	globals: {
		...defaultGlobals,
		viewport: { value: "mobile1" },
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const input = canvas.getByPlaceholderText("Search or create...");
		await userEvent.type(input, "Phil", { delay: 10 });
		await new Promise((resolve) => setTimeout(resolve, 300));
	},
};

export const WithSearchResultsDark: Story = {
	...WithSearchResults,
	globals: {
		...defaultGlobals,
		theme: "dark",
		viewport: { value: "mobile1" },
	},
};

export const NoResults: Story = {
	args: Default.args,
	globals: {
		...defaultGlobals,
		viewport: { value: "mobile1" },
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const input = canvas.getByPlaceholderText("Search or create...");
		await userEvent.type(input, "Nonexistent", { delay: 10 });
		await new Promise((resolve) => setTimeout(resolve, 300));
	},
};

export const RegionDraft: Story = {
	args: {
		draft: mockRegionDraft,
		existingEntries: mockIndexEntries,
		onAttach: () => {},
		onCancel: () => {},
	},
	globals: {
		...defaultGlobals,
		viewport: { value: "mobile1" },
	},
};
