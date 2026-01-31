import type { Meta, StoryObj } from "@storybook/react";
import { ProjectSubjectContent } from "../project-subject-content";

const meta: Meta<typeof ProjectSubjectContent> = {
	title: "Components/PDF/PdfEditor/ProjectSidebar/ProjectSubjectContent",
	component: ProjectSubjectContent,
	tags: ["autodocs"],
	parameters: {
		layout: "centered",
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
