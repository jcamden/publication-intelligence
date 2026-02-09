import { Button } from "@pubint/yabasic/components/ui/button";
import type { Meta, StoryObj } from "@storybook/react";
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
