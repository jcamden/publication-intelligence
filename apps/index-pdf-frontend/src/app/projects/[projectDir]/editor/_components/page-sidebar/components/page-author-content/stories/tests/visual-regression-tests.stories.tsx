import {
	defaultGlobals,
	visualRegressionTestConfig,
} from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { PageAuthorContent } from "../../page-author-content";

const meta: Meta<typeof PageAuthorContent> = {
	title:
		"Projects/[ProjectDir]/Editor/PageSidebar/PageAuthorContent/tests/Visual Regression Tests",
	component: PageAuthorContent,
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
		entryLabel: "Author → Kant, Immanuel",
		entryId: "entry-1",
		indexTypes: ["author"],
	},
	{
		id: "2",
		pageNumber: 1,
		text: "Another mention on the same page",
		entryLabel: "Author → Heidegger, Martin",
		entryId: "entry-2",
		indexTypes: ["author"],
	},
];

export const LightMode: Story = {
	args: {
		activeAction: { type: null, indexType: null },
		onSelectText: fn(),
		onDrawRegion: fn(),
		mentions: mockMentions,
		onMentionClick: fn(),
	},
	globals: {
		...defaultGlobals,
	},
};

export const DarkMode: Story = {
	args: {
		activeAction: { type: null, indexType: null },
		onSelectText: fn(),
		onDrawRegion: fn(),
		mentions: mockMentions,
		onMentionClick: fn(),
	},
	globals: {
		...defaultGlobals,
		theme: "dark",
	},
};
