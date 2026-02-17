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
import { useUpdateEntry } from "@/app/_common/_hooks/use-update-entry";
import { trpc } from "@/app/_common/_utils/trpc";
import type { IndexEntry } from "../../_types/index-entry";
import {
	getAvailableParents,
	getEntryDisplayLabel,
} from "../../_utils/index-entry-utils";
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
	const [matchers, setMatchers] = useState<string[]>([]);
	const [activeTab, setActiveTab] = useState("basic");
	const updateEntry = useUpdateEntry();

	const { data: crossReferences = [], refetch: refetchCrossReferences } =
		trpc.indexEntry.crossReference.list.useQuery(
			{ entryId: entry.id },
			{ enabled: open },
		);

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
			description: "",
		},
		onSubmit: async ({ value }) => {
			const label = value.label.trim();

			updateEntry.mutate(
				{
					id: entry.id,
					projectId,
					projectIndexTypeId,
					label,
					description: value.description || undefined,
					matchers: matchers,
				},
				{
					onSuccess: () => {
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

	const handleCancel = useCallback(() => {
		form.reset();
		setActiveTab("basic");
		onClose();
	}, [form, onClose]);

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
						onClick={() => form.handleSubmit()}
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
					/>
				</TabsContent>
			</Tabs>
		</Modal>
	);
};
