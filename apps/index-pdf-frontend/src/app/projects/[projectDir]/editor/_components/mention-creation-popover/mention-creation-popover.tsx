"use client";

import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from "@pubint/yabasic/components/ui/combobox";
import { FieldError } from "@pubint/yabasic/components/ui/field";
import { FormInput } from "@pubint/yaboujee";
import { useForm } from "@tanstack/react-form";
import { useEffect, useRef, useState } from "react";

export type BoundingBox = {
	x: number;
	y: number;
	width: number;
	height: number;
};

export type MentionDraft = {
	pageNumber: number;
	text: string;
	bbox: BoundingBox;
	type: "text" | "region";
};

export type IndexEntry = {
	id: string;
	label: string;
	parentId: string | null;
};

type MentionCreationPopoverProps = {
	draft: MentionDraft;
	existingEntries: IndexEntry[];
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
	existingEntries,
	onAttach,
	onCancel,
}: MentionCreationPopoverProps) => {
	const [selectedValue, setSelectedValue] = useState<IndexEntry | null>(null);
	const [inputValue, setInputValue] = useState("");
	const [isOpen, setIsOpen] = useState(false);
	const [entryError, setEntryError] = useState<string | null>(null);
	const comboboxInputRef = useRef<HTMLInputElement>(null);
	const regionNameInputRef = useRef<HTMLInputElement>(null);
	const allowClearInputRef = useRef(false);

	const form = useForm({
		defaultValues: {
			regionName: "",
		},
		onSubmit: async () => {
			handleSubmit();
		},
	});

	useEffect(() => {
		// Focus the appropriate field based on draft type
		if (draft.type === "region") {
			regionNameInputRef.current?.focus();
		} else {
			comboboxInputRef.current?.focus();
		}
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

	const isNewEntry = !selectedValue && inputValue.trim();
	const buttonText = isNewEntry ? "Create & Attach" : "Attach";

	// Check if there are matching entries for the current input
	const hasMatchingEntries = inputValue
		? existingEntries.some((e) =>
				e.label.toLowerCase().includes(inputValue.toLowerCase()),
			)
		: existingEntries.length > 0;

	const handleValueChange = (value: IndexEntry | null) => {
		setSelectedValue(value);
		setEntryError(null);
		if (value) {
			setIsOpen(false);
			// Explicitly clear the input when an item is selected
			allowClearInputRef.current = true;
			setInputValue("");
		}
	};

	const handleOpenChange = (open: boolean) => {
		setIsOpen(open);
		// When dropdown closes, mark that we should preserve custom input values
		if (!open && !selectedValue && inputValue.trim()) {
			allowClearInputRef.current = false;
		}
	};

	const handleInputValueChange = (value: string) => {
		// Only prevent clearing if:
		// 1. We're trying to set empty string
		// 2. We haven't explicitly allowed clearing (via selection)
		// 3. The dropdown is closed (blur scenario)
		// 4. We have existing input
		if (
			value === "" &&
			!allowClearInputRef.current &&
			!isOpen &&
			inputValue.trim()
		) {
			return;
		}

		// Reset the flag after consuming it
		if (allowClearInputRef.current) {
			allowClearInputRef.current = false;
		}

		setInputValue(value);
		if (value.trim()) {
			setEntryError(null);
		}
	};

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

		// Validate entry selection/input
		if (!selectedValue && (!inputValue || !inputValue.trim())) {
			setEntryError("Please select or enter an entry");
			hasErrors = true;
		}

		if (hasErrors) {
			return;
		}

		// All validation passed, proceed with attachment
		const regionName =
			draft.type === "region" ? form.state.values.regionName : undefined;

		if (selectedValue) {
			onAttach({
				entryId: selectedValue.id,
				entryLabel: selectedValue.label,
				regionName,
			});
		} else if (inputValue.trim()) {
			const newEntryId = crypto.randomUUID();
			onAttach({
				entryId: newEntryId,
				entryLabel: inputValue.trim(),
				regionName,
			});
		}
	};

	const handleFormSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		// Allow form submission when dropdown is closed
		if (!isOpen) {
			handleSubmit();
		}
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
					<Combobox
						items={existingEntries.map((e) => e.label)}
						value={selectedValue?.label ?? null}
						onValueChange={(label) => {
							const entry = existingEntries.find((e) => e.label === label);
							handleValueChange(entry ?? null);
						}}
						inputValue={inputValue}
						onInputValueChange={handleInputValueChange}
						open={isOpen}
						onOpenChange={handleOpenChange}
					>
						<ComboboxInput
							ref={comboboxInputRef}
							placeholder="Search or create..."
							className="w-full"
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									// If dropdown is closed, submit the form
									if (!isOpen) {
										e.preventDefault();
										handleSubmit();
									}
									// If dropdown is open with no matches, close and submit
									else if (!hasMatchingEntries && inputValue.trim()) {
										e.preventDefault();
										setIsOpen(false);
										setTimeout(() => handleSubmit(), 50);
									}
									// Otherwise let combobox handle it (selection)
								}
							}}
						/>
						<ComboboxContent>
							<ComboboxEmpty>
								{inputValue
									? `Press enter to create entry for "${inputValue}"`
									: "Type to search entries"}
							</ComboboxEmpty>
							<ComboboxList>
								{(label) => {
									if (!label) return null;

									const entry = existingEntries.find((e) => e.label === label);
									if (!entry) return null;

									const parent = existingEntries.find(
										(e) => e.id === entry.parentId,
									);
									const displayLabel = parent
										? `${parent.label} → ${entry.label}`
										: entry.label;

									return (
										<ComboboxItem key={entry.id} value={label}>
											{displayLabel}
										</ComboboxItem>
									);
								}}
							</ComboboxList>
						</ComboboxContent>
					</Combobox>
					{entryError && <FieldError errors={[{ message: entryError }]} />}
				</div>

				<div className="flex gap-2 justify-end">
					<button
						type="button"
						onClick={onCancel}
						className="rounded border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-700"
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={handleSubmit}
						className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
					>
						{buttonText}
					</button>
				</div>
			</form>
		</>
	);
};
