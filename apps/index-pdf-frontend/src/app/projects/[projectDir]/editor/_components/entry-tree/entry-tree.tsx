"use client";

import { ErrorState } from "@pubint/yaboujee";
import { useEffect, useMemo, useState } from "react";
import { useUpdateEntryParent } from "@/app/_common/_hooks/use-update-entry-parent";
import type { IndexEntry } from "../../_types/index-entry";
import { DeleteEntryDialog } from "../delete-entry-dialog/delete-entry-dialog";
import type { Mention } from "../editor/editor";
import { EntryEditModal } from "../entry-edit-modal/entry-edit-modal";
import { EntryMergeModal } from "../entry-merge-modal/entry-merge-modal";
import { CreateEntryButton } from "./components/create-entry-button";
import { EntryItem } from "./components/entry-item";
import { EntryListSkeleton } from "./components/entry-list-skeleton";

export type EntryTreeProps = {
	entries: IndexEntry[]; // All entries for this index type
	mentions: Mention[]; // For showing counts
	projectId?: string; // Optional for hierarchy updates (disabled if not provided)
	projectIndexTypeId?: string; // For approval cache invalidation
	onEntryClick?: (entry: IndexEntry) => void; // Optional click handler
	onCreateEntry: () => void; // Open entry creation modal
	isLoading?: boolean; // Loading state
	error?: Error | null; // Error state
};

type EntryTreeNodeProps = {
	entry: IndexEntry;
	entries: IndexEntry[]; // All entries (for finding children and cross references)
	mentions: Mention[]; // For counts
	depth: number;
	projectId?: string;
	projectIndexTypeId?: string;
	onEntryClick?: (entry: IndexEntry) => void;
	onDragStart: (entryId: string) => void;
	onDrop: (targetEntryId: string | null) => void;
	draggedEntryId: string | null;
	onEdit?: (entry: IndexEntry) => void;
	onDelete?: (entry: IndexEntry) => void;
	onMerge?: (entry: IndexEntry) => void;
};

const EntryTreeNode = ({
	entry,
	entries,
	mentions,
	depth,
	projectId,
	projectIndexTypeId,
	onEntryClick,
	onDragStart,
	onDrop,
	draggedEntryId,
	onEdit,
	onDelete,
	onMerge,
}: EntryTreeNodeProps) => {
	const children = useMemo(
		() => entries.filter((e) => e.parentId === entry.id),
		[entries, entry.id],
	);

	const [expanded, setExpanded] = useState(true);

	const hasChildren = children.length > 0;

	return (
		<div className="flex flex-col gap-1">
			<EntryItem
				entry={entry}
				mentions={mentions}
				allEntries={entries}
				depth={depth}
				hasChildren={hasChildren}
				expanded={expanded}
				onToggleExpand={() => setExpanded(!expanded)}
				onClick={onEntryClick}
				onDragStart={onDragStart}
				onDrop={onDrop}
				isDragging={draggedEntryId === entry.id}
				projectId={projectId}
				projectIndexTypeId={projectIndexTypeId}
				onEdit={onEdit}
				onDelete={onDelete}
				onMerge={onMerge}
			/>
			{hasChildren && expanded && (
				<div className="flex flex-col gap-1">
					{children.map((child) => (
						<EntryTreeNode
							key={child.id}
							entry={child}
							entries={entries}
							mentions={mentions}
							depth={depth + 1}
							projectId={projectId}
							projectIndexTypeId={projectIndexTypeId}
							onEntryClick={onEntryClick}
							onDragStart={onDragStart}
							onDrop={onDrop}
							draggedEntryId={draggedEntryId}
							onEdit={onEdit}
							onDelete={onDelete}
							onMerge={onMerge}
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
	projectIndexTypeId,
	onEntryClick,
	onCreateEntry,
	isLoading = false,
	error = null,
}: EntryTreeProps) => {
	console.log("[EntryTree] Rendering with entries:", {
		count: entries.length,
		entries: entries.map((e) => ({ id: e.id, label: e.label })),
	});

	const [draggedEntryId, setDraggedEntryId] = useState<string | null>(null);
	const [isRootDropTarget, setIsRootDropTarget] = useState(false);
	const [editingEntry, setEditingEntry] = useState<IndexEntry | null>(null);
	const [deletingEntry, setDeletingEntry] = useState<IndexEntry | null>(null);
	const [mergingEntry, setMergingEntry] = useState<IndexEntry | null>(null);
	const updateParent = useUpdateEntryParent({ projectId });

	// Clear deletingEntry if it no longer exists in the entries list
	useEffect(() => {
		if (deletingEntry && !entries.find((e) => e.id === deletingEntry.id)) {
			console.log("[EntryTree] Clearing stale deletingEntry:", {
				deletedId: deletingEntry.id,
				deletedLabel: deletingEntry.label,
			});
			setDeletingEntry(null);
		}
	}, [entries, deletingEntry]);

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

	if (error) {
		return (
			<div className="p-4">
				<ErrorState
					title="Failed to load entries"
					message={error.message}
					onRetry={() => window.location.reload()}
				/>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="p-4">
				<EntryListSkeleton count={5} />
			</div>
		);
	}

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
		<>
			<div className="space-y-2">
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
						projectIndexTypeId={projectIndexTypeId}
						onEntryClick={onEntryClick}
						onDragStart={handleDragStart}
						onDrop={handleDrop}
						draggedEntryId={draggedEntryId}
						onEdit={setEditingEntry}
						onDelete={(entry) => {
							console.log("[EntryTree] onDelete called with entry:", {
								id: entry.id,
								label: entry.label,
							});
							setDeletingEntry(entry);
						}}
						onMerge={setMergingEntry}
					/>
				))}
			</div>

			{/* Modals */}
			{editingEntry && projectId && projectIndexTypeId && (
				<EntryEditModal
					open={true}
					onClose={() => setEditingEntry(null)}
					entry={editingEntry}
					projectId={projectId}
					projectIndexTypeId={projectIndexTypeId}
					existingEntries={entries}
				/>
			)}
			{mergingEntry && projectId && projectIndexTypeId && (
				<EntryMergeModal
					open={true}
					onClose={() => setMergingEntry(null)}
					sourceEntry={mergingEntry}
					existingEntries={entries}
					projectId={projectId}
					projectIndexTypeId={projectIndexTypeId}
					sourceEntryMentionCount={
						mentions.filter((m) => m.entryId === mergingEntry.id).length
					}
				/>
			)}
			{deletingEntry && (
				<>
					{console.log("[EntryTree] Rendering DeleteEntryDialog:", {
						deletingEntryId: deletingEntry.id,
						deletingEntryLabel: deletingEntry.label,
					})}
					<DeleteEntryDialog
						entry={deletingEntry}
						open={true}
						onOpenChange={(open) => {
							if (!open) setDeletingEntry(null);
						}}
					/>
				</>
			)}
		</>
	);
};
