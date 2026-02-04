"use client";

import { useMemo, useState } from "react";
import type { IndexEntry } from "../../_types/index-entry";
import type { Mention } from "../editor/editor";
import { CreateEntryButton } from "./components/create-entry-button";
import { EntryItem } from "./components/entry-item";

export type EntryTreeProps = {
	entries: IndexEntry[]; // All entries for this index type
	mentions: Mention[]; // For showing counts
	onEntryClick?: (entry: IndexEntry) => void; // Optional click handler
	onCreateEntry: () => void; // Open entry creation modal
};

type EntryTreeNodeProps = {
	entry: IndexEntry;
	entries: IndexEntry[]; // All entries (for finding children)
	mentions: Mention[]; // For counts
	depth: number;
	onEntryClick?: (entry: IndexEntry) => void;
};

const EntryTreeNode = ({
	entry,
	entries,
	mentions,
	depth,
	onEntryClick,
}: EntryTreeNodeProps) => {
	const children = useMemo(
		() => entries.filter((e) => e.parentId === entry.id),
		[entries, entry.id],
	);

	const [expanded, setExpanded] = useState(true);

	const hasChildren = children.length > 0;

	return (
		<div>
			<EntryItem
				entry={entry}
				mentions={mentions}
				depth={depth}
				hasChildren={hasChildren}
				expanded={expanded}
				onToggleExpand={() => setExpanded(!expanded)}
				onClick={onEntryClick}
			/>
			{hasChildren && expanded && (
				<div>
					{children.map((child) => (
						<EntryTreeNode
							key={child.id}
							entry={child}
							entries={entries}
							mentions={mentions}
							depth={depth + 1}
							onEntryClick={onEntryClick}
						/>
					))}
				</div>
			)}
		</div>
	);
};

export const EntryTree = ({
	entries,
	mentions,
	onEntryClick,
	onCreateEntry,
}: EntryTreeProps) => {
	const topLevelEntries = useMemo(
		() => entries.filter((e) => e.parentId === null),
		[entries],
	);

	if (entries.length === 0) {
		return (
			<div className="p-4 text-center">
				<p className="text-sm text-gray-500 mb-3 dark:text-gray-400">
					No entries yet
				</p>
				<CreateEntryButton onClick={onCreateEntry} />
			</div>
		);
	}

	return (
		<div className="space-y-1">
			<div className="p-2">
				<CreateEntryButton onClick={onCreateEntry} />
			</div>
			{topLevelEntries.map((entry) => (
				<EntryTreeNode
					key={entry.id}
					entry={entry}
					entries={entries}
					mentions={mentions}
					depth={0}
					onEntryClick={onEntryClick}
				/>
			))}
		</div>
	);
};
