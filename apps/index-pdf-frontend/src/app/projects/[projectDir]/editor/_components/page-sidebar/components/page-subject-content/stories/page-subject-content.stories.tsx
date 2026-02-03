import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { PageSubjectContent } from "../page-subject-content";

const meta: Meta<typeof PageSubjectContent> = {
	title: "Projects/[ProjectDir]/Editor/PageSidebar/PageSubjectContent",
	component: PageSubjectContent,
	tags: ["autodocs"],
	parameters: {
		layout: "centered",
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockMentions = [
	{
		id: "1",
		pageNumber: 1,
		text: "This is a sample mention text",
		entryLabel: "Philosophy → Kant",
		entryId: "entry-1",
		indexTypes: ["subject"],
	},
	{
		id: "2",
		pageNumber: 1,
		text: "Another mention on the same page",
		entryLabel: "Philosophy → Heidegger",
		entryId: "entry-2",
		indexTypes: ["subject"],
	},
];

export const Default: Story = {
	args: {
		activeAction: { type: null, indexType: null },
		onSelectText: fn(),
		onDrawRegion: fn(),
		mentions: mockMentions,
		onMentionClick: fn(),
	},
};
