import type { Meta, StoryObj } from "@storybook/react";
import { ProjectBiblioContent } from "../project-biblio-content";

const meta: Meta<typeof ProjectBiblioContent> = {
	title: "Projects/[ProjectDir]/Editor/ProjectSidebar/ProjectBiblioContent",
	component: ProjectBiblioContent,
	tags: ["autodocs"],
	parameters: {
		layout: "centered",
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
