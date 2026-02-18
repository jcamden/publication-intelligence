"use client";

import { Button } from "@pubint/yabasic/components/ui/button";
import { Field, FieldLabel } from "@pubint/yabasic/components/ui/field";
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
import { useCreateEntry } from "@/app/_common/_hooks/use-create-entry";
import { trpc } from "@/app/_common/_utils/trpc";
import type { CreateCrossReferenceInput } from "@/app/_common/_utils/trpc-types";
import type { IndexEntry } from "../../_types/index-entry";
import { getAvailableParents } from "../../_utils/index-entry-utils";
import { MatcherListEditor } from "../entry-edit-modal/components/matcher-list-editor";
import { EntryPicker } from "../entry-picker/entry-picker";
import { CrossReferenceCreator } from "./components/cross-reference-creator";

export type EntryCreationModalProps = {
	open: boolean;
	onClose: () => void;
	projectId: string;
	projectIndexTypeId: string;
	existingEntries: IndexEntry[];
	prefillLabel?: string;
	prefillParentId?: string | null;
	onEntryCreated?: (entry: IndexEntry) => void;
};

export const EntryCreationModal = ({
	open,
	onClose,
	projectId,
	projectIndexTypeId,
	existingEntries,
	prefillLabel = "",
	prefillParentId = null,
	onEntryCreated,
}: EntryCreationModalProps) => {
	console.log("[EntryCreationModal] Component rendered/updated:", {
		open,
		prefillLabel,
		prefillParentId,
		existingEntriesCount: existingEntries.length,
	});
	const utils = trpc.useUtils();
	const createEntry = useCreateEntry();
	const [matchers, setMatchers] = useState<string[]>([]);
	const [activeTab, setActiveTab] = useState("basic");
	const [pendingCrossReferences, setPendingCrossReferences] = useState<
		Omit<CreateCrossReferenceInput, "fromEntryId">[]
	>([]);
	const [hasUnsavedCrossRefTarget, setHasUnsavedCrossRefTarget] =
		useState(false);
	const [crossRefValidationError, setCrossRefValidationError] = useState<
		string | null
	>(null);

	const createCrossReference =
		trpc.indexEntry.crossReference.create.useMutation({
			onError: (error) => {
				toast.error(`Failed to create cross-reference: ${error.message}`);
			},
		});

	const availableParents = useMemo(
		() =>
			getAvailableParents({
				entries: existingEntries,
				indexType: existingEntries[0]?.indexType || "",
			}),
		[existingEntries],
	);

	const form = useForm({
		defaultValues: {
			label: prefillLabel,
			parentId: prefillParentId,
		},
		onSubmit: async ({ value }) => {
			console.log("[EntryCreationModal] onSubmit called with value:", value);
			const label = value.label.trim();

			const mutationInput = {
				projectId,
				projectIndexTypeId,
				label,
				parentId: value.parentId || undefined,
				matchers: matchers.length > 0 ? matchers : undefined,
			};

			console.log(
				"[EntryCreationModal] Calling createEntry.mutate with:",
				mutationInput,
			);

			createEntry.mutate(mutationInput, {
				onSuccess: async (newEntry) => {
					// Create cross-references if any were added
					if (pendingCrossReferences.length > 0) {
						try {
							await Promise.all(
								pendingCrossReferences.map((crossRef) =>
									createCrossReference.mutateAsync({
										fromEntryId: newEntry.id,
										...(crossRef.toEntryId != null
											? { toEntryId: crossRef.toEntryId }
											: { arbitraryValue: crossRef.arbitraryValue ?? "" }),
										relationType: crossRef.relationType,
									}),
								),
							);
							utils.indexEntry.crossReference.list.invalidate({
								entryId: newEntry.id,
							});
							toast.success(
								`Entry created with ${pendingCrossReferences.length} cross-reference(s)`,
							);
						} catch {
							toast.error("Entry created but some cross-references failed");
						}
					}

					// Convert backend entry to frontend format with indexType
					const indexType = existingEntries[0]?.indexType || "subject";
					console.log("[EntryCreationModal] Creating frontend entry:", {
						backendEntry: newEntry,
						existingEntriesCount: existingEntries.length,
						derivedIndexType: indexType,
						projectId,
						projectIndexTypeId,
					});

					const frontendEntry: IndexEntry = {
						...newEntry,
						indexType,
						projectId: projectId,
						projectIndexTypeId: projectIndexTypeId,
						metadata: {
							matchers: newEntry.matchers?.map((m) => m.text) || [],
						},
					};

					console.log(
						"[EntryCreationModal] Frontend entry created:",
						frontendEntry,
					);

					onEntryCreated?.(frontendEntry);
					onClose();
					form.reset();
					setMatchers([]);
					setPendingCrossReferences([]);
					setHasUnsavedCrossRefTarget(false);
					setCrossRefValidationError(null);
					setActiveTab("basic");
				},
			});
		},
	});

	// Auto-populate matchers with label when it changes
	useEffect(() => {
		const label = form.state.values.label?.trim();
		if (label && !matchers.includes(label)) {
			setMatchers((prev) => {
				// Remove old label if it exists and add new one at the beginning
				const filtered = prev.filter((m) => m !== prefillLabel.trim());
				return [label, ...filtered];
			});
		}
	}, [form.state.values.label, prefillLabel, matchers]);

	// Initialize form fields and matchers when modal opens with prefill values
	useEffect(() => {
		if (open) {
			form.setFieldValue("label", prefillLabel);
			form.setFieldValue("parentId", prefillParentId);
			if (prefillLabel) {
				setMatchers([prefillLabel]);
			}
			setHasUnsavedCrossRefTarget(false);
			setCrossRefValidationError(null);
		}
	}, [open, prefillLabel, prefillParentId, form]);

	const handleCancel = useCallback(() => {
		form.reset();
		setMatchers([]);
		setPendingCrossReferences([]);
		setHasUnsavedCrossRefTarget(false);
		setCrossRefValidationError(null);
		setActiveTab("basic");
		onClose();
	}, [form, onClose]);

	const CROSS_REF_VALIDATION_MESSAGE =
		"Cross-reference not saved. Please add it or clear the Target field.";

	const handleCreate = useCallback(
		(e?: React.MouseEvent) => {
			e?.preventDefault();
			e?.stopPropagation();
			if (hasUnsavedCrossRefTarget) {
				setCrossRefValidationError(CROSS_REF_VALIDATION_MESSAGE);
				setActiveTab("cross-references");
				return;
			}
			form.handleSubmit();
		},
		[form, hasUnsavedCrossRefTarget],
	);

	return (
		<Modal
			open={open}
			onClose={handleCancel}
			title="Create Index Entry"
			size="lg"
			footer={
				<>
					<Button
						variant="outline"
						type="button"
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							handleCancel();
						}}
						disabled={createEntry.isPending}
					>
						Cancel
					</Button>
					<Button
						variant="default"
						type="button"
						onClick={handleCreate}
						disabled={form.state.isSubmitting || createEntry.isPending}
					>
						{createEntry.isPending ? (
							<>
								<Spinner size="sm" className="mr-2" />
								Creating...
							</>
						) : (
							"Create"
						)}
					</Button>
				</>
			}
		>
			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList>
					<TabsTrigger value="basic">Basic Info</TabsTrigger>
					<TabsTrigger value="matchers">Matchers</TabsTrigger>
					<TabsTrigger value="cross-references">Cross-References</TabsTrigger>
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
								onSubmit: ({ value, fieldApi }) => {
									console.log("[EntryCreationModal] Label validator running:", {
										value,
										existingEntriesCount: existingEntries.length,
										existingEntries: existingEntries.map((e) => ({
											id: e.id,
											label: e.label,
											parentId: e.parentId,
										})),
									});

									if (!value || !value.trim()) {
										console.log(
											"[EntryCreationModal] Validation failed: Label is required",
										);
										return "Label is required";
									}

									// Check if an entry with the same label AND same parent exists
									const currentParentId =
										fieldApi.form.getFieldValue("parentId");
									const exists = existingEntries.some(
										(e) =>
											e.label.toLowerCase() === value.trim().toLowerCase() &&
											e.parentId === currentParentId,
									);

									if (exists) {
										console.log(
											"[EntryCreationModal] Validation failed: Entry already exists with same parent",
											{
												matchingEntry: existingEntries.find(
													(e) =>
														e.label.toLowerCase() ===
															value.trim().toLowerCase() &&
														e.parentId === currentParentId,
												),
											},
										);
										return "An entry with this label already exists under this parent";
									}

									console.log("[EntryCreationModal] Validation passed");
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
									<EntryPicker
										id="parentId"
										entries={availableParents}
										value={field.state.value}
										onValueChange={(value) => field.handleChange(value)}
										placeholder="None (top-level)"
										allowClear
									/>
								</Field>
							)}
						</form.Field>
					</form>
				</TabsContent>

				<TabsContent value="matchers">
					<div className="space-y-3">
						<p className="text-sm text-neutral-600 dark:text-neutral-400">
							The entry label is automatically added as a matcher. Add
							additional alternative terms or phrases below.
						</p>
						<MatcherListEditor matchers={matchers} onChange={setMatchers} />
					</div>
				</TabsContent>

				<TabsContent value="cross-references">
					<CrossReferenceCreator
						existingEntries={existingEntries}
						pendingCrossReferences={pendingCrossReferences}
						onChange={setPendingCrossReferences}
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
