import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { mockSubjectEntries } from "../../../_mocks/index-entries";
import { mockMentions } from "../../../_mocks/mentions";
import { EntryTree } from "../entry-tree";

const meta: Meta<typeof EntryTree> = {
	title: "Projects/[ProjectDir]/Editor/EntryTree",
	component: EntryTree,
	parameters: {
		layout: "padded",
	},
	tags: ["autodocs"],
	decorators: [
		(Story) => (
			<div style={{ width: "300px", border: "1px solid #ccc" }}>
				<Story />
			</div>
		),
	],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default entry tree with hierarchy
 */
export const Default: Story = {
	args: {
		entries: mockSubjectEntries,
		mentions: mockMentions,
		onCreateEntry: fn(),
	},
};

/**
 * Empty state (no entries yet)
 */
export const EmptyState: Story = {
	args: {
		entries: [],
		mentions: [],
		onCreateEntry: fn(),
	},
};

/**
 * Flat list (no hierarchy)
 */
export const FlatList: Story = {
	args: {
		entries: mockSubjectEntries.filter((e) => e.parentId === null), // Only top-level
		mentions: mockMentions,
		onCreateEntry: fn(),
	},
};

/**
 * With entry click handler
 */
export const WithClickHandler: Story = {
	args: {
		entries: mockSubjectEntries,
		mentions: mockMentions,
		onCreateEntry: fn(),
		onEntryClick: (entry) => console.log("Clicked:", entry),
	},
};
