import { Button } from "@pubint/yabasic/components/ui/button";
import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { useState } from "react";
import { CreateProjectModal } from "../create-project-modal";

const meta = {
	title: "UI/Projects/CreateProjectModal",
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

export const CloseOnBackdrop: StoryObj<typeof CreateProjectModal> = {
	render: () => {
		const [open, setOpen] = useState(false);

		return (
			<>
				<Button onClick={() => setOpen(true)}>Open Modal</Button>
				<CreateProjectModal
					open={open}
					onOpenChange={setOpen}
					onSuccess={() => {
						console.log("Project created successfully");
					}}
					existingProjects={[]}
				/>
				<p className="mt-4 text-sm text-muted-foreground">
					Click the backdrop or press ESC to close
				</p>
			</>
		);
	},
};

export const WithFormValidation: StoryObj<typeof CreateProjectModal> = {
	render: () => {
		const [open, setOpen] = useState(true);
		const existingProjects = [
			{ project_dir: "existing-project", title: "Existing Project" },
		];

		return (
			<CreateProjectModal
				open={open}
				onOpenChange={setOpen}
				onSuccess={() => {
					console.log("Project created successfully");
				}}
				existingProjects={existingProjects}
			/>
		);
	},
	parameters: {
		docs: {
			description: {
				story:
					"Try various validation scenarios:\n- Submit without a file\n- Use duplicate project_dir or title\n- Enter invalid characters in project_dir",
			},
		},
	},
};

export const CompleteFlow: StoryObj<typeof CreateProjectModal> = {
	render: () => {
		const [open, setOpen] = useState(false);
		const [successMessage, setSuccessMessage] = useState("");

		return (
			<div className="space-y-4">
				<Button onClick={() => setOpen(true)}>Create New Project</Button>
				{successMessage && (
					<div className="rounded-md bg-green-50 p-4 text-sm text-green-800">
						{successMessage}
					</div>
				)}
				<CreateProjectModal
					open={open}
					onOpenChange={setOpen}
					onSuccess={() => {
						setSuccessMessage("Project created successfully!");
						setTimeout(() => setSuccessMessage(""), 3000);
					}}
					existingProjects={[]}
				/>
			</div>
		);
	},
	parameters: {
		docs: {
			description: {
				story:
					"Complete flow:\n1. Click button to open modal\n2. Fill out form\n3. Submit\n4. See success message\n5. Modal closes automatically",
			},
		},
	},
};

export const CancelAction: StoryObj<typeof CreateProjectModal> = {
	render: () => {
		const [open, setOpen] = useState(true);

		return (
			<CreateProjectModal
				open={open}
				onOpenChange={(isOpen) => {
					setOpen(isOpen);
					if (!isOpen) {
						console.log("Modal cancelled/closed");
					}
				}}
				onSuccess={() => {
					console.log("Project created successfully");
				}}
				existingProjects={[]}
			/>
		);
	},
	parameters: {
		docs: {
			description: {
				story:
					"Click the Cancel button or close via backdrop/ESC to trigger the onOpenChange callback",
			},
		},
	},
};
