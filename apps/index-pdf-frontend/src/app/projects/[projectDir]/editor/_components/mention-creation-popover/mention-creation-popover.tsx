"use client";

import { Button } from "@pubint/yabasic/components/ui/button";
import { FieldError } from "@pubint/yabasic/components/ui/field";
import { FormInput } from "@pubint/yaboujee";
import { useForm } from "@tanstack/react-form";
import { useEffect, useMemo, useRef, useState } from "react";
import { findEntryByText } from "../../_utils/index-entry-utils";
import { EntryPicker } from "../entry-picker";

export type BoundingBox = {
	x: number;
	y: number;
	width: number;
	height: number;
};

export type MentionDraft = {
	documentId: string;
	pageNumber: number;
	text: string;
	bboxes: BoundingBox[];
	type: "text" | "region";
};

type IndexEntry = {
	id: string;
	label: string;
	indexType: string;
	parentId: string | null;
	metadata?: {
		aliases?: string[];
		sortKey?: string;
	};
};

type Mention = {
	id: string;
	pageNumber: number;
	text: string;
	bboxes: BoundingBox[];
	entryId: string;
	entryLabel: string;
	indexTypes: string[];
	type: "text" | "region";
	createdAt: Date;
};

type MentionCreationPopoverProps = {
	draft: MentionDraft;
	indexType: string; // NEW: Current index type context
	entries: IndexEntry[];
	mentions: Mention[];
	onAttach: ({
		entryId,
		entryLabel,
		regionName,
	}: {
		entryId: string;
		entryLabel: string;
		regionName?: string;
	}) => void;
	onCancel: () => void;
};

/**
 * Popover for creating mentions from draft highlights
 *
 * Appears after text selection or region drawing.
 * Allows user to attach the highlight to an IndexEntry via autocomplete.
 */
const validateNonEmpty = ({ value }: { value: string }) => {
	if (!value || !value.trim()) {
		return "This field is required";
	}
	return undefined;
};

export const MentionCreationPopover = ({
	draft,
	indexType,
	entries,
	mentions,
	onAttach,
	onCancel,
}: MentionCreationPopoverProps) => {
	const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
	const [selectedEntryLabel, setSelectedEntryLabel] = useState<string | null>(
		null,
	);
	const [inputValue, setInputValue] = useState("");
	const [entryError, setEntryError] = useState<string | null>(null);
	const regionNameInputRef = useRef<HTMLInputElement>(null);

	// Filter entries to current index type
	const entriesForType = useMemo(
		() => entries.filter((e) => e.indexType === indexType),
		[entries, indexType],
	);

	const form = useForm({
		defaultValues: {
			regionName: "",
		},
		onSubmit: async () => {
			handleSubmit();
		},
	});

	// Smart autocomplete: Check for exact match on mount
	useEffect(() => {
		if (!draft.text) return;

		const exactMatch = findEntryByText({
			entries: entriesForType,
			text: draft.text,
		});

		if (exactMatch) {
			setSelectedEntryId(exactMatch.id);
			setSelectedEntryLabel(exactMatch.label);
			setInputValue(exactMatch.label);
		}
	}, [draft.text, entriesForType]);

	useEffect(() => {
		// Focus the appropriate field based on draft type
		if (draft.type === "region") {
			regionNameInputRef.current?.focus();
		}
		// Note: EntryPicker doesn't expose focus ref, so we can't auto-focus it
	}, [draft.type]);

	// Re-add escape key handler for standalone usage (tests)
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				onCancel();
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [onCancel]);

	const truncatedText =
		draft.text.length > 60 ? `${draft.text.substring(0, 60)}...` : draft.text;

	const buttonText = "Attach";

	const handleSubmit = () => {
		let hasErrors = false;

		// Validate region name for region type
		if (draft.type === "region") {
			const regionNameValue = form.state.values.regionName;
			if (!regionNameValue || !regionNameValue.trim()) {
				form.setFieldMeta("regionName", (meta) => ({
					...meta,
					errors: ["Region name is required"],
					errorMap: { onSubmit: "Region name is required" },
				}));
				hasErrors = true;
			}
		}

		// Validate entry selection
		if (!selectedEntryId) {
			if (inputValue.trim()) {
				setEntryError(
					"Please select an entry or press Enter to create a new one",
				);
			} else {
				setEntryError("Please select or create an entry");
			}
			hasErrors = true;
		}

		if (hasErrors) {
			return;
		}

		// All validation passed, proceed with attachment
		const regionName =
			draft.type === "region" ? form.state.values.regionName : undefined;

		if (!selectedEntryId || !selectedEntryLabel) {
			throw new Error("Entry ID and label are required");
		}

		onAttach({
			entryId: selectedEntryId,
			entryLabel: selectedEntryLabel,
			regionName,
		});
	};

	const handleFormSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		handleSubmit();
	};

	return (
		<>
			<div className="mb-3">
				<h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
					Attach
				</h3>
				{draft.type === "text" ? (
					<p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2 mb-2">
						"{truncatedText}"
					</p>
				) : (
					<form.Field
						name="regionName"
						validators={{
							onSubmit: validateNonEmpty,
						}}
					>
						{(field) => (
							<div className="mb-2">
								<FormInput
									field={field}
									label="Region name"
									placeholder="Region name..."
									inputRef={regionNameInputRef}
									hideLabel
								/>
							</div>
						)}
					</form.Field>
				)}
				<p className="text-xs text-neutral-600 dark:text-neutral-400">
					to Index Entry:
				</p>
			</div>

			<form onSubmit={handleFormSubmit}>
				<div className="mb-3">
					<EntryPicker
						indexType={indexType}
						entries={entriesForType}
						mentions={mentions}
						onValueChange={(id, label) => {
							setSelectedEntryId(id);
							setSelectedEntryLabel(label);
							setEntryError(null);
						}}
						onCreateNew={(label) => {
							// Entry creation now happens in project sidebar
							// User should create entries there first
							setEntryError(
								`Entry "${label}" not found. Please create it in the project sidebar first.`,
							);
						}}
						inputValue={inputValue}
						onInputValueChange={setInputValue}
						placeholder="Search or create..."
					/>
					{entryError && <FieldError errors={[{ message: entryError }]} />}
				</div>

				<div className="flex gap-2 justify-end">
					<Button type="button" onClick={onCancel} variant="outline" size="sm">
						Cancel
					</Button>
					<Button
						type="button"
						onClick={handleSubmit}
						variant="default"
						size="sm"
					>
						{buttonText}
					</Button>
				</div>
			</form>
		</>
	);
};
