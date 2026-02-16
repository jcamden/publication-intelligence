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

type EntryPickerProps = {
	entries: IndexEntry[];
	value: string | null;
	onValueChange: (value: string | null) => void;
	placeholder?: string;
	excludeIds?: string[];
	allowClear?: boolean;
	className?: string;
	id?: string;
};

/**
 * Hierarchical, searchable entry picker with "Under" navigation.
 *
 * Features:
 * - Search/filter by entry label
 * - Navigate into children with "Under" option or by typing "Parent > "
 * - Shows full hierarchy path in input (e.g., "Animals > Mammals > ")
 * - Shows full hierarchy for selected entry
 * - Optional clear selection
 * - Excludes specified entry IDs
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
}: EntryPickerProps) => {
	const [open, setOpen] = useState(false);
	const [inputValue, setInputValue] = useState("");
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
		// Normalize input only if it contains ">": collapse multiple spaces around > and trim
		const normalizedInput = inputValue.includes(">")
			? inputValue.replace(/\s*>\s*/g, " > ").trim()
			: inputValue.trim();
		const separatorCount = (normalizedInput.match(/>/g) || []).length;
		const endsWithNavigator = normalizedInput.endsWith(" >");

		// If user tried to navigate (ends with >) but navigation didn't happen,
		// it means they typed an invalid entry name - show no results
		if (endsWithNavigator && separatorCount !== navigationStack.length) {
			return [];
		}

		// First filter by current navigation level
		let levelEntries = entries.filter(
			(e) => e.parentId === currentParentId && !excludeIds.includes(e.id),
		);

		// Apply search filter if query exists
		const isSearching = normalizedInput && !endsWithNavigator;
		if (isSearching) {
			// Extract the last segment for searching (after the last >)
			const segments = normalizedInput.split(">").map((s) => s.trim());
			const lastSegment = segments[segments.length - 1];
			const query = lastSegment.toLowerCase();
			levelEntries = levelEntries.filter((e) =>
				e.label.toLowerCase().includes(query),
			);
		} else if (!normalizedInput) {
			// Only exclude selected entry when not searching (dropdown just opened)
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
			.join(" > ");
	};

	const handleNavigateUnder = (entryId: string) => {
		const newStack = [...navigationStack, entryId];
		setNavigationStack(newStack);
		const path = buildNavigationPath(newStack);
		setInputValue(`${path} > `);
	};

	const findEntryByPath = (pathString: string): IndexEntry | null => {
		const segments = pathString
			.split(">")
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
					!excludeIds.includes(e.id),
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
			// Build navigation stack from the selected entry's parents
			const stack: string[] = [];
			let current = selectedEntry;
			while (current.parentId) {
				stack.unshift(current.parentId);
				const parent = entries.find((e) => e.id === current.parentId);
				if (!parent) break;
				current = parent;
			}

			// Check if user is trying to navigate into children with " >"
			const normalized = newValue.includes(">")
				? newValue.replace(/\s*>\s*/g, " > ").trim()
				: newValue;
			if (normalized === `${displayPath} >`) {
				const hasChildren = entries.some(
					(e) => e.parentId === selectedEntry.id,
				);
				if (hasChildren) {
					// Navigate into the selected entry's children
					// Build the full stack including the selected entry
					const fullStack = [...stack, selectedEntry.id];
					setNavigationStack(fullStack);
					const path = buildNavigationPath(fullStack);
					setInputValue(`${path} > `);
					return;
				}
			}

			// Not navigating, just set the stack and input value
			setNavigationStack(stack);
			setInputValue(newValue);
			return;
		}

		// Normalize input only if it contains ">": collapse multiple spaces around > and trim
		const normalizedValue = newValue.includes(">")
			? newValue.replace(/\s*>\s*/g, " > ").trim()
			: newValue;
		const separatorCount = (normalizedValue.match(/>/g) || []).length;
		const expectedSeparatorCount = navigationStack.length;

		// If user has backspaced to remove a " > ", pop the navigation stack
		if (separatorCount < expectedSeparatorCount && navigationStack.length > 0) {
			const newStack = navigationStack.slice(0, separatorCount);
			setNavigationStack(newStack);
			// Update input to match the new stack
			if (newStack.length > 0) {
				const path = buildNavigationPath(newStack);
				setInputValue(`${path} > `);
			} else {
				setInputValue("");
			}
			return;
		}

		setInputValue(newValue);

		// Check if user typed ">" to navigate into an entry
		if (
			normalizedValue.endsWith(" >") &&
			separatorCount > expectedSeparatorCount
		) {
			// Extract the last segment after the last ">"
			const segments = normalizedValue.split(">").map((s) => s.trim());
			const lastSegment = segments[segments.length - 2]; // -2 because last one is empty after ">"

			if (lastSegment) {
				const searchText = lastSegment.toLowerCase();
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
							return (
								<div
									key={entry.id}
									className={`flex items-center justify-between hover:bg-neutral-100 dark:hover:bg-neutral-800 group pr-2 ${
										isSingleResult ? "bg-neutral-50 dark:bg-neutral-800/50" : ""
									}`}
								>
									<ComboboxItem value={entry.id} className="flex-1 min-w-0">
										{entry.label}
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
											Under &gt;
										</button>
									)}
								</div>
							);
						})
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
