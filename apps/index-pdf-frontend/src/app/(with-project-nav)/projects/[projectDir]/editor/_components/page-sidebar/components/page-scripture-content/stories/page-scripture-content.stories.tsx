import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { PageScriptureContent } from "../page-scripture-content";

const meta: Meta<typeof PageScriptureContent> = {
	title: "Projects/[ProjectDir]/Editor/PageSidebar/PageScriptureContent",
	component: PageScriptureContent,
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
		entryLabel: "Scripture → Matthew 5:3",
		entryId: "entry-1",
		indexType: "scripture",
		type: "text" as const,
	},
	{
		id: "2",
		pageNumber: 1,
		text: "Another mention on the same page",
		entryLabel: "Scripture → John 3:16",
		entryId: "entry-2",
		indexType: "scripture",
		type: "text" as const,
	},
];

export const Default: Story = {
	args: {
		mentions: mockMentions,
		onMentionClick: fn(),
	},
};
