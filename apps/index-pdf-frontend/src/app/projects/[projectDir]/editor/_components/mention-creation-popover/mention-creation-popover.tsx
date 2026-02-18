"use client";

import { Button } from "@pubint/yabasic/components/ui/button";
import { FieldError } from "@pubint/yabasic/components/ui/field";
import { FormInput } from "@pubint/yaboujee";
import { useForm } from "@tanstack/react-form";
import { useAtomValue } from "jotai";
import { useEffect, useMemo, useRef, useState } from "react";
import { mentionCreationShowPageSublocationAtom } from "../../_atoms/editor-atoms";
import type { IndexEntry } from "../../_types/index-entry";
import { findEntryByText } from "../../_utils/index-entry-utils";
import type { Mention } from "../editor/editor";
import { EntryCreationModal } from "../entry-creation-modal";
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

type MentionCreationPopoverProps = {
	draft: MentionDraft;
	indexType: string;
	entries: IndexEntry[];
	mentions: Mention[];
	projectId: string;
	projectIndexTypeId: string;
	onAttach: ({
		entryId,
		entryLabel,
		regionName,
		pageSublocation,
	}: {
		entryId: string;
		entryLabel: string;
		regionName?: string;
		pageSublocation?: string;
	}) => void;
	onCancel: () => void;
	onModalStateChange?: (isOpen: boolean) => void;
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
	mentions: _mentions,
	projectId,
	projectIndexTypeId,
	onAttach,
	onCancel,
	onModalStateChange,
}: MentionCreationPopoverProps) => {
	const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
	const [selectedEntryLabel, setSelectedEntryLabel] = useState<string | null>(
		null,
	);
	const [entryError, setEntryError] = useState<string | null>(null);
	const regionNameInputRef = useRef<HTMLInputElement>(null);
	const showPageSublocation = useAtomValue(
		mentionCreationShowPageSublocationAtom,
	);

	// State for entry creation modal
	const [createEntryModalOpen, setCreateEntryModalOpen] = useState(false);
	const [createEntryLabel, setCreateEntryLabel] = useState("");
	const [createEntryParentId, setCreateEntryParentId] = useState<string | null>(
		null,
	);

	// Track entries locally to include newly created ones
	const [allEntries, setAllEntries] = useState(entries);

	// Update allEntries when entries prop changes
	useEffect(() => {
		console.log("[MentionCreationPopover] entries prop changed:", {
			count: entries.length,
			labels: entries.map((e) => e.label),
		});
		setAllEntries(entries);
	}, [entries]);

	// Filter entries to current index type
	const entriesForType = useMemo(() => {
		const filtered = allEntries.filter((e) => e.indexType === indexType);
		console.log("[MentionCreationPopover] entriesForType filtered:", {
			totalEntries: allEntries.length,
			filteredCount: filtered.length,
			indexType,
			allIndexTypes: [...new Set(allEntries.map((e) => e.indexType))],
		});
		return filtered;
	}, [allEntries, indexType]);

	const form = useForm({
		defaultValues: {
			regionName: "",
			pageSublocation: "",
		},
		onSubmit: async () => {
			handleSubmit();
		},
	});

	// Compute default input value based on selected text (≤3 words)
	const defaultInputValue = useMemo(() => {
		if (!draft.text) return "";

		const spaceCount = (draft.text.match(/ /g) || []).length;
		return spaceCount <= 2 ? draft.text.trim() : "";
	}, [draft.text]);

	// Check if selected text exactly matches an existing entry
	const hasExactMatch = useMemo(() => {
		if (!draft.text) return false;

		const spaceCount = (draft.text.match(/ /g) || []).length;
		if (spaceCount > 2) return false;

		const exactMatch = findEntryByText({
			entries: entriesForType,
			text: draft.text,
		});

		return !!exactMatch;
	}, [draft.text, entriesForType]);

	// Auto-select entry if exact match exists
	useEffect(() => {
		if (!draft.text) return;

		const spaceCount = (draft.text.match(/ /g) || []).length;

		if (spaceCount <= 2) {
			// Check if it matches an existing entry
			const exactMatch = findEntryByText({
				entries: entriesForType,
				text: draft.text,
			});

			if (exactMatch) {
				setSelectedEntryId(exactMatch.id);
				setSelectedEntryLabel(exactMatch.label);
			}
		}
	}, [draft.text, entriesForType]);

	useEffect(() => {
		// Focus the appropriate field based on draft type
		if (draft.type === "region") {
			regionNameInputRef.current?.focus();
		}
		// EntryPicker will auto-focus if autoFocus prop is true
	}, [draft.type]);

	// Escape key handler - don't close popover if modal is open
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape" && !createEntryModalOpen) {
				onCancel();
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [onCancel, createEntryModalOpen]);

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
			setEntryError("Please select or create an entry");
			hasErrors = true;
		}

		if (hasErrors) {
			return;
		}

		// All validation passed, proceed with attachment
		const regionName =
			draft.type === "region" ? form.state.values.regionName : undefined;
		const pageSublocation =
			indexType === "subject" && form.state.values.pageSublocation
				? form.state.values.pageSublocation
				: undefined;

		if (!selectedEntryId || !selectedEntryLabel) {
			throw new Error("Entry ID and label are required");
		}

		onAttach({
			entryId: selectedEntryId,
			entryLabel: selectedEntryLabel,
			regionName,
			pageSublocation,
		});
	};

	const handleFormSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		handleSubmit();
	};

	const handleCreateEntry = ({
		label,
		parentId,
	}: {
		label: string;
		parentId: string | null;
	}) => {
		console.log("[MentionCreationPopover] Opening entry creation modal");
		setCreateEntryLabel(label);
		setCreateEntryParentId(parentId);
		setCreateEntryModalOpen(true);
		onModalStateChange?.(true);
	};

	const handleEntryCreated = (newEntry: IndexEntry) => {
		console.log("[MentionCreationPopover] Entry created:", {
			entry: newEntry,
			indexType: newEntry.indexType,
			currentIndexType: indexType,
			matches: newEntry.indexType === indexType,
			currentAllEntriesCount: allEntries.length,
		});

		// Add to local entries list
		setAllEntries((prev) => {
			console.log("[MentionCreationPopover] Adding to local entries:", {
				prevCount: prev.length,
				newEntryId: newEntry.id,
				newEntryLabel: newEntry.label,
			});
			const updated = [...prev, newEntry];
			console.log("[MentionCreationPopover] Updated allEntries:", {
				previousCount: prev.length,
				newCount: updated.length,
				newEntry: newEntry,
			});
			return updated;
		});

		// Auto-select the new entry
		setSelectedEntryId(newEntry.id);
		setSelectedEntryLabel(newEntry.label);
		setEntryError(null);

		// Close modal
		setCreateEntryModalOpen(false);
		onModalStateChange?.(false);
	};

	const handleModalClose = () => {
		console.log("[MentionCreationPopover] Modal closed (cancel)");
		setCreateEntryModalOpen(false);
		onModalStateChange?.(false);
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
						entries={entriesForType}
						value={selectedEntryId}
						onValueChange={(id) => {
							console.log("[MentionCreationPopover] onValueChange called", {
								id,
							});
							setSelectedEntryId(id);
							const entry = entriesForType.find((e) => e.id === id);
							setSelectedEntryLabel(entry?.label || null);
							setEntryError(null);
						}}
						placeholder="Select entry..."
						showCreateOption={true}
						onCreateEntry={handleCreateEntry}
						autoFocus={draft.type === "text" && !hasExactMatch}
						defaultOpen={draft.type === "text" && !hasExactMatch}
						defaultInputValue={defaultInputValue}
					/>
					{entryError && <FieldError errors={[{ message: entryError }]} />}
				</div>

				{indexType === "subject" && showPageSublocation && (
					<form.Field name="pageSublocation">
						{(field) => (
							<div className="mb-3">
								<FormInput
									field={field}
									label="Page sublocation (optional)"
									placeholder="e.g., 10:45.a for section 10, item 45a"
								/>
								<p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
									Specify a location within the page for more precise indexing
								</p>
							</div>
						)}
					</form.Field>
				)}

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

			{/* Entry Creation Modal */}
			<EntryCreationModal
				open={createEntryModalOpen}
				onClose={handleModalClose}
				projectId={projectId}
				projectIndexTypeId={projectIndexTypeId}
				existingEntries={entriesForType}
				prefillLabel={createEntryLabel}
				prefillParentId={createEntryParentId}
				onEntryCreated={handleEntryCreated}
			/>
		</>
	);
};
