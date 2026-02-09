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
import { Input } from "@pubint/yabasic/components/ui/input";
import { useEffect, useState } from "react";
import { useDebouncedValue } from "@/app/_common/_hooks/use-debounced-value";
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
	const [confirmationText, setConfirmationText] = useState("");
	const debouncedConfirmationText = useDebouncedValue({
		value: confirmationText,
		delay: 150,
	});

	const deleteProjectMutation = trpc.project.delete.useMutation();

	// Fetch project details to get the title
	const projectQuery = trpc.project.getById.useQuery(
		{ id: projectId ?? "" },
		{ enabled: !!projectId },
	);

	// Reset confirmation text when dialog opens/closes
	useEffect(() => {
		if (!projectId) {
			setConfirmationText("");
		}
	}, [projectId]);

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

	const projectTitle = projectQuery.data?.title ?? "";
	const isConfirmationValid = debouncedConfirmationText === projectTitle;

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

				{/* Confirmation Input */}
				<div className="space-y-2 py-4">
					<p className="text-sm text-muted-foreground">
						To confirm deletion, please type the project name:{" "}
						<span className="font-semibold text-foreground">
							{projectTitle}
						</span>
					</p>
					<Input
						value={confirmationText}
						onChange={(e) => setConfirmationText(e.target.value)}
						placeholder="Type project name to confirm"
						autoComplete="off"
						disabled={deleteProjectMutation.isPending}
					/>
				</div>

				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction
						onClick={handleDelete}
						disabled={
							deleteProjectMutation.isPending ||
							!isConfirmationValid ||
							!projectTitle
						}
						variant="destructive"
					>
						{deleteProjectMutation.isPending ? "Deleting..." : "Delete"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};
