import { defaultInteractionTestMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { within } from "storybook/test";
import { mockSubjectEntries } from "../../../../_mocks/mock-index-entries";
import { mockMentions } from "../../../../_mocks/mock-mentions";
import { EntryTree } from "../../entry-tree";
import { emptyStateShowsMessage, expandCollapseNodes } from "../helpers/steps";

const meta: Meta<typeof EntryTree> = {
	...defaultInteractionTestMeta,
	title: "Projects/[ProjectDir]/Editor/EntryTree/tests/Interaction Tests",
	component: EntryTree,
	parameters: {
		layout: "padded",
	},
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

export const ExpandCollapseNodes: Story = {
	args: {
		entries: mockSubjectEntries,
		mentions: mockMentions,
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		await expandCollapseNodes({ canvas, step });
	},
};

export const EmptyStateShowsMessage: Story = {
	args: {
		entries: [],
		mentions: [],
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		await emptyStateShowsMessage({ canvas, step });
	},
};
