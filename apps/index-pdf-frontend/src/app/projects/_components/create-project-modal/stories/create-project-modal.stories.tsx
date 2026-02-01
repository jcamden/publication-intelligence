import { Button } from "@pubint/yabasic/components/ui/button";
import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { useState } from "react";
import { CreateProjectModal } from "../create-project-modal";

const meta = {
	title: "Projects/CreateProjectModal",
	component: CreateProjectModal,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
} satisfies Meta<typeof CreateProjectModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: StoryObj<typeof CreateProjectModal> = {
	render: () => {
		const [open, setOpen] = useState(false);

		return (
			<>
				<Button onClick={() => setOpen(true)}>Open Create Project Modal</Button>
				<CreateProjectModal
					open={open}
					onOpenChange={setOpen}
					onSuccess={() => {
						console.log("Project created successfully");
						setOpen(false);
					}}
					existingProjects={[]}
				/>
			</>
		);
	},
};

export const WithExistingProjects: StoryObj<typeof CreateProjectModal> = {
	render: () => {
		const [open, setOpen] = useState(false);
		const existingProjects = [
			{ project_dir: "wbc-daniel", title: "Word Biblical Commentary: Daniel" },
			{
				project_dir: "nicot-isaiah",
				title: "New International Commentary: Isaiah",
			},
			{ project_dir: "study-bible", title: "NIV Study Bible" },
		];

		return (
			<>
				<Button onClick={() => setOpen(true)}>Open Modal</Button>
				<CreateProjectModal
					open={open}
					onOpenChange={setOpen}
					onSuccess={() => {
						console.log("Project created successfully");
						setOpen(false);
					}}
					existingProjects={existingProjects}
				/>
			</>
		);
	},
	parameters: {
		docs: {
			description: {
				story:
					"Modal with existing projects that will trigger duplicate validation",
			},
		},
	},
};

export const InitiallyOpen: Story = {
	args: {
		open: true,
		onOpenChange: fn(),
		onSuccess: fn(),
		existingProjects: [],
	},
};

export const LargeModal: StoryObj<typeof CreateProjectModal> = {
	render: () => {
		const [open, setOpen] = useState(false);

		return (
			<>
				<Button onClick={() => setOpen(true)}>Open Large Modal</Button>
				<CreateProjectModal
					open={open}
					onOpenChange={setOpen}
					onSuccess={() => {
						console.log("Project created successfully");
					}}
					existingProjects={[]}
				/>
			</>
		);
	},
	parameters: {
		viewport: {
			defaultViewport: "desktop",
		},
		docs: {
			description: {
				story:
					"Modal is sized 2xl to accommodate the two-column layout with PDF preview",
			},
		},
	},
};
