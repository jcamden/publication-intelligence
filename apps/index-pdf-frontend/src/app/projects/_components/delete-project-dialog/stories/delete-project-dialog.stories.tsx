import { Button } from "@pubint/yabasic/components/ui/button";
import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { useState } from "react";
import { DeleteProjectDialog } from "../delete-project-dialog";

const meta = {
	title: "Projects/DeleteProjectDialog",
	component: DeleteProjectDialog,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
} satisfies Meta<typeof DeleteProjectDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: StoryObj<typeof DeleteProjectDialog> = {
	render: () => {
		const [projectId, setProjectId] = useState<string | null>(null);

		return (
			<>
				<Button
					variant="destructive"
					onClick={() => setProjectId("project-123")}
				>
					Delete Project
				</Button>
				<DeleteProjectDialog
					projectId={projectId}
					onOpenChange={(open) => {
						if (!open) setProjectId(null);
					}}
					onSuccess={() => {
						console.log("Project deleted successfully");
						setProjectId(null);
					}}
				/>
			</>
		);
	},
};

export const InitiallyOpen: Story = {
	args: {
		projectId: "project-456",
		onOpenChange: fn(),
		onSuccess: fn(),
	},
};

export const WithDangerousAction: StoryObj<typeof DeleteProjectDialog> = {
	render: () => {
		const [projectId, setProjectId] = useState<string | null>("project-789");

		return (
			<>
				<DeleteProjectDialog
					projectId={projectId}
					onOpenChange={(open) => {
						if (!open) setProjectId(null);
					}}
					onSuccess={() => {
						console.log("Project deleted successfully");
						setProjectId(null);
					}}
				/>
				{!projectId && (
					<div className="space-y-4">
						<p className="text-sm text-muted-foreground">
							Dialog was closed or action completed
						</p>
						<Button
							variant="destructive"
							onClick={() => setProjectId("project-789")}
						>
							Delete Project
						</Button>
					</div>
				)}
			</>
		);
	},
	parameters: {
		docs: {
			description: {
				story:
					"Destructive action dialog with clear warning about permanent deletion",
			},
		},
	},
};

export const WarningMessage: Story = {
	args: {
		projectId: "project-warning",
		onOpenChange: fn(),
		onSuccess: fn(),
	},
	parameters: {
		docs: {
			description: {
				story:
					"Dialog displays a clear warning that this action will permanently delete the project, its document, and all associated index entries",
			},
		},
	},
};
