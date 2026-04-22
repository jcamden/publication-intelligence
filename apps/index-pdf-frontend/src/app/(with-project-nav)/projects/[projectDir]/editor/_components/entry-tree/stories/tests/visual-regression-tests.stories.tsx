import { defaultGlobals, defaultVrtMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { within } from "storybook/test";
import { mockSubjectEntries } from "../../../../_mocks/mock-index-entries";
import type { Mention } from "../../../editor/editor";
import { EntryTree } from "../../entry-tree";
import { expandAllNodes } from "../helpers/steps";

const mockMentions: Mention[] = [
	{
		id: "m1",
		pageNumber: 1,
		text: "Kant reference",
		bboxes: [{ x: 100, y: 100, width: 200, height: 20 }],
		entryId: "entry-subject-3",
		entryLabel: "Kant, Immanuel",
		indexType: "subject",
		type: "text",
		createdAt: new Date(),
	},
];

const meta: Meta<typeof EntryTree> = {
	...defaultVrtMeta,
	title: "Projects/[ProjectDir]/Editor/EntryTree/tests/Visual Regression Tests",
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

/**
 * VRT: Nested hierarchy
 */
export const NestedHierarchy: Story = {
	args: {
		entries: mockSubjectEntries,
		mentions: mockMentions,
	},
	globals: {
		...defaultGlobals,
		viewport: { value: "mobile1" },
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		await expandAllNodes({ canvas, step });
	},
};
