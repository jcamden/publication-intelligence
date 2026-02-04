import {
	defaultGlobals,
	visualRegressionTestConfig,
} from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { PageScriptureContent } from "../../page-scripture-content";

const meta: Meta<typeof PageScriptureContent> = {
	title:
		"Projects/[ProjectDir]/Editor/PageSidebar/PageScriptureContent/tests/Visual Regression Tests",
	component: PageScriptureContent,
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
		entryLabel: "Scripture → Matthew 5:3",
		entryId: "entry-1",
		indexTypes: ["scripture"],
		type: "text" as const,
	},
	{
		id: "2",
		pageNumber: 1,
		text: "Another mention on the same page",
		entryLabel: "Scripture → John 3:16",
		entryId: "entry-2",
		indexTypes: ["scripture"],
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
