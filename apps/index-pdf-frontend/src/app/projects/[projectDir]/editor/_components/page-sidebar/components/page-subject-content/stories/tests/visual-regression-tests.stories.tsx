import {
	defaultGlobals,
	visualRegressionTestConfig,
} from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { PageSubjectContent } from "../../page-subject-content";

const meta: Meta<typeof PageSubjectContent> = {
	title:
		"Projects/[ProjectDir]/Editor/PageSidebar/PageSubjectContent/tests/Visual Regression Tests",
	component: PageSubjectContent,
	parameters: {
		...visualRegressionTestConfig,
		layout: "centered",
	},
	tags: ["visual-regression"],
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
		type: "text" as const,
	},
	{
		id: "2",
		pageNumber: 1,
		text: "Another mention on the same page",
		entryLabel: "Philosophy → Heidegger",
		entryId: "entry-2",
		indexTypes: ["subject"],
		type: "text" as const,
	},
];

export const LightMode: Story = {
	args: {
		mentions: mockMentions,
		onMentionClick: fn(),
	},
	globals: {
		...defaultGlobals,
	},
};

export const DarkMode: Story = {
	args: {
		mentions: mockMentions,
		onMentionClick: fn(),
	},
	globals: {
		...defaultGlobals,
		theme: "dark",
	},
};
