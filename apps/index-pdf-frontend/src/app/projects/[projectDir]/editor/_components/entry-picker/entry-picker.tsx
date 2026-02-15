"use client";

import {
	Autocomplete,
	AutocompleteContent,
	AutocompleteEmpty,
	AutocompleteInput,
	AutocompleteItem,
	AutocompleteList,
} from "@pubint/yabasic/components/ui/autocomplete";
import { useCallback, useMemo, useState } from "react";
import type { IndexEntry } from "../../_types/index-entry";
import type { Mention } from "../editor/editor";
import { EntryLabel } from "./components/entry-label";
import { MentionCountBadge } from "./components/mention-count-badge";

export type EntryPickerProps = {
	indexType: string; // Current index type context
	entries: IndexEntry[]; // All entries (will be filtered to indexType)
	mentions: Mention[]; // For showing counts
	onValueChange: (entryId: string | null, entryLabel: string | null) => void;
	onCreateNew: (label: string) => void; // Trigger entry creation modal
	inputValue?: string; // Controlled input for external state
	onInputValueChange?: (value: string) => void;
	placeholder?: string;
};

const getFilteredEntries = ({
	entries,
	indexType,
	searchTerm,
}: {
	entries: IndexEntry[];
	indexType: string;
	searchTerm: string;
}): IndexEntry[] => {
	// Filter to index type
	let filtered = entries.filter((e) => e.indexType === indexType);

	// Filter by search term
	if (searchTerm) {
		const normalized = searchTerm.toLowerCase();
		filtered = filtered.filter((entry) => {
			// Check label
			if (entry.label.toLowerCase().includes(normalized)) return true;

			// Check matchers
			const matchers = entry.metadata?.matchers || [];
			return matchers.some((alias) => alias.toLowerCase().includes(normalized));
		});
	}

	return filtered;
};

const getMentionCount = ({
	entryId,
	mentions,
}: {
	entryId: string;
	mentions: Mention[];
}): number => {
	return mentions.filter((m) => m.entryId === entryId).length;
};

export const EntryPicker = ({
	indexType,
	entries,
	mentions,
	onValueChange,
	onCreateNew,
	inputValue: externalInputValue,
	onInputValueChange: externalOnInputValueChange,
	placeholder = "Search entries...",
}: EntryPickerProps) => {
	const [internalInputValue, setInternalInputValue] = useState("");
	const inputValue = externalInputValue ?? internalInputValue;
	const setInputValue = externalOnInputValueChange ?? setInternalInputValue;

	const filteredEntries = useMemo(
		() => getFilteredEntries({ entries, indexType, searchTerm: inputValue }),
		[entries, indexType, inputValue],
	);

	const handleItemClick = useCallback(
		(entry: IndexEntry) => {
			onValueChange(entry.id, entry.label);
			setInputValue(entry.label);
		},
		[onValueChange, setInputValue],
	);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Enter" && inputValue && filteredEntries.length === 0) {
				e.preventDefault();
				onCreateNew(inputValue);
			}
		},
		[inputValue, filteredEntries, onCreateNew],
	);

	// Disable Autocomplete's internal filtering since we handle it ourselves
	const disableInternalFilter = useCallback(() => true, []);

	return (
		<Autocomplete
			items={entries.filter((e) => e.indexType === indexType)}
			filteredItems={filteredEntries}
			value={inputValue}
			onValueChange={setInputValue}
			itemToStringValue={(entry: IndexEntry) => entry.label}
			filter={disableInternalFilter}
		>
			<AutocompleteInput
				placeholder={placeholder}
				onKeyDown={handleKeyDown}
				className="w-full"
			/>
			<AutocompleteContent>
				<AutocompleteEmpty>
					{inputValue ? (
						<div className="text-center text-sm text-gray-500">
							<p>No matching entries</p>
							<p className="mt-1">
								Press Enter to create &quot;{inputValue}&quot;
							</p>
						</div>
					) : (
						<p className="text-center text-sm text-gray-500">
							Type to search entries
						</p>
					)}
				</AutocompleteEmpty>
				<AutocompleteList>
					{(entry: IndexEntry) => {
						const mentionCount = getMentionCount({
							entryId: entry.id,
							mentions,
						});

						return (
							<AutocompleteItem
								key={entry.id}
								value={entry}
								onClick={() => handleItemClick(entry)}
							>
								<div className="flex items-center w-full">
									<EntryLabel entry={entry} entries={entries} />
									<MentionCountBadge count={mentionCount} />
								</div>
							</AutocompleteItem>
						);
					}}
				</AutocompleteList>
			</AutocompleteContent>
		</Autocomplete>
	);
};
