"use client";

import {
	Combobox,
	ComboboxContent,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from "@pubint/yabasic/components/ui/combobox";
import { X } from "lucide-react";
import type React from "react";
import { useMemo, useState } from "react";
import type { IndexEntry } from "../../_types/index-entry";
import { getEntryDisplayLabel } from "../../_utils/index-entry-utils";

const hasSeeCrossReference = (entry: IndexEntry): boolean =>
	entry.crossReferences?.some((ref) => ref.relationType === "see") ?? false;

type EntryPickerProps = {
	entries: IndexEntry[];
	value: string | null;
	onValueChange: (value: string | null) => void;
	placeholder?: string;
	excludeIds?: string[];
	allowClear?: boolean;
	className?: string;
	id?: string;
	showCreateOption?: boolean;
	onCreateEntry?: ({
		label,
		parentId,
	}: {
		label: string;
		parentId: string | null;
	}) => void;
	autoFocus?: boolean;
	defaultOpen?: boolean;
	defaultInputValue?: string;
};

/**
 * Hierarchical, searchable entry picker with Chicago-style parent:child format.
 *
 * Features:
 * - Search/filter by entry label; all entries (including children) appear at top level as "parent:child"
 * - Navigate into children with "Under" option or by typing "parent:"
 * - Display and selection use "parent:child" format
 * - Optional clear selection
 * - Excludes specified entry IDs
 * - Hides entries that have a "See" cross-reference (they cannot be targets)
 */
export const EntryPicker = ({
	entries,
	value,
	onValueChange,
	placeholder = "Select entry...",
	excludeIds = [],
	allowClear = false,
	className,
	id,
	showCreateOption = false,
	onCreateEntry,
	autoFocus = false,
	defaultOpen = false,
	defaultInputValue = "",
}: EntryPickerProps) => {
	const [open, setOpen] = useState(defaultOpen);
	const [inputValue, setInputValue] = useState(defaultInputValue);
	const [navigationStack, setNavigationStack] = useState<string[]>([]);

	const selectedEntry = useMemo(
		() => (value ? entries.find((e) => e.id === value) : null),
		[value, entries],
	);

	const currentParentId = useMemo(
		() =>
			navigationStack.length > 0
				? navigationStack[navigationStack.length - 1]
				: null,
		[navigationStack],
	);

	// Compute display value: show selected entry hierarchy or input value
	const displayValue = useMemo(() => {
		if (inputValue) return inputValue;
		if (selectedEntry && !open) {
			return getEntryDisplayLabel({ entry: selectedEntry, entries });
		}
		return "";
	}, [inputValue, selectedEntry, entries, open]);

	const filteredEntries = useMemo(() => {
		const normalizedInput = inputValue.trim();
		const segments = normalizedInput.split(":").map((s) => s.trim());
		const endsWithColon = normalizedInput.endsWith(":");

		// If user typed "parent:" but we haven't navigated yet, show no results until we sync
		if (endsWithColon && segments.length - 1 !== navigationStack.length) {
			const prefixPath = segments.slice(0, -1).filter(Boolean);
			if (
				prefixPath.length > 0 &&
				prefixPath.length !== navigationStack.length
			) {
				return [];
			}
		}

		// At top level show all entries; when narrowed show only children of current parent.
		// Exclude entries that have a "See" cross-reference (they cannot be targets).
		let levelEntries =
			currentParentId === null
				? entries.filter(
						(e) => !excludeIds.includes(e.id) && !hasSeeCrossReference(e),
					)
				: entries.filter(
						(e) =>
							e.parentId === currentParentId &&
							!excludeIds.includes(e.id) &&
							!hasSeeCrossReference(e),
					);

		// Apply search filter
		const isSearching = normalizedInput && !endsWithColon;
		if (isSearching) {
			if (currentParentId === null) {
				const query = normalizedInput.toLowerCase();
				levelEntries = levelEntries.filter((e) =>
					getEntryDisplayLabel({ entry: e, entries })
						.toLowerCase()
						.includes(query),
				);
			} else {
				const lastSegment = segments[segments.length - 1];
				const query = lastSegment.toLowerCase();
				levelEntries = levelEntries.filter((e) =>
					e.label.toLowerCase().includes(query),
				);
			}
		} else if (!normalizedInput) {
			levelEntries = levelEntries.filter((e) => e.id !== value);
		}

		return levelEntries;
	}, [
		entries,
		currentParentId,
		excludeIds,
		value,
		inputValue,
		navigationStack.length,
	]);

	const handleSelect = (entryId: string | null) => {
		onValueChange(entryId);
		setOpen(false);
		setInputValue("");
		setNavigationStack([]);
	};

	const buildNavigationPath = (stack: string[]): string => {
		return stack
			.map((id) => entries.find((e) => e.id === id)?.label || "")
			.filter(Boolean)
			.join(":");
	};

	const handleNavigateUnder = (entryId: string) => {
		const newStack = [...navigationStack, entryId];
		setNavigationStack(newStack);
		const path = buildNavigationPath(newStack);
		setInputValue(`${path}:`);
	};

	const findEntryByPath = (pathString: string): IndexEntry | null => {
		const segments = pathString
			.split(":")
			.map((s) => s.trim())
			.filter(Boolean);
		if (segments.length === 0) return null;

		let currentParent: string | null = null;
		let currentEntry: IndexEntry | null = null;

		for (const segment of segments) {
			const found = entries.find(
				(e) =>
					e.parentId === currentParent &&
					e.label.toLowerCase() === segment.toLowerCase() &&
					!excludeIds.includes(e.id) &&
					!hasSeeCrossReference(e),
			);
			if (!found) return null;
			currentEntry = found;
			currentParent = found.id;
		}

		return currentEntry;
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			e.preventDefault();
			e.stopPropagation();

			// First, check if there's an exact match for the full typed path
			const typedPath = inputValue.trim();
			if (typedPath) {
				const matchedEntry = findEntryByPath(typedPath);
				if (matchedEntry) {
					handleSelect(matchedEntry.id);
					return;
				}
			}

			// If only one filtered entry, select it
			if (filteredEntries.length === 1) {
				handleSelect(filteredEntries[0].id);
				return;
			}

			// If multiple or no entries, do nothing (Combobox will still close, known limitation)
		}
	};

	const handleInputChange = (newValue: string) => {
		const normalizedValue = newValue.trim();
		const segments = normalizedValue.split(":").map((s) => s.trim());
		const endsWithColon = normalizedValue.endsWith(":");

		// If user starts typing after having a selected value (inputValue was empty)
		// AND they don't have an active navigation session, rebuild navigation context
		if (
			inputValue === "" &&
			selectedEntry &&
			newValue &&
			navigationStack.length === 0
		) {
			const displayPath = getEntryDisplayLabel({
				entry: selectedEntry,
				entries,
			});
			const stack: string[] = [];
			let current = selectedEntry;
			while (current.parentId) {
				stack.unshift(current.parentId);
				const parent = entries.find((e) => e.id === current.parentId);
				if (!parent) break;
				current = parent;
			}

			if (normalizedValue === `${displayPath}:`) {
				const hasChildren = entries.some(
					(e) => e.parentId === selectedEntry.id,
				);
				if (hasChildren) {
					const fullStack = [...stack, selectedEntry.id];
					setNavigationStack(fullStack);
					const path = buildNavigationPath(fullStack);
					setInputValue(`${path}:`);
					return;
				}
			}

			setNavigationStack(stack);
			setInputValue(newValue);
			return;
		}

		// If user backspaced and removed a ":", pop the navigation stack
		const prefixSegments = endsWithColon
			? segments.slice(0, -1)
			: segments.filter((_, i) => i < segments.length - 1 || !normalizedValue);
		const expectedDepth = navigationStack.length;
		if (
			prefixSegments.length < expectedDepth &&
			!endsWithColon &&
			navigationStack.length > 0
		) {
			const newStack = navigationStack.slice(0, prefixSegments.length);
			setNavigationStack(newStack);
			if (newStack.length > 0) {
				const path = buildNavigationPath(newStack);
				setInputValue(`${path}:`);
			} else {
				setInputValue("");
			}
			return;
		}

		setInputValue(newValue);

		// If user typed "parent:" to navigate into an entry at current level
		if (endsWithColon && segments.length > navigationStack.length) {
			const segmentBeforeColon = segments[segments.length - 2];
			if (segmentBeforeColon) {
				const searchText = segmentBeforeColon.toLowerCase();
				const matchingEntry = entries.find(
					(e) =>
						e.parentId === currentParentId &&
						e.label.toLowerCase() === searchText &&
						!excludeIds.includes(e.id),
				);

				if (matchingEntry) {
					const hasChildren = entries.some(
						(e) => e.parentId === matchingEntry.id,
					);
					if (hasChildren) {
						handleNavigateUnder(matchingEntry.id);
					}
				}
			}
		}
	};

	const handleOpenChange = (newOpen: boolean) => {
		setOpen(newOpen);
		if (!newOpen) {
			setInputValue("");
			setNavigationStack([]);
		}
	};

	const handleCreateEntry = () => {
		if (!onCreateEntry) return;

		const segments = inputValue
			.split(":")
			.map((s) => s.trim())
			.filter(Boolean);
		const label =
			segments.length > 0 ? segments[segments.length - 1] : inputValue.trim();

		const parentId =
			navigationStack.length > 0
				? navigationStack[navigationStack.length - 1]
				: null;

		onCreateEntry({ label, parentId });
	};

	return (
		<Combobox
			value={value}
			onValueChange={handleSelect}
			open={open}
			onOpenChange={handleOpenChange}
		>
			<ComboboxInput
				id={id}
				placeholder={placeholder}
				value={displayValue}
				onChange={(e) => handleInputChange(e.currentTarget.value)}
				onKeyDown={handleKeyDown}
				showTrigger={false}
				showClear={false}
				className={className}
				autoFocus={autoFocus}
			/>
			<ComboboxContent>
				<ComboboxList>
					{/* Clear Selection */}
					{allowClear && value && navigationStack.length === 0 && (
						<button
							type="button"
							onClick={() => handleSelect(null)}
							className="w-full px-3 py-2 text-left text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2"
						>
							<X className="h-4 w-4" />
							Clear selection
						</button>
					)}

					{/* Entry Items */}
					{filteredEntries.length > 0 ? (
						filteredEntries.map((entry) => {
							const hasChildren = entries.some((e) => e.parentId === entry.id);
							const isSingleResult = filteredEntries.length === 1;
							const displayLabel =
								currentParentId === null
									? getEntryDisplayLabel({ entry, entries })
									: entry.label;
							return (
								<div
									key={entry.id}
									className={`flex items-center justify-between hover:bg-neutral-100 dark:hover:bg-neutral-800 group pr-2 ${
										isSingleResult ? "bg-neutral-50 dark:bg-neutral-800/50" : ""
									}`}
								>
									<ComboboxItem value={entry.id} className="flex-1 min-w-0">
										{displayLabel}
									</ComboboxItem>
									{hasChildren && (
										<button
											type="button"
											onPointerDown={(e) => {
												e.preventDefault();
												e.stopPropagation();
											}}
											onClick={(e) => {
												e.preventDefault();
												e.stopPropagation();
												handleNavigateUnder(entry.id);
											}}
											className="h-6 px-2 text-xs shrink-0 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 z-10"
										>
											Under :
										</button>
									)}
								</div>
							);
						})
					) : showCreateOption && onCreateEntry && inputValue.trim() ? (
						<div className="px-3 py-4 text-center">
							<p className="text-sm text-neutral-500 mb-3">No entries found</p>
							<button
								type="button"
								onPointerDown={(e) => {
									e.preventDefault();
									e.stopPropagation();
								}}
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									handleCreateEntry();
								}}
								className="px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 rounded transition-colors"
							>
								Create new entry: "
								{inputValue
									.split(":")
									.map((s) => s.trim())
									.filter(Boolean)
									.pop() || inputValue.trim()}
								"
							</button>
						</div>
					) : (
						<div className="px-3 py-8 text-center text-sm text-neutral-500">
							No entries found
						</div>
					)}
				</ComboboxList>
			</ComboboxContent>
		</Combobox>
	);
};
