import type { Meta, StoryObj } from "@storybook/react";
import { PageContextsContent } from "../page-contexts-content";

const meta: Meta<typeof PageContextsContent> = {
	title: "Projects/[ProjectDir]/Editor/PageSidebar/PageContextsContent",
	component: PageContextsContent,
	tags: ["autodocs"],
	parameters: {
		layout: "centered",
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockMentions = [
	{
		id: "mention-1",
		text: "This is an example text mention",
		entryLabel: "Background Context",
		type: "text" as const,
	},
	{
		id: "mention-2",
		text: "Historical context description",
		entryLabel: "Historical Background",
		type: "region" as const,
	},
	{
		id: "mention-3",
		text: "Another context mention",
		entryLabel: "Cultural Context",
		type: "text" as const,
	},
];

export const Default: Story = {
	args: {
		mentions: mockMentions,
		onMentionClick: ({ mentionId }: { mentionId: string }) => {
			console.log("Mention clicked:", mentionId);
		},
	},
};

export const Empty: Story = {
	args: {
		mentions: [],
		onMentionClick: ({ mentionId }: { mentionId: string }) => {
			console.log("Mention clicked:", mentionId);
		},
	},
};
