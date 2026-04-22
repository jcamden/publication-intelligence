"use client";

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
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@pubint/yabasic/components/ui/tabs";
import { FormInput, Modal } from "@pubint/yaboujee";
import { useForm } from "@tanstack/react-form";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/app/_common/_trpc/client";
import type { IndexEntry } from "@/app/projects/[projectDir]/_types/index-entry";
import { getEntryDisplayLabel } from "@/app/projects/[projectDir]/_utils/entry-path-formatting";
import { getAvailableParents } from "../../_utils/available-parents";
import { useUpdateEntry } from "./_hooks/use-update-entry";
import { CrossReferenceEditor } from "./components/cross-reference-editor";
import { MatcherListEditor } from "./components/matcher-list-editor";

export type EntryEditModalProps = {
	open: boolean;
	onClose: () => void;
	entry: IndexEntry;
	projectId: string;
	projectIndexTypeId: string;
	existingEntries: IndexEntry[];
};

export const EntryEditModal = ({
	open,
	onClose,
	entry,
	projectId,
	projectIndexTypeId,
	existingEntries,
}: EntryEditModalProps) => {
	const utils = trpc.useUtils();
	const [matchers, setMatchers] = useState<string[]>([]);
	const [activeTab, setActiveTab] = useState("basic");
	const [hasUnsavedCrossRefTarget, setHasUnsavedCrossRefTarget] =
		useState(false);
	const [crossRefValidationError, setCrossRefValidationError] = useState<
		string | null
	>(null);
	const updateEntry = useUpdateEntry();

	const CROSS_REF_VALIDATION_MESSAGE =
		"Cross-reference not saved. Please add it or clear the Target field.";

	const { data: crossReferences = [], refetch: refetchCrossReferences } =
		trpc.indexEntry.crossReference.list.useQuery(
			{ entryId: entry.id },
			{ enabled: open },
		);

	const { data: groups = [] } = trpc.detection.listIndexEntryGroups.useQuery(
		{ projectId, projectIndexTypeId },
		{ enabled: open && !!projectId && !!projectIndexTypeId },
	);

	const addEntryToGroup = trpc.detection.addEntryToGroup.useMutation({
		onError: (error) => {
			toast.error(`Failed to add entry to group: ${error.message}`);
		},
	});

	const removeEntryFromGroup = trpc.detection.removeEntryFromGroup.useMutation({
		onError: (error) => {
			toast.error(`Failed to remove entry from group: ${error.message}`);
		},
	});

	const availableParents = useMemo(
		() =>
			getAvailableParents({
				entries: existingEntries.filter((e) => e.id !== entry.id),
				indexType: entry.indexType || "",
			}),
		[existingEntries, entry.id, entry.indexType],
	);

	const form = useForm({
		defaultValues: {
			label: entry.label,
			parentId: entry.parentId as string | null,
			groupId: (entry.groupId ?? null) as string | null,
		},
		onSubmit: async ({ value }) => {
			const label = value.label.trim();
			const newGroupId = value.groupId ?? null;
			const oldGroupId = entry.groupId ?? null;

			updateEntry.mutate(
				{
					id: entry.id,
					projectId,
					projectIndexTypeId,
					label,
					matchers: matchers,
				},
				{
					onSuccess: async () => {
						// Handle group changes (root entries only)
						if (entry.parentId == null) {
							if (oldGroupId && oldGroupId !== newGroupId) {
								await removeEntryFromGroup.mutateAsync({
									groupId: oldGroupId,
									entryId: entry.id,
								});
							}
							if (newGroupId) {
								await addEntryToGroup.mutateAsync({
									groupId: newGroupId,
									entryId: entry.id,
								});
							}
							utils.detection.listIndexEntryGroups.invalidate({
								projectId,
								projectIndexTypeId,
							});
							utils.indexEntry.list.invalidate({
								projectId,
								projectIndexTypeId,
							});
						}
						onClose();
					},
				},
			);
		},
	});

	useEffect(() => {
		if (open && entry.metadata?.matchers) {
			setMatchers(entry.metadata.matchers);
		}
	}, [open, entry.metadata?.matchers]);

	useEffect(() => {
		if (open) {
			form.setFieldValue("groupId", (entry.groupId ?? null) as string | null);
			setHasUnsavedCrossRefTarget(false);
			setCrossRefValidationError(null);
		}
	}, [open, entry.groupId, form]);

	const handleCancel = useCallback(() => {
		form.reset();
		setActiveTab("basic");
		setHasUnsavedCrossRefTarget(false);
		setCrossRefValidationError(null);
		onClose();
	}, [form, onClose]);

	const handleSave = useCallback(() => {
		if (hasUnsavedCrossRefTarget) {
			setCrossRefValidationError(CROSS_REF_VALIDATION_MESSAGE);
			setActiveTab("cross-refs");
			return;
		}
		form.handleSubmit();
	}, [form, hasUnsavedCrossRefTarget]);

	const selectedParent = useMemo(
		() =>
			form.state.values.parentId
				? availableParents.find((p) => p.id === form.state.values.parentId)
				: null,
		[form.state.values.parentId, availableParents],
	);

	const mentionCount = 0;

	return (
		<Modal
			open={open}
			onClose={handleCancel}
			title={`Edit Entry: ${entry.label}`}
			size="lg"
			footer={
				<>
					<Button
						variant="outline"
						onClick={handleCancel}
						disabled={updateEntry.isPending}
					>
						Cancel
					</Button>
					<Button
						variant="default"
						onClick={handleSave}
						disabled={form.state.isSubmitting || updateEntry.isPending}
					>
						{updateEntry.isPending ? (
							<>
								<Spinner size="sm" className="mr-2" />
								Saving...
							</>
						) : (
							"Save Changes"
						)}
					</Button>
				</>
			}
		>
			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList>
					<TabsTrigger value="basic">Basic Info</TabsTrigger>
					<TabsTrigger value="matchers">Matchers</TabsTrigger>
					<TabsTrigger value="cross-refs">Cross-References</TabsTrigger>
				</TabsList>

				<TabsContent value="basic">
					<form
						onSubmit={(e) => {
							e.preventDefault();
							form.handleSubmit();
						}}
						className="space-y-4"
					>
						{/* Label field */}
						<form.Field
							name="label"
							validators={{
								onSubmit: ({ value }) => {
									if (!value || !value.trim()) {
										return "Label is required";
									}

									// Check if an entry with the same label AND same parent exists
									// (excluding the current entry being edited)
									const exists = existingEntries.some(
										(e) =>
											e.id !== entry.id &&
											e.label.toLowerCase() === value.trim().toLowerCase() &&
											e.parentId === entry.parentId,
									);

									if (exists) {
										return "An entry with this label already exists under this parent";
									}

									return undefined;
								},
							}}
						>
							{(field) => (
								<FormInput
									field={field}
									label="Label"
									placeholder="Entry name"
								/>
							)}
						</form.Field>

						{/* Parent entry field */}
						<form.Field name="parentId">
							{(field) => (
								<Field>
									<FieldLabel htmlFor="parentId">
										Parent Entry (optional)
									</FieldLabel>
									<Select
										value={field.state.value ?? ""}
										onValueChange={(value) => {
											field.handleChange(value === "" ? null : value);
										}}
									>
										<SelectTrigger id="parentId" className="w-full">
											<SelectValue placeholder="None (top-level)">
												{selectedParent
													? getEntryDisplayLabel({
															entry: selectedParent,
															entries: existingEntries,
														})
													: "None (top-level)"}
											</SelectValue>
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="">None (top-level)</SelectItem>
											{availableParents.map((parentEntry) => (
												<SelectItem key={parentEntry.id} value={parentEntry.id}>
													{getEntryDisplayLabel({
														entry: parentEntry,
														entries: existingEntries,
													})}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</Field>
							)}
						</form.Field>

						{/* Group selector - root entries only */}
						{entry.parentId == null && (
							<form.Field name="groupId">
								{(field) => {
									const currentGroupId = entry.groupId ?? null;
									const selectedGroupId = field.state.value ?? null;
									const isTransfer =
										currentGroupId &&
										selectedGroupId &&
										selectedGroupId !== currentGroupId;
									const currentGroup = groups.find(
										(g) => g.id === currentGroupId,
									);
									const selectedGroup = groups.find(
										(g) => g.id === selectedGroupId,
									);

									return (
										<Field>
											<FieldLabel htmlFor="groupId">
												Group (optional)
											</FieldLabel>
											<Select
												value={field.state.value ?? ""}
												onValueChange={(v) =>
													field.handleChange(v === "" ? null : v)
												}
											>
												<SelectTrigger id="groupId" className="w-full">
													<SelectValue placeholder="None">
														{selectedGroup?.name ?? "None"}
													</SelectValue>
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="">None</SelectItem>
													{groups.map((g) => (
														<SelectItem key={g.id} value={g.id}>
															{g.name}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											{isTransfer && currentGroup && selectedGroup && (
												<p
													className="mt-1.5 text-sm text-amber-600 dark:text-amber-400"
													role="alert"
												>
													Entry will be transferred from "{currentGroup.name}"
													to "{selectedGroup.name}".
												</p>
											)}
										</Field>
									);
								}}
							</form.Field>
						)}
					</form>
				</TabsContent>

				<TabsContent value="matchers">
					<MatcherListEditor matchers={matchers} onChange={setMatchers} />
				</TabsContent>

				<TabsContent value="cross-refs">
					<CrossReferenceEditor
						entryId={entry.id}
						crossReferences={crossReferences}
						existingEntries={existingEntries}
						mentionCount={mentionCount}
						projectId={projectId}
						onUpdate={refetchCrossReferences}
						onUnsavedTargetChange={(hasUnsaved) => {
							setHasUnsavedCrossRefTarget(hasUnsaved);
							if (!hasUnsaved) setCrossRefValidationError(null);
						}}
						validationError={crossRefValidationError ?? undefined}
					/>
				</TabsContent>
			</Tabs>
		</Modal>
	);
};
