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
import { Button } from "@pubint/yabasic/components/ui/button";
import { Spinner } from "@pubint/yabasic/components/ui/spinner";
import { Modal } from "@pubint/yaboujee";
import { Merge, Trash2, Ungroup } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/app/_common/_trpc/client";

export type DeleteGroupOption =
	| "remove_entries" // Remove entries from group, delete group (default)
	| "delete_entries" // Delete entries along with group
	| "merge"; // Merge into another group

export type DeleteGroupDialogProps = {
	groupId: string;
	projectId: string;
	projectIndexTypeId: string;
	groups: Array<{ id: string; name: string }>;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** When user selects merge, close this dialog and open merge modal. Parent should set mergingGroup. */
	onMergeGroup?: (groupId: string) => void;
};

export const DeleteGroupDialog = ({
	groupId,
	projectId,
	projectIndexTypeId,
	groups,
	open,
	onOpenChange,
	onMergeGroup,
}: DeleteGroupDialogProps) => {
	const [selectedOption, setSelectedOption] =
		useState<DeleteGroupOption>("remove_entries");
	const [showConfirmDialog, setShowConfirmDialog] = useState(false);

	const utils = trpc.useUtils();
	const { data: group } = trpc.detection.getIndexEntryGroup.useQuery(
		{ groupId },
		{ enabled: open && !!groupId },
	);

	const deleteGroup = trpc.detection.deleteIndexEntryGroup.useMutation({
		onSuccess: () => {
			toast.success("Group deleted");
			utils.detection.listIndexEntryGroups.invalidate({
				projectId,
				projectIndexTypeId,
			});
			utils.indexEntry.listLean.invalidate({ projectId });
			utils.indexMention.list.invalidate();
			setShowConfirmDialog(false);
			onOpenChange(false);
		},
		onError: (error) => {
			toast.error(`Failed to delete group: ${error.message}`);
		},
	});

	const handleProceed = useCallback(() => {
		if (selectedOption === "merge") {
			onOpenChange(false);
			onMergeGroup?.(groupId);
			return;
		}
		setShowConfirmDialog(true);
	}, [selectedOption, groupId, onMergeGroup, onOpenChange]);

	const handleConfirmDelete = useCallback(() => {
		deleteGroup.mutate({
			groupId,
			deleteEntries: selectedOption === "delete_entries",
		});
	}, [groupId, selectedOption, deleteGroup]);

	const handleClose = useCallback(() => {
		setSelectedOption("remove_entries");
		setShowConfirmDialog(false);
		onOpenChange(false);
	}, [onOpenChange]);

	const otherGroups = groups.filter((g) => g.id !== groupId);
	const canMerge = otherGroups.length > 0;

	return (
		<>
			<Modal
				open={open}
				onClose={handleClose}
				title={`Delete group: ${group?.name ?? "..."}`}
				size="md"
				footer={
					<>
						<Button variant="outline" onClick={handleClose}>
							Cancel
						</Button>
						<Button
							variant="default"
							onClick={handleProceed}
							disabled={(selectedOption === "merge" && !canMerge) || !group}
						>
							{selectedOption === "merge" ? "Merge Group" : "Continue"}
						</Button>
					</>
				}
			>
				<div className="space-y-4">
					<p className="text-sm text-neutral-600 dark:text-neutral-400">
						What would you like to do with &quot;{group?.name ?? "..."}&quot;?
					</p>

					<div className="space-y-2">
						<label
							className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
								selectedOption === "remove_entries"
									? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/30"
									: "border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
							}`}
						>
							<input
								type="radio"
								name="delete-option"
								checked={selectedOption === "remove_entries"}
								onChange={() => setSelectedOption("remove_entries")}
								className="mt-1"
							/>
							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-2 font-medium">
									<Ungroup className="h-4 w-4 shrink-0" />
									Remove entries and delete group
								</div>
								<p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
									Entries will not be deleted; they will no longer belong to
									this group. (Default)
								</p>
							</div>
						</label>

						<label
							className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
								selectedOption === "delete_entries"
									? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/30"
									: "border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
							}`}
						>
							<input
								type="radio"
								name="delete-option"
								checked={selectedOption === "delete_entries"}
								onChange={() => setSelectedOption("delete_entries")}
								className="mt-1"
							/>
							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-2 font-medium text-red-600 dark:text-red-400">
									<Trash2 className="h-4 w-4 shrink-0" />
									Delete entries and group
								</div>
								<p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
									All entries in this group (and their sub-entries) will be
									permanently deleted along with the group.
								</p>
							</div>
						</label>

						<label
							className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
								selectedOption === "merge"
									? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/30"
									: "border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
							} ${!canMerge ? "opacity-60 cursor-not-allowed" : ""}`}
						>
							<input
								type="radio"
								name="delete-option"
								checked={selectedOption === "merge"}
								onChange={() => canMerge && setSelectedOption("merge")}
								disabled={!canMerge}
								className="mt-1"
							/>
							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-2 font-medium">
									<Merge className="h-4 w-4 shrink-0" />
									Merge into another group
								</div>
								<p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
									{canMerge
										? "Move all entries and matchers to another group, then delete this one."
										: "No other groups available to merge into."}
								</p>
							</div>
						</label>
					</div>
				</div>
			</Modal>

			<AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{selectedOption === "delete_entries"
								? "Delete group and all entries?"
								: "Delete group?"}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{selectedOption === "delete_entries" ? (
								<>
									This will permanently delete the group &quot;
									{group?.name ?? "..."}&quot; and all its entries (including
									sub-entries). Mentions will be removed. This action cannot be
									undone.
								</>
							) : (
								<>
									This will remove the group &quot;{group?.name ?? "..."}&quot;.
									Entries will not be deleted, but they will no longer belong to
									this group. This action cannot be undone.
								</>
							)}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleConfirmDelete}
							disabled={deleteGroup.isPending}
							className="bg-red-600 hover:bg-red-700"
						>
							{deleteGroup.isPending ? (
								<>
									<Spinner size="sm" className="mr-2" />
									Deleting...
								</>
							) : (
								"Delete"
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
};
