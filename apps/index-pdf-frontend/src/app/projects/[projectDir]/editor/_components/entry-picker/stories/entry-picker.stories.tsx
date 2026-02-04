import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { mockIndexEntries } from "../../../_mocks/index-entries";
import type { Mention } from "../../editor/editor";
import { EntryPicker } from "../entry-picker";

// Mock mentions for testing
const mockMentions: Mention[] = [
	{
		id: "m1",
		pageNumber: 1,
		text: "Philosophy reference",
		bboxes: [{ x: 100, y: 100, width: 200, height: 20 }],
		entryId: "entry-subject-1", // Philosophy
		entryLabel: "Philosophy",
		indexTypes: ["subject"],
		type: "text",
		createdAt: new Date(),
	},
	{
		id: "m2",
		pageNumber: 1,
		text: "Kant reference",
		bboxes: [{ x: 100, y: 150, width: 200, height: 20 }],
		entryId: "entry-subject-3", // Kant
		entryLabel: "Kant, Immanuel",
		indexTypes: ["subject"],
		type: "text",
		createdAt: new Date(),
	},
	{
		id: "m3",
		pageNumber: 2,
		text: "Another Kant reference",
		bboxes: [{ x: 100, y: 100, width: 200, height: 20 }],
		entryId: "entry-subject-3", // Kant
		entryLabel: "Kant, Immanuel",
		indexTypes: ["subject"],
		type: "text",
		createdAt: new Date(),
	},
];

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
