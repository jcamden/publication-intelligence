import type { Meta, StoryObj } from "@storybook/react";
import { ProjectAuthorContent } from "../project-author-content";

const meta: Meta<typeof ProjectAuthorContent> = {
	title: "Components/PDF/PdfEditor/ProjectSidebar/ProjectAuthorContent",
	component: ProjectAuthorContent,
	tags: ["autodocs"],
	parameters: {
		layout: "centered",
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
