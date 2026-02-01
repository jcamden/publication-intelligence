import { Button } from "@pubint/yabasic/components/ui/button";
import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { useState } from "react";
import { TrpcDecorator } from "../../../../storybook-utils/trpc-decorator";
import { DeleteProjectDialog } from "../delete-project-dialog";

const meta = {
	title: "UI/Projects/DeleteProjectDialog",
	component: DeleteProjectDialog,
	decorators: [
		(Story) => (
			<TrpcDecorator>
				<Story />
			</TrpcDecorator>
		),
	],
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

export const LoadingState: StoryObj<typeof DeleteProjectDialog> = {
	render: () => {
		const [projectId, setProjectId] = useState<string | null>(
			"project-loading",
		);
		const [isLoading, setIsLoading] = useState(false);

		return (
			<>
				<DeleteProjectDialog
					projectId={projectId}
					onOpenChange={(open) => {
						if (!open && !isLoading) setProjectId(null);
					}}
					onSuccess={() => {
						console.log("Project deleted successfully");
						setIsLoading(false);
						setProjectId(null);
					}}
				/>
				{!projectId && (
					<Button
						variant="destructive"
						onClick={() => setProjectId("project-loading")}
					>
						Delete Project (Loading State)
					</Button>
				)}
			</>
		);
	},
	parameters: {
		docs: {
			description: {
				story: "Click Delete to see the loading state on the action button",
			},
		},
	},
};

export const CancelAction: StoryObj<typeof DeleteProjectDialog> = {
	render: () => {
		const [projectId, setProjectId] = useState<string | null>("project-cancel");
		const [wasCancelled, setWasCancelled] = useState(false);

		return (
			<>
				<DeleteProjectDialog
					projectId={projectId}
					onOpenChange={(open) => {
						if (!open) {
							setProjectId(null);
							setWasCancelled(true);
							setTimeout(() => setWasCancelled(false), 2000);
						}
					}}
					onSuccess={() => {
						console.log("Project deleted successfully");
						setProjectId(null);
					}}
				/>
				{!projectId && (
					<div className="space-y-4">
						{wasCancelled && (
							<div className="rounded-md bg-blue-50 p-4 text-sm text-blue-800">
								Deletion was cancelled
							</div>
						)}
						<Button
							variant="destructive"
							onClick={() => setProjectId("project-cancel")}
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
					"Click Cancel to see the dialog close without performing the deletion",
			},
		},
	},
};

export const SuccessFlow: StoryObj<typeof DeleteProjectDialog> = {
	render: () => {
		const [projectId, setProjectId] = useState<string | null>(null);
		const [successMessage, setSuccessMessage] = useState("");

		return (
			<>
				<div className="space-y-4">
					<Button
						variant="destructive"
						onClick={() => setProjectId("project-success")}
					>
						Delete Project
					</Button>
					{successMessage && (
						<div className="rounded-md bg-green-50 p-4 text-sm text-green-800">
							{successMessage}
						</div>
					)}
				</div>
				<DeleteProjectDialog
					projectId={projectId}
					onOpenChange={(open) => {
						if (!open) setProjectId(null);
					}}
					onSuccess={() => {
						setSuccessMessage(
							"Project deleted successfully! All associated data has been removed.",
						);
						setTimeout(() => setSuccessMessage(""), 3000);
					}}
				/>
			</>
		);
	},
	parameters: {
		docs: {
			description: {
				story:
					"Complete success flow: open dialog → confirm deletion → see success message",
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

export const KeyboardNavigation: StoryObj<typeof DeleteProjectDialog> = {
	render: () => {
		const [projectId, setProjectId] = useState<string | null>("project-kbd");

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
						<Button
							variant="destructive"
							onClick={() => setProjectId("project-kbd")}
						>
							Delete Project
						</Button>
						<p className="text-sm text-muted-foreground">
							Try keyboard navigation: Tab to move between buttons, Enter to
							select, ESC to cancel
						</p>
					</div>
				)}
			</>
		);
	},
	parameters: {
		docs: {
			description: {
				story: "Dialog supports full keyboard navigation and ESC to cancel",
			},
		},
	},
};
