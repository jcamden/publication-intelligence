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
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@pubint/yabasic/components/ui/tooltip";
import { clsx } from "clsx";
import { useAtomValue } from "jotai";
import type { LucideIcon } from "lucide-react";
import { BookOpen, Edit2, Tags, Trash2, User, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { colorConfigAtom } from "../../_atoms/editor-atoms";
import { iconColorFromHue } from "../../_types/highlight-config";

export type Mention = {
	id: string;
	pageNumber: number;
	text: string;
	entryLabel: string;
	entryId: string;
	indexType: string;
	type: "text" | "region";
	pageSublocation?: string | null;
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
		entryId,
		entryLabel,
		text,
		pageSublocation,
	}: {
		mentionId: string;
		entryId?: string;
		entryLabel?: string;
		text?: string;
		pageSublocation?: string | null;
	}) => void;
	onCancel: () => void;
	initialMode?: "view" | "edit";
};

type SavedFormState = {
	text: string;
	entryId: string;
	entryLabel: string;
	selectedEntry: IndexEntry | null;
	inputValue: string;
	pageSublocation: string;
};

const INDEX_TYPE_CONFIG: Record<string, { label: string; icon: LucideIcon }> = {
	subject: { label: "Subject", icon: Tags },
	author: { label: "Author", icon: User },
	scripture: { label: "Scripture", icon: BookOpen },
};

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
	initialMode = "view",
}: MentionDetailsPopoverProps) => {
	const colorConfig = useAtomValue(colorConfigAtom);

	// Mode state
	const [mode, setMode] = useState<"view" | "edit">(initialMode);

	// Local state for editing
	const [localText, setLocalText] = useState(mention.text);
	const [localPageSublocation, setLocalPageSublocation] = useState(
		mention.pageSublocation || "",
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

	// Reset local state when mention changes
	useEffect(() => {
		setLocalText(mention.text);
		setLocalPageSublocation(mention.pageSublocation || "");

		const entry = existingEntries.find((e) => e.id === mention.entryId);
		setSelectedEntry(entry ?? null);
		setInputValue(entry?.label ?? "");

		// Reset to view mode when mention changes
		setMode("view");
		setSavedFormState(null);
	}, [mention.text, mention.pageSublocation, mention.entryId, existingEntries]);

	// Handle escape key to close popover
	useEffect(() => {
		const handleEscapeKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				onCancel();
			}
		};

		document.addEventListener("keydown", handleEscapeKey);
		return () => document.removeEventListener("keydown", handleEscapeKey);
	}, [onCancel]);

	const truncatedText =
		localText.length > 100 ? `${localText.substring(0, 100)}...` : localText;

	const getPrimaryIndexType = () => {
		const type = mention.indexType;
		if (!type) return null;
		const config = INDEX_TYPE_CONFIG[type];
		const hue =
			type in colorConfig
				? colorConfig[type as keyof typeof colorConfig]?.hue
				: undefined;
		const hueFallback = hue ?? 200;
		return {
			type,
			icon: config?.icon ?? Tags,
			label: config?.label ?? type,
			hue: hueFallback,
		};
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
		setSavedFormState({
			text: localText,
			entryId: mention.entryId,
			entryLabel: mention.entryLabel,
			selectedEntry,
			inputValue,
			pageSublocation: localPageSublocation,
		});
		setMode("edit");
	};

	const handleCancel = () => {
		if (savedFormState) {
			setLocalText(savedFormState.text);
			setSelectedEntry(savedFormState.selectedEntry);
			setInputValue(savedFormState.inputValue);
			setLocalPageSublocation(savedFormState.pageSublocation);
		}
		setMode("view");
	};

	const handleSave = () => {
		const entryChanged = selectedEntry?.id !== mention.entryId;
		const textChanged = localText !== mention.text;
		const sublocationChanged =
			localPageSublocation !== (mention.pageSublocation || "");

		if (entryChanged || textChanged || sublocationChanged) {
			onClose({
				mentionId: mention.id,
				...(entryChanged && selectedEntry
					? {
							entryId: selectedEntry.id,
							entryLabel: selectedEntry.label,
						}
					: {}),
				...(textChanged ? { text: localText } : {}),
				...(sublocationChanged
					? { pageSublocation: localPageSublocation || null }
					: {}),
			});
		}
		setMode("view");
	};

	if (mode === "view") {
		const primaryIndexType = getPrimaryIndexType();
		const PrimaryIcon = primaryIndexType?.icon ?? Tags;

		return (
			<div className="space-y-3">
				{/* Header with index type icon and close button */}
				<div className="flex items-center justify-between gap-2 pb-2 border-b border-neutral-200 dark:border-neutral-700">
					{/* Index type icon with tooltip (left) */}
					<Tooltip delay={300}>
						<TooltipTrigger
							render={
								<div className="flex-shrink-0">
									<PrimaryIcon
										className="w-4 h-4"
										style={{
											color: iconColorFromHue({
												hue: primaryIndexType?.hue ?? 200,
											}),
										}}
									/>
								</div>
							}
						/>
						<TooltipContent>
							{primaryIndexType?.label ?? "Index"} Index
						</TooltipContent>
					</Tooltip>

					{/* Close button (right) */}
					<Tooltip delay={300}>
						<TooltipTrigger
							render={
								<div className="flex-shrink-0">
									<button
										type="button"
										data-testid="close-button"
										onClick={onCancel}
										className="p-1 hover:bg-neutral-200 rounded dark:hover:bg-neutral-700"
										aria-label="Close"
									>
										<X className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
									</button>
								</div>
							}
						/>
						<TooltipContent>Close</TooltipContent>
					</Tooltip>
				</div>

				{/* Content */}
				<div className="space-y-3 text-sm">
					<div>
						<span className="text-neutral-500 dark:text-neutral-400">
							{mention.type === "text" ? "Text: " : "Region: "}
						</span>
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

					{mention.pageSublocation && (
						<div>
							<span className="text-neutral-500 dark:text-neutral-400">
								Page Sublocation:{" "}
							</span>
							<span className="text-neutral-900 dark:text-neutral-100">
								{mention.pageSublocation}
							</span>
						</div>
					)}
				</div>

				{/* Footer with edit and delete buttons */}
				<div className="flex items-center justify-between pt-2 border-t border-neutral-200 dark:border-neutral-700">
					{/* Edit button (left) */}
					<Tooltip delay={300}>
						<TooltipTrigger
							render={
								<div className="flex-shrink-0">
									<button
										type="button"
										data-testid="edit-button"
										onClick={handleEnterEditMode}
										className="p-1.5 hover:bg-neutral-200 rounded dark:hover:bg-neutral-700"
										aria-label="Edit"
									>
										<Edit2 className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
									</button>
								</div>
							}
						/>
						<TooltipContent>Edit</TooltipContent>
					</Tooltip>

					{/* Delete button (right) */}
					<Tooltip delay={300}>
						<TooltipTrigger
							render={
								<div className="flex-shrink-0">
									<button
										type="button"
										data-testid="delete-button"
										onClick={() => onDelete({ mentionId: mention.id })}
										className="p-1.5 hover:bg-red-100 rounded dark:hover:bg-red-900/30"
										aria-label="Delete"
									>
										<Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
									</button>
								</div>
							}
						/>
						<TooltipContent>Delete</TooltipContent>
					</Tooltip>
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
							Page Sublocation (optional):
						</span>
						<Input
							value={localPageSublocation}
							onChange={(e) => setLocalPageSublocation(e.target.value)}
							placeholder="e.g., 10:45.a"
							data-testid="sublocation-input"
						/>
						<p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
							For more precise page indexing (e.g., section 10, item 45a)
						</p>
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
