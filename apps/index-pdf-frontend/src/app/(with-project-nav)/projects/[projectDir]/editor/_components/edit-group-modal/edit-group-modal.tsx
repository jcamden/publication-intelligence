"use client";

import { CANON_LABELS } from "@pubint/core";
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
import { Field, FieldLabel } from "@pubint/yabasic/components/ui/field";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@pubint/yabasic/components/ui/select";
import { Spinner } from "@pubint/yabasic/components/ui/spinner";
import { FormInput, Modal } from "@pubint/yaboujee";
import { useForm } from "@tanstack/react-form";
import { skipToken } from "@tanstack/react-query";
import { Minus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/app/_common/_trpc/client";
import type { IndexEntry } from "@/app/projects/[projectDir]/_types/index-entry";
import { getChildEntries } from "@/app/projects/[projectDir]/_utils/entry-filters";
import { getEntryDisplayLabel } from "@/app/projects/[projectDir]/_utils/entry-path-formatting";
import { EntryPicker } from "../entry-picker/entry-picker";

const SORT_MODES_BASE = [
	{ value: "a_z", label: "A–Z" },
	{ value: "custom", label: "Custom (drag to reorder)" },
] as const;

const SORT_MODES_SCRIPTURE = [
	{ value: "a_z", label: "A–Z" },
	{ value: "protestant", label: `${CANON_LABELS.protestant} Canon` },
	{ value: "roman_catholic", label: `${CANON_LABELS.roman_catholic} Canon` },
	{ value: "tanakh", label: CANON_LABELS.tanakh },
	{
		value: "eastern_orthodox",
		label: `${CANON_LABELS.eastern_orthodox} Canon`,
	},
	{ value: "custom", label: "Custom (drag to reorder)" },
] as const;

type SortModeValue =
	| "a_z"
	| "custom"
	| "protestant"
	| "roman_catholic"
	| "tanakh"
	| "eastern_orthodox";

export type EditGroupModalProps = {
	open: boolean;
	onClose: () => void;
	/** When null, modal is in create mode (header "Create Group", no entries section). */
	groupId: string | null;
	projectId: string;
	projectIndexTypeId: string;
	/** When "scripture", shows canon-specific sort options (Protestant, Catholic, etc.). */
	indexType: "subject" | "author" | "scripture";
	existingEntries: IndexEntry[];
};

export const EditGroupModal = ({
	open,
	onClose,
	groupId,
	projectId,
	projectIndexTypeId,
	indexType,
	existingEntries,
}: EditGroupModalProps) => {
	const isCreateMode = groupId === null;
	const utils = trpc.useUtils();
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [entryToAdd, setEntryToAdd] = useState<string | null>(null);
	// Local membership state; only persisted on Save
	const [localMemberEntryIds, setLocalMemberEntryIds] = useState<string[]>([]);

	const { data: group, isLoading: isLoadingGroup } =
		trpc.detection.getIndexEntryGroup.useQuery(
			groupId ? { groupId } : skipToken,
			{ enabled: open && !!groupId },
		);

	const { data: groups = [] } = trpc.detection.listIndexEntryGroups.useQuery(
		{ projectId, projectIndexTypeId },
		{ enabled: open && !!projectId && !!projectIndexTypeId },
	);

	const updateGroup = trpc.detection.updateIndexEntryGroup.useMutation({
		onError: (error) => {
			toast.error(`Failed to update group: ${error.message}`);
		},
	});

	const addEntryToGroup = trpc.detection.addEntryToGroup.useMutation({
		onError: (error) => {
			toast.error(`Failed to add entry: ${error.message}`);
		},
	});

	const removeEntryFromGroup = trpc.detection.removeEntryFromGroup.useMutation({
		onError: (error) => {
			toast.error(`Failed to remove entry: ${error.message}`);
		},
	});

	const deleteGroup = trpc.detection.deleteIndexEntryGroup.useMutation({
		onSuccess: () => {
			utils.detection.listIndexEntryGroups.invalidate({
				projectId,
				projectIndexTypeId,
			});
			utils.indexEntry.listLean.invalidate({ projectId });
			setShowDeleteDialog(false);
			onClose();
		},
		onError: (error) => {
			toast.error(`Failed to delete group: ${error.message}`);
		},
	});

	const rootEntries = useMemo(
		() => getChildEntries({ entries: existingEntries, parentId: null }),
		[existingEntries],
	);

	const localMemberIdsSet = useMemo(
		() => new Set(localMemberEntryIds),
		[localMemberEntryIds],
	);

	const entriesAvailableToAdd = useMemo(
		() => rootEntries.filter((e) => !localMemberIdsSet.has(e.id)),
		[rootEntries, localMemberIdsSet],
	);

	const selectedEntryForAdd = useMemo(
		() => (entryToAdd ? rootEntries.find((e) => e.id === entryToAdd) : null),
		[entryToAdd, rootEntries],
	);

	const transferWarning = useMemo(() => {
		if (!selectedEntryForAdd?.groupId) return null;
		// In edit mode, no warning if entry is already in this group
		if (groupId && selectedEntryForAdd.groupId === groupId) return null;
		const fromGroup = groups.find((g) => g.id === selectedEntryForAdd.groupId);
		return fromGroup
			? `Entry will be transferred from "${fromGroup.name}" to this group.`
			: "Entry will be transferred from another group.";
	}, [selectedEntryForAdd, groupId, groups]);

	const initialMemberEntryIds = useMemo(
		() => group?.entries?.map((e) => e.entryId) ?? [],
		[group?.entries],
	);

	const createGroup = trpc.detection.createIndexEntryGroup.useMutation({
		onError: (error) => {
			toast.error(`Failed to create group: ${error.message}`);
		},
	});

	const sortModes =
		indexType === "scripture" ? SORT_MODES_SCRIPTURE : SORT_MODES_BASE;

	const form = useForm({
		defaultValues: {
			name: "",
			sortMode: "a_z" as SortModeValue,
		},
		onSubmit: async ({ value }) => {
			const name = value.name.trim();
			const sortMode = value.sortMode;

			try {
				if (isCreateMode) {
					const created = await createGroup.mutateAsync({
						projectId,
						projectIndexTypeId,
						name,
						sortMode,
					});
					const transferredFromIds = new Set<string>();
					for (const entryId of localMemberEntryIds) {
						const result = await addEntryToGroup.mutateAsync({
							groupId: created.id,
							entryId,
						});
						if (result.transferredFrom) {
							transferredFromIds.add(result.transferredFrom);
							const fromGroup = groups.find(
								(g) => g.id === result.transferredFrom,
							);
							toast.info(
								`Entry transferred from "${fromGroup?.name ?? "another group"}" to this group`,
							);
						}
					}
					utils.detection.getIndexEntryGroup.invalidate({
						groupId: created.id,
					});
					for (const fromId of transferredFromIds) {
						utils.detection.getIndexEntryGroup.invalidate({
							groupId: fromId,
						});
					}
					utils.detection.listIndexEntryGroups.invalidate({
						projectId,
						projectIndexTypeId,
					});
					utils.indexEntry.listLean.invalidate({ projectId });
					onClose();
					return;
				}

				if (!groupId) return;
				const editGroupId = groupId;
				const toRemove = initialMemberEntryIds.filter(
					(id) => !localMemberEntryIds.includes(id),
				);
				const toAdd = localMemberEntryIds.filter(
					(id) => !initialMemberEntryIds.includes(id),
				);

				await updateGroup.mutateAsync({
					groupId: editGroupId,
					name,
					sortMode,
				});

				for (const entryId of toRemove) {
					await removeEntryFromGroup.mutateAsync({
						groupId: editGroupId,
						entryId,
					});
				}
				for (const entryId of toAdd) {
					const result = await addEntryToGroup.mutateAsync({
						groupId: editGroupId,
						entryId,
					});
					if (result.transferredFrom) {
						const fromGroup = groups.find(
							(g) => g.id === result.transferredFrom,
						);
						toast.info(
							`Entry transferred from "${fromGroup?.name ?? "another group"}" to this group`,
						);
					}
				}

				utils.detection.getIndexEntryGroup.invalidate({
					groupId: editGroupId,
				});
				utils.detection.listIndexEntryGroups.invalidate({
					projectId,
					projectIndexTypeId,
				});
				utils.indexEntry.listLean.invalidate({ projectId });
				onClose();
			} catch {
				// Errors already surfaced via mutation onError
			}
		},
	});

	useEffect(() => {
		if (open) {
			if (isCreateMode) {
				form.setFieldValue("name", "");
				form.setFieldValue("sortMode", "a_z");
				setLocalMemberEntryIds([]);
			} else if (group) {
				form.setFieldValue("name", group.name);
				// Legacy canon_book_order → protestant for display
				const sortMode =
					group.sortMode === "canon_book_order" ? "protestant" : group.sortMode;
				form.setFieldValue(
					"sortMode",
					sortModes.some((m) => m.value === sortMode) ? sortMode : "a_z",
				);
				setLocalMemberEntryIds(group.entries?.map((e) => e.entryId) ?? []);
			}
		}
	}, [open, isCreateMode, group, form, sortModes]);

	const handleCancel = useCallback(() => {
		form.reset();
		setEntryToAdd(null);
		setLocalMemberEntryIds([]);
		onClose();
	}, [form, onClose]);

	const handleAddEntry = useCallback(() => {
		if (!entryToAdd) return;
		setLocalMemberEntryIds((prev) =>
			prev.includes(entryToAdd) ? prev : [...prev, entryToAdd],
		);
		setEntryToAdd(null);
	}, [entryToAdd]);

	const handleRemoveEntry = useCallback((entryId: string) => {
		setLocalMemberEntryIds((prev) => prev.filter((id) => id !== entryId));
	}, []);

	if (!isCreateMode && !group && !isLoadingGroup) {
		return null;
	}

	const isSubmitting =
		form.state.isSubmitting || createGroup.isPending || updateGroup.isPending;

	return (
		<>
			<Modal
				open={open}
				onClose={handleCancel}
				title={
					isCreateMode ? "Create Group" : `Edit Group: ${group?.name ?? ""}`
				}
				size="lg"
				footer={
					<>
						{!isCreateMode && (
							<Button
								variant="outline"
								onClick={() => setShowDeleteDialog(true)}
								disabled={isSubmitting}
								className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
							>
								<Trash2 className="h-4 w-4 mr-2" />
								Delete Group
							</Button>
						)}
						<div className="flex-1" />
						<Button
							variant="outline"
							onClick={handleCancel}
							disabled={isSubmitting}
						>
							Cancel
						</Button>
						<Button
							variant="default"
							onClick={() => form.handleSubmit()}
							disabled={isSubmitting}
						>
							{isSubmitting ? (
								<>
									<Spinner size="sm" className="mr-2" />
									{isCreateMode ? "Creating..." : "Saving..."}
								</>
							) : isCreateMode ? (
								"Create"
							) : (
								"Save Changes"
							)}
						</Button>
					</>
				}
			>
				{!isCreateMode && isLoadingGroup ? (
					<div className="flex justify-center py-8">
						<Spinner size="lg" />
					</div>
				) : (
					<div className="space-y-6">
						<form
							onSubmit={(e) => {
								e.preventDefault();
								form.handleSubmit();
							}}
							className="space-y-4"
						>
							<form.Field
								name="name"
								validators={{
									onSubmit: ({ value }) => {
										if (!value?.trim()) return "Name is required";
										return undefined;
									},
								}}
							>
								{(field) => (
									<FormInput
										field={field}
										label="Group name"
										placeholder="e.g., Biblical References"
									/>
								)}
							</form.Field>

							<form.Field name="sortMode">
								{(field) => {
									const selectedLabel =
										sortModes.find((m) => m.value === field.state.value)
											?.label ?? field.state.value;
									return (
										<Field>
											<FieldLabel>Sort mode</FieldLabel>
											<Select
												value={field.state.value}
												onValueChange={(v) =>
													field.handleChange(v as SortModeValue)
												}
											>
												<SelectTrigger className="w-full">
													<SelectValue>{selectedLabel}</SelectValue>
												</SelectTrigger>
												<SelectContent>
													{sortModes.map((m) => (
														<SelectItem key={m.value} value={m.value}>
															{m.label}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</Field>
									);
								}}
							</form.Field>
						</form>

						{/* Entries section - same for create and edit */}
						<div className="border-t border-neutral-200 dark:border-neutral-700 pt-4">
							<h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
								Entries in this group
							</h3>

							{/* Add entry */}
							<div className="mb-4">
								<Field>
									<FieldLabel>Add entry</FieldLabel>
									<div className="flex gap-2">
										<div className="flex-1 min-w-0">
											<EntryPicker
												entries={entriesAvailableToAdd}
												value={entryToAdd}
												onValueChange={setEntryToAdd}
												placeholder="Search root entries..."
												allowClear
											/>
										</div>
										<Button
											type="button"
											variant="secondary"
											size="sm"
											onClick={handleAddEntry}
											disabled={!entryToAdd}
										>
											Add
										</Button>
									</div>
									{transferWarning && (
										<p
											className="mt-1.5 text-sm text-amber-600 dark:text-amber-400"
											role="alert"
										>
											{transferWarning}
										</p>
									)}
								</Field>
							</div>

							{/* Member list */}
							{localMemberEntryIds.length > 0 ? (
								<ul className="space-y-1 max-h-48 overflow-y-auto rounded border border-neutral-200 dark:border-neutral-700 p-2">
									{localMemberEntryIds.map((entryId) => {
										const entry = existingEntries.find((e) => e.id === entryId);
										const label = entry
											? getEntryDisplayLabel({
													entry,
													entries: existingEntries,
												})
											: entryId;
										return (
											<li
												key={entryId}
												className="flex items-center justify-between gap-2 py-1.5 px-2 rounded hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
											>
												<span className="text-sm truncate">{label}</span>
												<Button
													type="button"
													variant="ghost"
													size="icon"
													className="h-7 w-7 shrink-0"
													onClick={() => handleRemoveEntry(entryId)}
													aria-label={`Remove ${label} from group`}
												>
													<Minus className="h-4 w-4" />
												</Button>
											</li>
										);
									})}
								</ul>
							) : (
								<p className="text-sm text-neutral-500 dark:text-neutral-400 py-2">
									No entries in this group yet. Add root entries above.
								</p>
							)}
						</div>
					</div>
				)}
			</Modal>

			{groupId && (
				<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Delete group?</AlertDialogTitle>
							<AlertDialogDescription>
								This will remove the group &quot;{group?.name}&quot;. Entries
								will not be deleted, but they will no longer belong to this
								group. This action cannot be undone.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Cancel</AlertDialogCancel>
							<AlertDialogAction
								onClick={() => deleteGroup.mutate({ groupId })}
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
			)}
		</>
	);
};
