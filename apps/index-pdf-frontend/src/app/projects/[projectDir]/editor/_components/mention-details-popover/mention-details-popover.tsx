"use client";

import { Button } from "@pubint/yabasic/components/ui/button";
import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from "@pubint/yabasic/components/ui/combobox";
import { Input } from "@pubint/yabasic/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@pubint/yabasic/components/ui/select";
import { clsx } from "clsx";
import { useRef, useState } from "react";

export type Mention = {
	id: string;
	pageNumber: number;
	text: string;
	entryLabel: string;
	entryId: string;
	indexTypes: string[];
	type: "text" | "region";
};

export type IndexEntry = {
	id: string;
	label: string;
	parentId: string | null;
};

export type MentionDetailsPopoverProps = {
	mention: Mention;
	existingEntries: IndexEntry[];
	onDelete: ({ mentionId }: { mentionId: string }) => void;
	onClose: ({
		mentionId,
		indexTypes,
		entryId,
		entryLabel,
		text,
	}: {
		mentionId: string;
		indexTypes: string[];
		entryId?: string;
		entryLabel?: string;
		text?: string;
	}) => void;
	onCancel: () => void;
};

type SavedFormState = {
	text: string;
	entryId: string;
	entryLabel: string;
	indexTypes: string[];
	selectedEntry: IndexEntry | null;
	inputValue: string;
};

const AVAILABLE_INDEX_TYPES = [
	{ value: "subject", label: "Subject" },
	{ value: "author", label: "Author" },
	{ value: "scripture", label: "Scripture" },
];

/**
 * Popover for displaying mention details with Edit/Delete actions
 *
 * Shows when clicking an existing highlight in view mode.
 * Allows user to edit the linked IndexEntry or delete the mention.
 *
 * ARCHITECTURE:
 * - Manages local state for index types and entry selection while editing
 * - Saves changes when popover closes via onClose callback
 * - This allows user to make multiple changes before committing
 *
 * NOTE: This is a pure content component. Positioning is handled by
 * PdfAnnotationPopover wrapper (see Task 4B pattern).
 */
