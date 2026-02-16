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
};

export const EntryCreationModal = ({
	open,
	onClose,
	projectId,
	projectIndexTypeId,
	existingEntries,
	prefillLabel = "",
}: EntryCreationModalProps) => {
	const createEntry = useCreateEntry();
	const [matchers, setMatchers] = useState<string[]>([]);
	const [activeTab, setActiveTab] = useState("basic");
	const [pendingCrossReferences, setPendingCrossReferences] = useState<
		Omit<CreateCrossReferenceInput, "fromEntryId">[]
	>([]);

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
			parentId: null as string | null,
			description: "",
		},
		onSubmit: async ({ value }) => {
			const label = value.label.trim();
			const slug = label.toLowerCase().replace(/\s+/g, "-");

			createEntry.mutate(
				{
					projectId,
					projectIndexTypeId,
					label,
					slug,
					parentId: value.parentId || undefined,
					matchers: matchers.length > 0 ? matchers : undefined,
				},
				{
					onSuccess: async (newEntry) => {
						// Create cross-references if any were added
						if (pendingCrossReferences.length > 0) {
							try {
								await Promise.all(
									pendingCrossReferences.map((crossRef) =>
										createCrossReference.mutateAsync({
											fromEntryId: newEntry.id,
											relationType: crossRef.relationType,
											toEntryId: crossRef.toEntryId,
											arbitraryValue: crossRef.arbitraryValue,
											note: crossRef.note,
										}),
									),
								);
								toast.success(
									`Entry created with ${pendingCrossReferences.length} cross-reference(s)`,
								);
							} catch {
								toast.error("Entry created but some cross-references failed");
							}
						}

						onClose();
						form.reset();
						setMatchers([]);
						setPendingCrossReferences([]);
						setActiveTab("basic");
					},
				},
			);
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

	// Initialize matchers with prefillLabel on open
	useEffect(() => {
		if (open && prefillLabel) {
			setMatchers([prefillLabel]);
		}
	}, [open, prefillLabel]);

	const handleCancel = useCallback(() => {
		form.reset();
		setMatchers([]);
		setPendingCrossReferences([]);
		setActiveTab("basic");
		onClose();
	}, [form, onClose]);

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
						onClick={handleCancel}
						disabled={createEntry.isPending}
					>
						Cancel
					</Button>
					<Button
						variant="default"
						onClick={() => form.handleSubmit()}
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
								onSubmit: ({ value }) => {
									if (!value || !value.trim()) {
										return "Label is required";
									}

									const exists = existingEntries.some(
										(e) => e.label.toLowerCase() === value.trim().toLowerCase(),
									);

									if (exists) {
										return "An entry with this label already exists in this index";
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

						{/* Description field */}
						<form.Field name="description">
							{(field) => (
								<FormInput
									field={field}
									label="Description (optional)"
									placeholder="Additional notes or context..."
								/>
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
					/>
				</TabsContent>
			</Tabs>
		</Modal>
	);
};
