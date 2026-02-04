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
import { FormInput, Modal } from "@pubint/yaboujee";
import { useForm } from "@tanstack/react-form";
import { useCallback, useMemo } from "react";
import type { IndexEntry } from "../../_types/index-entry";
import {
	getAvailableParents,
	getEntryDisplayLabel,
} from "../../_utils/index-entry-utils";

export type EntryCreationModalProps = {
	open: boolean;
	onClose: () => void;
	indexType: string; // Current index type context
	existingEntries: IndexEntry[]; // For parent selection and validation
	onCreate: (entry: Omit<IndexEntry, "id">) => IndexEntry;
	prefillLabel?: string; // Optional pre-filled label
};

export const EntryCreationModal = ({
	open,
	onClose,
	indexType,
	existingEntries,
	onCreate,
	prefillLabel = "",
}: EntryCreationModalProps) => {
	const availableParents = useMemo(
		() => getAvailableParents({ entries: existingEntries, indexType }),
		[existingEntries, indexType],
	);

	const form = useForm({
		defaultValues: {
			label: prefillLabel,
			parentId: null as string | null,
			aliases: "", // Comma-separated string
		},
		onSubmit: async ({ value }) => {
			// Create entry
			onCreate({
				indexType,
				label: value.label.trim(),
				parentId: value.parentId,
				metadata: {
					aliases: value.aliases
						.split(",")
						.map((s) => s.trim())
						.filter(Boolean),
				},
			});

			// Close modal on success
			onClose();

			// Reset form for next time
			form.reset();
		},
	});

	const handleCancel = useCallback(() => {
		form.reset();
		onClose();
	}, [form, onClose]);

	return (
		<Modal
			open={open}
			onClose={handleCancel}
			title="Create Index Entry"
			size="md"
			footer={
				<>
					<Button variant="outline" onClick={handleCancel}>
						Cancel
					</Button>
					<Button
						variant="default"
						onClick={() => form.handleSubmit()}
						disabled={form.state.isSubmitting}
					>
						Create
					</Button>
				</>
			}
		>
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

							// Check for duplicate label within index type
							const exists = existingEntries.some(
								(e) =>
									e.indexType === indexType &&
									e.label.toLowerCase() === value.trim().toLowerCase(),
							);

							if (exists) {
								return "An entry with this label already exists in this index";
							}

							return undefined;
						},
					}}
				>
					{(field) => (
						<FormInput field={field} label="Label" placeholder="Entry name" />
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
									<SelectValue placeholder="None (top-level)" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="">None (top-level)</SelectItem>
									{availableParents.map((entry) => (
										<SelectItem key={entry.id} value={entry.id}>
											{getEntryDisplayLabel({
												entry,
												entries: existingEntries,
											})}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</Field>
					)}
				</form.Field>

				{/* Aliases field */}
				<form.Field name="aliases">
					{(field) => (
						<FormInput
							field={field}
							label="Aliases (optional)"
							placeholder="Kant, I.; Emmanuel Kant"
						/>
					)}
				</form.Field>
			</form>
		</Modal>
	);
};
