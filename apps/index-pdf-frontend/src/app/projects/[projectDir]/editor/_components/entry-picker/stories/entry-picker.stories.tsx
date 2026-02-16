import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { useState } from "react";
import type { IndexEntry } from "../../../_types/index-entry";
import { EntryPicker } from "../entry-picker";

const meta = {
	title: "Projects/[ProjectDir]/Editor/EntryPicker",
	component: EntryPicker,
	parameters: {
		layout: "centered",
	},
	decorators: [
		(Story) => (
			<div className="w-[400px]">
				<Story />
			</div>
		),
	],
	tags: ["autodocs"],
} satisfies Meta<typeof EntryPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock hierarchical entry data
const mockEntries: IndexEntry[] = [
	// Root level entries
	{
		id: "1",
		indexType: "subject",
		label: "Animals",
		parentId: null,
		metadata: { matchers: ["fauna"] },
	},
	{
		id: "2",
		indexType: "subject",
		label: "Plants",
		parentId: null,
		metadata: { matchers: ["flora"] },
	},
	{
		id: "3",
		indexType: "subject",
		label: "Geography",
		parentId: null,
		metadata: {},
	},
	// Children of Animals
	{
		id: "1-1",
		indexType: "subject",
		label: "Mammals",
		parentId: "1",
		metadata: {},
	},
	{
		id: "1-2",
		indexType: "subject",
		label: "Birds",
		parentId: "1",
		metadata: {},
	},
	{
		id: "1-3",
		indexType: "subject",
		label: "Reptiles",
		parentId: "1",
		metadata: {},
	},
	// Children of Mammals
	{
		id: "1-1-1",
		indexType: "subject",
		label: "Dogs",
		parentId: "1-1",
		metadata: { matchers: ["canines", "canids"] },
	},
	{
		id: "1-1-2",
		indexType: "subject",
		label: "Cats",
		parentId: "1-1",
		metadata: { matchers: ["felines", "felids"] },
	},
	{
		id: "1-1-3",
		indexType: "subject",
		label: "Elephants",
		parentId: "1-1",
		metadata: {},
	},
	// Children of Plants
	{
		id: "2-1",
		indexType: "subject",
		label: "Trees",
		parentId: "2",
		metadata: {},
	},
	{
		id: "2-2",
		indexType: "subject",
		label: "Flowers",
		parentId: "2",
		metadata: {},
	},
	// Children of Geography
	{
		id: "3-1",
		indexType: "subject",
		label: "Continents",
		parentId: "3",
		metadata: {},
	},
	{
		id: "3-2",
		indexType: "subject",
		label: "Oceans",
		parentId: "3",
		metadata: {},
	},
];

/**
 * Default state with no selection - interactive with state
 */
export const Default: Story = {
	args: {
		entries: mockEntries,
		value: null,
		onValueChange: fn(),
	},
	render: () => {
		const [value, setValue] = useState<string | null>(null);
		return (
			<EntryPicker
				// allowClear
				entries={mockEntries}
				value={value}
				onValueChange={setValue}
				placeholder="Select an entry..."
			/>
		);
	},
};

/**
 * With a top-level entry selected
 */
export const WithSelection: Story = {
	args: {
		entries: mockEntries,
		value: "1", // Animals
		onValueChange: fn(),
	},
};

/**
 * With a nested entry selected (shows full hierarchy)
 */
export const WithNestedSelection: Story = {
	args: {
		entries: mockEntries,
		value: "1-1-1", // Dogs (Animals → Mammals → Dogs)
		onValueChange: fn(),
	},
};

/**
 * Empty state with no entries
 */
export const Empty: Story = {
	args: {
		entries: [],
		value: null,
		onValueChange: fn(),
		placeholder: "No entries available",
	},
};

/**
 * With allow clear enabled - interactive with state
 */
export const WithClearButton: Story = {
	args: {
		entries: mockEntries,
		value: "1-1-2",
		onValueChange: fn(),
		allowClear: true,
	},
	render: () => {
		const [value, setValue] = useState<string | null>("1-1-2"); // Cats
		return (
			<EntryPicker
				entries={mockEntries}
				value={value}
				onValueChange={setValue}
				allowClear={true}
			/>
		);
	},
};

/**
 * With some entries excluded
 */
export const WithExclusions: Story = {
	args: {
		entries: mockEntries,
		value: null,
		onValueChange: fn(),
		excludeIds: ["1", "2"], // Excludes Animals and Plants
		placeholder: "Select (Animals & Plants excluded)...",
	},
};

/**
 * Custom placeholder text
 */
export const CustomPlaceholder: Story = {
	args: {
		entries: mockEntries,
		value: null,
		onValueChange: fn(),
		placeholder: "Choose a category...",
	},
};

/**
 * Single root entry (no children)
 */
export const SingleEntry: Story = {
	args: {
		entries: [mockEntries[2]], // Geography only
		value: null,
		onValueChange: fn(),
	},
};

/**
 * Flat list (no hierarchy)
 */
export const FlatList: Story = {
	args: {
		entries: mockEntries.filter((e) => e.parentId === null),
		value: null,
		onValueChange: fn(),
		placeholder: "Select from flat list...",
	},
};

/**
 * Long list of entries for testing scroll behavior
 */
export const LongList: Story = {
	args: {
		entries: [
			...mockEntries,
			...Array.from({ length: 20 }, (_, i) => ({
				id: `extra-${i}`,
				indexType: "subject" as const,
				label: `Additional Entry ${i + 1}`,
				parentId: null,
				metadata: {},
			})),
		],
		value: null,
		onValueChange: fn(),
		placeholder: "Select from long list...",
	},
};
