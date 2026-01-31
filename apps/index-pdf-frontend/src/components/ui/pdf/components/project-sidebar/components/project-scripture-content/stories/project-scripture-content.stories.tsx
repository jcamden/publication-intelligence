import type { Meta, StoryObj } from "@storybook/react";
import { ProjectScriptureContent } from "../project-scripture-content";

const meta: Meta<typeof ProjectScriptureContent> = {
	title: "Components/PDF/PdfEditor/ProjectSidebar/ProjectScriptureContent",
	component: ProjectScriptureContent,
	tags: ["autodocs"],
	parameters: {
		layout: "centered",
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
