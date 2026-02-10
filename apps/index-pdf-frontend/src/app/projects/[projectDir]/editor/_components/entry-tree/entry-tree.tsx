"use client";

import { useMemo, useState } from "react";
import { useUpdateEntryParent } from "@/app/_common/_hooks/use-update-entry-parent";
import type { IndexEntry } from "../../_types/index-entry";
import type { Mention } from "../editor/editor";
import { CreateEntryButton } from "./components/create-entry-button";
import { EntryItem } from "./components/entry-item";

export type EntryTreeProps = {
	entries: IndexEntry[]; // All entries for this index type
	mentions: Mention[]; // For showing counts
	projectId?: string; // Optional for hierarchy updates (disabled if not provided)
	onEntryClick?: (entry: IndexEntry) => void; // Optional click handler
	onCreateEntry: () => void; // Open entry creation modal
};

type EntryTreeNodeProps = {
	entry: IndexEntry;
	entries: IndexEntry[]; // All entries (for finding children)
	mentions: Mention[]; // For counts
	depth: number;
	projectId?: string;
	onEntryClick?: (entry: IndexEntry) => void;
	onDragStart: (entryId: string) => void;
	onDrop: (targetEntryId: string | null) => void;
	draggedEntryId: string | null;
};

const EntryTreeNode = ({
	entry,
	entries,
	mentions,
	depth,
	projectId,
	onEntryClick,
	onDragStart,
	onDrop,
	draggedEntryId,
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
				onDragStart={onDragStart}
				onDrop={onDrop}
				isDragging={draggedEntryId === entry.id}
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
							projectId={projectId}
							onEntryClick={onEntryClick}
							onDragStart={onDragStart}
							onDrop={onDrop}
							draggedEntryId={draggedEntryId}
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
	projectId = "",
	onEntryClick,
	onCreateEntry,
}: EntryTreeProps) => {
	const [draggedEntryId, setDraggedEntryId] = useState<string | null>(null);
	const [isRootDropTarget, setIsRootDropTarget] = useState(false);
	const updateParent = useUpdateEntryParent({ projectId });

	const topLevelEntries = useMemo(
		() => entries.filter((e) => e.parentId === null),
		[entries],
	);

	const handleDragStart = (entryId: string) => {
		setDraggedEntryId(entryId);
	};

	const handleDrop = (targetEntryId: string | null) => {
		if (!draggedEntryId || draggedEntryId === targetEntryId || !projectId) {
			setDraggedEntryId(null);
			return;
		}

		updateParent.mutate({
			id: draggedEntryId,
			parentId: targetEntryId,
		});

		setDraggedEntryId(null);
	};

	const handleRootDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = "move";
		setIsRootDropTarget(true);
	};

	const handleRootDragLeave = () => {
		setIsRootDropTarget(false);
	};

	const handleRootDrop = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsRootDropTarget(false);
		handleDrop(null);
	};

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
			{/* biome-ignore lint/a11y/useSemanticElements: Drag-drop zone requires div */}
			<div
				role="button"
				tabIndex={0}
				className={`p-2 rounded transition-colors ${
					isRootDropTarget ? "bg-blue-100 dark:bg-blue-900" : ""
				}`}
				onDragOver={handleRootDragOver}
				onDragLeave={handleRootDragLeave}
				onDrop={handleRootDrop}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
					}
				}}
			>
				<CreateEntryButton onClick={onCreateEntry} />
				{isRootDropTarget && (
					<p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
						Drop here to move to top level
					</p>
				)}
			</div>
			{topLevelEntries.map((entry) => (
				<EntryTreeNode
					key={entry.id}
					entry={entry}
					entries={entries}
					mentions={mentions}
					depth={0}
					projectId={projectId}
					onEntryClick={onEntryClick}
					onDragStart={handleDragStart}
					onDrop={handleDrop}
					draggedEntryId={draggedEntryId}
				/>
			))}
		</div>
	);
};
