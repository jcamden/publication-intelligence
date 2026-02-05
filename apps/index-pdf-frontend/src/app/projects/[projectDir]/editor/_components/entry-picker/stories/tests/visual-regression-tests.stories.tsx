import { defaultGlobals, defaultVrtMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within } from "@storybook/test";
import { mockIndexEntries } from "../../../../_mocks/index-entries";
import type { Mention } from "../../../editor/editor";
import { EntryPicker } from "../../entry-picker";

const mockMentions: Mention[] = [
	{
		id: "m1",
		pageNumber: 1,
		text: "Kant reference",
		bboxes: [{ x: 100, y: 100, width: 200, height: 20 }],
		entryId: "entry-subject-3",
		entryLabel: "Kant, Immanuel",
		indexTypes: ["subject"],
		type: "text",
		createdAt: new Date(),
	},
];

const meta: Meta<typeof EntryPicker> = {
	...defaultVrtMeta,
	title:
		"Projects/[ProjectDir]/Editor/EntryPicker/tests/Visual Regression Tests",
	component: EntryPicker,
	parameters: {
		layout: "centered",
	},
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
 * VRT: Empty state
 */
export const EmptyState: Story = {
	args: {
		indexType: "subject",
		entries: mockIndexEntries,
		mentions: mockMentions,
		onValueChange: () => {},
		onCreateNew: () => {},
	},
	globals: {
		...defaultGlobals,
		viewport: { value: "mobile1", isRotated: true }, // 375x667
	},
};

/**
 * VRT: Filtered results
 */
export const FilteredResults: Story = {
	args: EmptyState.args,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const input = canvas.getByPlaceholderText("Search entries...");
		await userEvent.type(input, "Kant");
	},
	globals: {
		...defaultGlobals,
		viewport: { value: "mobile1", isRotated: true },
	},
};

/**
 * VRT: No matches (create prompt)
 */
export const NoMatches: Story = {
	args: EmptyState.args,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const input = canvas.getByPlaceholderText("Search entries...");
		await userEvent.type(input, "NonExistentEntry");
	},
	globals: {
		...defaultGlobals,
		viewport: { value: "mobile1", isRotated: true },
	},
};