export const MentionDetailsPopover = ({
	mention,
	existingEntries,
	onDelete,
	onClose,
	onCancel,
}: MentionDetailsPopoverProps) => {
	// Mode state
	const [mode, setMode] = useState<"view" | "edit">("view");

	// Local state for editing
	const [localText, setLocalText] = useState(mention.text);
	const [localIndexTypes, setLocalIndexTypes] = useState<string[]>(
		mention.indexTypes,
	);

	// Local state for entry selection
	const initialEntry = existingEntries.find((e) => e.id === mention.entryId);
	const [selectedEntry, setSelectedEntry] = useState<IndexEntry | null>(
		initialEntry ?? null,
	);
	const [inputValue, setInputValue] = useState(initialEntry?.label ?? "");
	const [isComboboxOpen, setIsComboboxOpen] = useState(false);
	const allowClearInputRef = useRef(false);

	// Saved form state for Cancel functionality
	const [savedFormState, setSavedFormState] = useState<SavedFormState | null>(
		null,
	);

	const truncatedText =
		localText.length > 100 ? `${localText.substring(0, 100)}...` : localText;

	const formatIndexTypes = (types: string[]) => {
		return types
			.map(
				(type) =>
					AVAILABLE_INDEX_TYPES.find((t) => t.value === type)?.label || type,
			)
			.join(", ");
	};

	const handleIndexTypesChange = (value: string[] | string | null) => {
		const newTypes = Array.isArray(value) ? value : value ? [value] : [];
		setLocalIndexTypes(newTypes);
	};

	const handleEntryValueChange = (entry: IndexEntry | null) => {
		setSelectedEntry(entry);
		if (entry) {
			setIsComboboxOpen(false);
			// Explicitly clear the input when an item is selected
			allowClearInputRef.current = true;
			setInputValue("");
		}
	};

	const handleComboboxOpenChange = (open: boolean) => {
		setIsComboboxOpen(open);
		// When dropdown closes, mark that we should preserve custom input values
		if (!open && !selectedEntry && inputValue.trim()) {
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
			!isComboboxOpen &&
			inputValue.trim()
		) {
			return;
		}

		// Reset the flag after consuming it
		if (allowClearInputRef.current) {
			allowClearInputRef.current = false;
		}

		setInputValue(value);
	};

	const handleEnterEditMode = () => {
		// Save current state before entering edit mode
		setSavedFormState({
			text: localText,
			entryId: mention.entryId,
			entryLabel: mention.entryLabel,
			indexTypes: [...localIndexTypes],
			selectedEntry,
			inputValue,
		});
		setMode("edit");
	};

	const handleCancel = () => {
		// Restore saved state
		if (savedFormState) {
			setLocalText(savedFormState.text);
			setLocalIndexTypes(savedFormState.indexTypes);
			setSelectedEntry(savedFormState.selectedEntry);
			setInputValue(savedFormState.inputValue);
		}
		setMode("view");
	};

	const handleSave = () => {
		const indexTypesChanged =
			JSON.stringify(localIndexTypes.sort()) !==
			JSON.stringify(mention.indexTypes.sort());
		const entryChanged = selectedEntry?.id !== mention.entryId;
		const textChanged = localText !== mention.text;

		// Only call onClose if something actually changed
		if (indexTypesChanged || entryChanged || textChanged) {
			onClose({
				mentionId: mention.id,
				indexTypes: localIndexTypes,
				...(entryChanged && selectedEntry
					? {
							entryId: selectedEntry.id,
							entryLabel: selectedEntry.label,
						}
					: {}),
				...(textChanged ? { text: localText } : {}),
			});
		}
		setMode("view");
	};

	if (mode === "view") {
		return (
			<div className="space-y-3">
				<div>
					<div className="space-y-3 text-sm">
						<div>
							<span className="text-neutral-500 dark:text-neutral-400">
								{mention.type === "text" ? "Text: " : "Region: "}
							</span>
							<br />
							<span
								className={clsx(
									"text-neutral-900 dark:text-neutral-100",
									mention.type === "text" && "italic",
								)}
							>
								{truncatedText}
							</span>
						</div>

						<div>
							<span className="text-neutral-500 dark:text-neutral-400">
								Entry:{" "}
							</span>
							<span className="text-neutral-900 dark:text-neutral-100">
								{mention.entryLabel}
							</span>
						</div>

						<div>
							<span className="text-neutral-500 dark:text-neutral-400">
								Index:{" "}
							</span>
							<span className="text-neutral-900 dark:text-neutral-100">
								{formatIndexTypes(localIndexTypes) || "None"}
							</span>
						</div>

						<div>
							<span className="text-neutral-500 dark:text-neutral-400">
								Page:{" "}
							</span>
							<span className="text-neutral-900 dark:text-neutral-100">
								{mention.pageNumber}
							</span>
						</div>
					</div>
				</div>

				<div className="flex gap-2 justify-end pt-2 border-t border-neutral-200 dark:border-neutral-700">
					<Button
						type="button"
						data-testid="edit-button"
						onClick={handleEnterEditMode}
						variant="outline"
						size="sm"
					>
						Edit
					</Button>
					<Button
						type="button"
						data-testid="close-button"
						onClick={onCancel}
						variant="outline"
						size="sm"
					>
						Close
					</Button>
				</div>
			</div>
		);
	}

	// Edit mode
	return (
		<div className="space-y-3">
			<div>
				<div className="space-y-3 text-sm">
					<div>
						<span className="text-neutral-500 dark:text-neutral-400 text-sm mb-1 block">
							{mention.type === "text" ? "Text:" : "Region:"}
						</span>
						{mention.type === "region" ? (
							<Input
								value={localText}
								onChange={(e) => setLocalText(e.target.value)}
								placeholder="Enter region description..."
								data-testid="region-text-input"
							/>
						) : (
							<span
								className={clsx(
									"text-neutral-900 dark:text-neutral-100 italic",
								)}
							>
								{truncatedText}
							</span>
						)}
					</div>

					<div>
						<span className="text-neutral-500 dark:text-neutral-400 text-sm mb-1 block">
							Entry:
						</span>
						<Combobox
							items={existingEntries.map((e) => e.label)}
							value={selectedEntry?.label ?? null}
							onValueChange={(label) => {
								const entry = existingEntries.find((e) => e.label === label);
								handleEntryValueChange(entry ?? null);
							}}
							inputValue={inputValue}
							onInputValueChange={handleInputValueChange}
							open={isComboboxOpen}
							onOpenChange={handleComboboxOpenChange}
						>
							<ComboboxInput
								placeholder="Search entries..."
								className="w-full"
								data-testid="entry-combobox"
							/>
							<ComboboxContent>
								<ComboboxEmpty>
									{inputValue
										? "No matching entries"
										: "Type to search entries"}
								</ComboboxEmpty>
								<ComboboxList>
									{(label) => {
										if (!label) return null;

										const entry = existingEntries.find(
											(e) => e.label === label,
										);
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
					</div>

					<div>
						<span className="text-neutral-500 dark:text-neutral-400 text-sm mb-1 block">
							Index:
						</span>
						<Select
							multiple
							value={localIndexTypes}
							onValueChange={handleIndexTypesChange}
							items={AVAILABLE_INDEX_TYPES}
						>
							<SelectTrigger
								size="sm"
								className="w-full"
								data-testid="index-types-select"
							>
								<SelectValue placeholder="Select index type(s)" />
							</SelectTrigger>
							<SelectContent>
								{AVAILABLE_INDEX_TYPES.map((indexType) => (
									<SelectItem key={indexType.value} value={indexType.value}>
										{indexType.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div>
						<span className="text-neutral-500 dark:text-neutral-400">
							Page:{" "}
						</span>
						<span className="text-neutral-900 dark:text-neutral-100">
							{mention.pageNumber}
						</span>
					</div>
				</div>
			</div>

			<div className="flex gap-2 justify-between pt-2 border-t border-neutral-200 dark:border-neutral-700">
				<Button
					type="button"
					data-testid="delete-button"
					onClick={() => onDelete({ mentionId: mention.id })}
					variant="destructive"
					size="sm"
				>
					Delete
				</Button>
				<div className="flex gap-2">
					<Button
						type="button"
						data-testid="cancel-button"
						onClick={handleCancel}
						variant="outline"
						size="sm"
					>
						Cancel
					</Button>
					<Button
						type="button"
						data-testid="save-button"
						onClick={handleSave}
						variant="default"
						size="sm"
					>
						Save
					</Button>
				</div>
			</div>
		</div>
	);
};
