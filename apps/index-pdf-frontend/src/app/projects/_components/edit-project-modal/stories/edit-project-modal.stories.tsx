import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { TrpcDecorator } from "@/app/_common/_test-utils/storybook-utils/trpc-decorator";
import { EditProjectModal } from "../edit-project-modal";

const meta = {
	title: "Projects/EditProjectModal",
	component: EditProjectModal,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
} satisfies Meta<typeof EditProjectModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		open: true,
		onOpenChange: fn(),
		onSuccess: fn(),
		projectId: "project-123",
		existingProjects: [
			{ project_dir: "existing-project-1", title: "Existing Project 1" },
			{ project_dir: "existing-project-2", title: "Existing Project 2" },
		],
	},
};

export const WithLoadingState: Story = {
	args: {
		open: true,
		onOpenChange: fn(),
		onSuccess: fn(),
		projectId: "project-loading",
		existingProjects: [],
	},
	decorators: [
		(Story) => (
			<TrpcDecorator config={{ delayMs: 10000 }}>
				<Story />
			</TrpcDecorator>
		),
	],
	parameters: {
		docs: {
			description: {
				story:
					"Shows loading spinner while fetching project data. Story uses a 10s delay to keep the loading state visible.",
			},
		},
	},
};
