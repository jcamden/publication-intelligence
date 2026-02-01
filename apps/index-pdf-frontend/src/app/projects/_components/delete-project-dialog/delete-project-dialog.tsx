"use client";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@pubint/yabasic/components/ui/alert-dialog";
import { trpc } from "@/app/_common/_utils/trpc";

export type DeleteProjectDialogProps = {
	projectId: string | null;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
};

export const DeleteProjectDialog = ({
	projectId,
	onOpenChange,
	onSuccess,
}: DeleteProjectDialogProps) => {
	const deleteProjectMutation = trpc.project.delete.useMutation();

	const handleDelete = async () => {
		if (!projectId) return;

		try {
			await deleteProjectMutation.mutateAsync({ id: projectId });
			onSuccess();
			onOpenChange(false);
		} catch (error) {
			console.error("Error deleting project:", error);
		}
	};

	return (
		<AlertDialog open={!!projectId} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete Project</AlertDialogTitle>
					<AlertDialogDescription>
						Are you sure you want to delete this project? This will permanently
						delete the project, its document, and all associated index entries.
						This action cannot be undone.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction
						onClick={handleDelete}
						disabled={deleteProjectMutation.isPending}
					>
						{deleteProjectMutation.isPending ? "Deleting..." : "Delete"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};
