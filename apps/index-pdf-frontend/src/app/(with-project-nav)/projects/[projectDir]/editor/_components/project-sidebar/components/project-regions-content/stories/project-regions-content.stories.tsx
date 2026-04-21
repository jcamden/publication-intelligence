import type { Meta, StoryObj } from "@storybook/react";
import { ProjectRegionsContent } from "../project-regions-content";

const meta: Meta<typeof ProjectRegionsContent> = {
	title: "Projects/[ProjectDir]/Editor/ProjectSidebar/ProjectRegionsContent",
	component: ProjectRegionsContent,
	tags: ["autodocs"],
	parameters: {
		layout: "centered",
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
