import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { ProjectForm } from "../project-form";

const meta = {
	title: "Projects/ProjectForm",
	component: ProjectForm,
	parameters: {
		layout: "padded",
	},
	tags: ["autodocs"],
} satisfies Meta<typeof ProjectForm>;

export default meta;
type Story = StoryObj<typeof meta>;

const _mockExistingProjects = [
	{ project_dir: "existing-project-1", title: "Existing Project 1" },
	{ project_dir: "existing-project-2", title: "Existing Project 2" },
	{ project_dir: "test-project", title: "Test Project" },
];

export const Default: Story = {
	args: {
		onSuccess: fn(),
		onCancel: fn(),
		existingProjects: [],
	},
};
