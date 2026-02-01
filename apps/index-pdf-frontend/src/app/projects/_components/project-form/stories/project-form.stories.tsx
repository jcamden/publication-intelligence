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

const mockExistingProjects = [
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

export const WithExistingProjects: StoryObj<typeof meta> = {
	args: {
		onSuccess: fn(),
		onCancel: fn(),
		existingProjects: mockExistingProjects,
	},
	parameters: {
		docs: {
			description: {
				story:
					"Form with existing projects that will trigger duplicate validation if you try to use the same title or project_dir",
			},
		},
	},
};

export const EmptyState: StoryObj<typeof meta> = {
	args: {
		onSuccess: fn(),
		onCancel: fn(),
		existingProjects: [],
	},
	parameters: {
		docs: {
			description: {
				story:
					"Empty form waiting for user input. Try entering a title and watch the project_dir auto-populate",
			},
		},
	},
};

export const WithFileSelected: StoryObj<typeof meta> = {
	render: (args) => <ProjectForm {...args} />,
	args: {
		onSuccess: fn(),
		onCancel: fn(),
		existingProjects: [],
	},
	parameters: {
		docs: {
			description: {
				story:
					"Upload a PDF file to see the thumbnail preview and enable the submit button",
			},
		},
	},
};

export const FormLayoutDesktop: StoryObj<typeof meta> = {
	render: (args) => (
		<div className="w-full max-w-[900px]">
			<ProjectForm {...args} />
		</div>
	),
	args: {
		onSuccess: fn(),
		onCancel: fn(),
		existingProjects: [],
	},
	parameters: {
		viewport: {
			defaultViewport: "desktop",
		},
		docs: {
			description: {
				story:
					"Desktop layout with two columns: PDF upload/preview on left, form fields on right",
			},
		},
	},
};
