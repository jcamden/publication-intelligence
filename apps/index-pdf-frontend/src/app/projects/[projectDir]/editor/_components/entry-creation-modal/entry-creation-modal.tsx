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
import { FormInput, Modal } from "@pubint/yaboujee";
import { useForm } from "@tanstack/react-form";
import { useCallback, useMemo } from "react";
import { useCreateEntry } from "@/app/_common/_hooks/use-create-entry";
import type { IndexEntry } from "../../_types/index-entry";
import {
	getAvailableParents,
	getEntryDisplayLabel,
} from "../../_utils/index-entry-utils";

export type EntryCreationModalProps = {
	open: boolean;
	onClose: () => void;
	projectId: string;
	projectIndexTypeId: string;
	existingEntries: IndexEntry[]; // For parent selection and validation
	prefillLabel?: string; // Optional pre-filled label
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
			aliases: "", // Comma-separated string (will be variants)
		},
		onSubmit: async ({ value }) => {
			const label = value.label.trim();
			const slug = label.toLowerCase().replace(/\s+/g, "-");
			const variants = value.aliases
				.split(",")
				.map((s) => s.trim())
				.filter(Boolean);

			createEntry.mutate(
				{
					projectId,
					projectIndexTypeId,
					label,
					slug,
					parentId: value.parentId || undefined,
					variants: variants.length > 0 ? variants : undefined,
				},
				{
					onSuccess: () => {
						onClose();
						form.reset();
					},
				},
			);
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

							// Check for duplicate label within existing entries
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
