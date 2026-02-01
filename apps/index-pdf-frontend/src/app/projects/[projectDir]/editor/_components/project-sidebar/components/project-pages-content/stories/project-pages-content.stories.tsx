import type { Meta, StoryObj } from "@storybook/react";
import { ProjectPagesContent } from "../project-pages-content";

const meta: Meta<typeof ProjectPagesContent> = {
	title: "Projects/[ProjectDir]/Editor/ProjectSidebar/ProjectPagesContent",
	component: ProjectPagesContent,
	tags: ["autodocs"],
	parameters: {
		layout: "centered",
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
