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

export type DeleteMentionDialogProps = {
	isOpen: boolean;
	onOpenChange: ({ open }: { open: boolean }) => void;
	onConfirm: () => void;
};

/**
 * Confirmation dialog for deleting a mention
 *
 * Warns user that the mention will be removed but the IndexEntry will be kept.
 */
export const DeleteMentionDialog = ({
	isOpen,
	onOpenChange,
	onConfirm,
}: DeleteMentionDialogProps) => {
	const handleConfirm = () => {
		onConfirm();
		onOpenChange({ open: false });
	};

	return (
		<AlertDialog open={isOpen} onOpenChange={(open) => onOpenChange({ open })}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete Highlight</AlertDialogTitle>
					<AlertDialogDescription>
						This will remove the highlight but keep the IndexEntry. This action
						cannot be undone.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction onClick={handleConfirm}>Delete</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};
