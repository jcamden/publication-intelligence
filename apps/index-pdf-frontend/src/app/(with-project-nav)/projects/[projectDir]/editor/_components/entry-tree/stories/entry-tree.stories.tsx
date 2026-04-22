import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { getChildEntries } from "@/app/projects/[projectDir]/_utils/entry-filters";
import { mockSubjectEntries } from "../../../_mocks/mock-index-entries";
import { mockMentions } from "../../../_mocks/mock-mentions";
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
	},
};

/**
 * Empty state (no entries yet)
 */
export const EmptyState: Story = {
	args: {
		entries: [],
		mentions: [],
	},
};

/**
 * Flat list (no hierarchy)
 */
export const FlatList: Story = {
	args: {
		entries: getChildEntries({
			entries: mockSubjectEntries,
			parentId: null,
		}), // Only top-level
		mentions: mockMentions,
	},
};

/**
 * With entry click handler
 */
export const WithClickHandler: Story = {
	args: {
		entries: mockSubjectEntries,
		mentions: mockMentions,
		onEntryClick: (entry) => console.log("Clicked:", entry),
	},
};
