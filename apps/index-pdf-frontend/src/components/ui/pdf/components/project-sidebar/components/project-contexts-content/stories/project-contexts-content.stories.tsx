import type { Meta, StoryObj } from "@storybook/react";
import { ProjectContextsContent } from "../project-contexts-content";

const meta: Meta<typeof ProjectContextsContent> = {
	title: "Components/PDF/PdfEditor/ProjectSidebar/ProjectContextsContent",
	component: ProjectContextsContent,
	tags: ["autodocs"],
	parameters: {
		layout: "centered",
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
