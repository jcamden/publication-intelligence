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
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useDeleteEntry } from "@/app/_common/_hooks/use-delete-entry";
import type { IndexEntry } from "../../_types/index-entry";
import {
	EntryRelationshipInfoModal,
	shouldShowEntryRelationshipInfo,
} from "../entry-relationship-info-modal/entry-relationship-info-modal";

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
	const [showInfoModal, setShowInfoModal] = useState(false);
	const [showConfirmDialog, setShowConfirmDialog] = useState(false);

	useEffect(() => {
		if (open) {
			if (shouldShowEntryRelationshipInfo()) {
				setShowInfoModal(true);
				setShowConfirmDialog(false);
			} else {
				setShowInfoModal(false);
				setShowConfirmDialog(true);
			}
		}
	}, [open]);

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
					setShowConfirmDialog(false);
					onOpenChange(false);
					toast.success("Entry deleted");
				},
				onError: (error) => {
					toast.error(`Failed to delete entry: ${error.message}`);
				},
			},
		);
	};

	const handleInfoContinue = () => {
		setShowInfoModal(false);
		setShowConfirmDialog(true);
	};

	const handleCancel = () => {
		setShowInfoModal(false);
		setShowConfirmDialog(false);
		onOpenChange(false);
	};

	return (
		<>
			<EntryRelationshipInfoModal
				open={showInfoModal}
				onOpenChange={setShowInfoModal}
				onContinue={handleInfoContinue}
			/>
			<AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
				<AlertDialogContent>
					<AlertDialogTitle>Delete Entry</AlertDialogTitle>
					<AlertDialogDescription>
						Are you sure you want to delete "{entry.label}"? This action cannot
						be undone.
					</AlertDialogDescription>

					<AlertDialogFooter>
						<AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
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
		</>
	);
};
