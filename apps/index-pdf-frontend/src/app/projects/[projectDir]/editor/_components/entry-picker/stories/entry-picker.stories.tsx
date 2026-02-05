import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { mockIndexEntries } from "../../../_mocks/index-entries";
import { mockMentions } from "../../../_mocks/mentions";
import { EntryPicker } from "../entry-picker";

const meta: Meta<typeof EntryPicker> = {
	title: "Projects/[ProjectDir]/Editor/EntryPicker",
	component: EntryPicker,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	decorators: [
		(Story) => (
			<div style={{ width: "400px" }}>
				<Story />
			</div>
		),
	],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default entry picker for Subject index
 */
export const Default: Story = {
	args: {
		indexType: "subject",
		entries: mockIndexEntries,
		mentions: mockMentions,
		onValueChange: fn(),
		onCreateNew: fn(),
	},
};

/**
 * With selected entry (input pre-filled)
 */
export const WithSelection: Story = {
	args: {
		...Default.args,
		inputValue: "Kant, Immanuel",
	},
};

/**
 * Empty state (no entries for this index type)
 */
export const EmptyState: Story = {
	args: {
		...Default.args,
		entries: [],
		mentions: [],
	},
};

/**
 * With input value (user typing)
 */
export const WithInputValue: Story = {
	args: {
		...Default.args,
		inputValue: "Kant",
	},
};
