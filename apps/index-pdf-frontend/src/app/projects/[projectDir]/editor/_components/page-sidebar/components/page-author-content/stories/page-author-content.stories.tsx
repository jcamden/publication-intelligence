import type { Meta, StoryObj } from "@storybook/react";
import { PageAuthorContent } from "../page-author-content";

const meta: Meta<typeof PageAuthorContent> = {
	title: "Projects/[ProjectDir]/Editor/PageSidebar/PageAuthorContent",
	component: PageAuthorContent,
	tags: ["autodocs"],
	parameters: {
		layout: "centered",
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
