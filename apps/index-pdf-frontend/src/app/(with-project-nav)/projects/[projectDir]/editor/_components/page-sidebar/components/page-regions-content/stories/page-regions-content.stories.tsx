import type { Meta, StoryObj } from "@storybook/react";
import { PageRegionsContent } from "../page-regions-content";

const meta: Meta<typeof PageRegionsContent> = {
	title: "Projects/[ProjectDir]/Editor/PageSidebar/PageRegionsContent",
	component: PageRegionsContent,
	tags: ["autodocs"],
	parameters: {
		layout: "centered",
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		currentPage: 1,
	},
};

export const DifferentPage: Story = {
	args: {
		currentPage: 5,
	},
};
