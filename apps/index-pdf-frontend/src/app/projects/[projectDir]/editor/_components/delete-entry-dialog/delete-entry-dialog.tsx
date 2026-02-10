"use client";

import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogTitle,
} from "@pubint/yabasic/components/ui/alert-dialog";
import { Button } from "@pubint/yabasic/components/ui/button";
import { toast } from "sonner";
import { useDeleteEntry } from "@/app/_common/_hooks/use-delete-entry";
import type { IndexEntry } from "../../_types/index-entry";

type DeleteEntryDialogProps = {
	entry: IndexEntry;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export const DeleteEntryDialog = ({
	entry,
	open,
	onOpenChange,
}: DeleteEntryDialogProps) => {
	const deleteEntry = useDeleteEntry();

	const handleDelete = () => {
		if (!entry.projectId || !entry.projectIndexTypeId) return;

		deleteEntry.mutate(
			{
				id: entry.id,
				projectId: entry.projectId,
				projectIndexTypeId: entry.projectIndexTypeId,
			},
			{
				onSuccess: () => {
					onOpenChange(false);
					toast.success("Entry deleted");
				},
				onError: (error) => {
					toast.error(`Failed to delete entry: ${error.message}`);
				},
			},
		);
	};

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogTitle>Delete Entry</AlertDialogTitle>
				<AlertDialogDescription>
					Are you sure you want to delete "{entry.label}"? This action cannot be
					undone.
				</AlertDialogDescription>

				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<Button
						variant="destructive"
						onClick={handleDelete}
						disabled={deleteEntry.isPending}
					>
						{deleteEntry.isPending ? "Deleting..." : "Delete"}
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};
