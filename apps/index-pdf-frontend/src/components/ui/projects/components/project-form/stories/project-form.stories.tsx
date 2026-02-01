import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { TrpcDecorator } from "../../../../storybook-utils/trpc-decorator";
import { ProjectForm } from "../project-form";

const meta = {
	title: "UI/Projects/ProjectForm",
	component: ProjectForm,
	decorators: [
		(Story) => (
			<TrpcDecorator>
				<Story />
			</TrpcDecorator>
		),
	],
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

export const WithLongTitle: StoryObj<typeof meta> = {
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
					"Type a long title to see how it automatically converts to a kebab-case project_dir",
			},
		},
	},
};

export const ValidationErrors: StoryObj<typeof meta> = {
	render: (args) => <ProjectForm {...args} />,
	args: {
		onSuccess: fn(),
		onCancel: fn(),
		existingProjects: mockExistingProjects,
	},
	parameters: {
		docs: {
			description: {
				story:
					"Try these to trigger validation errors:\n- Leave title empty and submit\n- Use 'existing-project-1' as project_dir\n- Use 'Existing Project 1' as title\n- Use special characters in project_dir\n- Exceed 500 characters in title\n- Exceed 2000 characters in description",
			},
		},
	},
};

export const DuplicateProjectDir: StoryObj<typeof meta> = {
	render: (args) => <ProjectForm {...args} />,
	args: {
		onSuccess: fn(),
		onCancel: fn(),
		existingProjects: [
			{ project_dir: "my-project", title: "My Project" },
			{ project_dir: "another-project", title: "Another Project" },
		],
	},
	parameters: {
		docs: {
			description: {
				story:
					"Try entering 'my-project' as the project_dir to see duplicate validation error",
			},
		},
	},
};

export const DuplicateTitle: StoryObj<typeof meta> = {
	render: (args) => <ProjectForm {...args} />,
	args: {
		onSuccess: fn(),
		onCancel: fn(),
		existingProjects: [
			{ project_dir: "commentary-daniel", title: "Commentary on Daniel" },
		],
	},
	parameters: {
		docs: {
			description: {
				story:
					"Try entering 'Commentary on Daniel' as the title to see duplicate validation error (case-insensitive)",
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

export const AutoPopulateProjectDir: StoryObj<typeof meta> = {
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
					"Type in the title field and watch the project_dir automatically populate with a kebab-case version. Manual edits to project_dir will stop auto-population.",
			},
		},
	},
};

export const CompleteWorkflow: StoryObj<typeof meta> = {
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
					"Complete workflow:\n1. Upload a PDF file\n2. Enter a title\n3. Add a description (optional)\n4. Review or edit the auto-generated project_dir\n5. Submit the form",
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

export const SpecialCharactersInTitle: Story = {
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
					"Try entering titles with special characters like 'Word Biblical Commentary: Daniel (Volume 30)' and watch how they're converted to valid project_dir format",
			},
		},
	},
};

export const MaxLengthValidation: Story = {
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
					"Try exceeding the character limits:\n- Title: 500 characters\n- Description: 2000 characters\n- Project Dir: 100 characters",
			},
		},
	},
};
