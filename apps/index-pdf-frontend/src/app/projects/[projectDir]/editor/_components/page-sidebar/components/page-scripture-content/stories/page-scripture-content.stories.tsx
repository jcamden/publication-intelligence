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

export const Default: Story = {
	args: {
		activeAction: { type: null, indexType: null },
		onSelectText: fn(),
		onDrawRegion: fn(),
	},
};
