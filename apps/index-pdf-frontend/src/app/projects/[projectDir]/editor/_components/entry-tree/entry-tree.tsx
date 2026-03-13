"use client";

import { ErrorState } from "@pubint/yaboujee";
import { FolderOpen } from "lucide-react";
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

export type EntryTreeGroup = {
	id: string;
	name: string;
};

export type EntryTreeProps = {
	entries: IndexEntry[]; // All entries for this index type
	mentions: Mention[]; // For showing counts
	groups?: EntryTreeGroup[]; // Optional: when provided, render groups as bordered boxes
	projectId?: string; // Optional for hierarchy updates (disabled if not provided)
	projectIndexTypeId?: string; // For approval cache invalidation
	onEntryClick?: (entry: IndexEntry) => void; // Optional click handler
	onCreateEntry: () => void; // Open entry creation modal
	onCreateGroup?: () => void; // Open create group modal
	onEditGroup?: (groupId: string) => void; // Open edit group modal
	onAddEntryToGroup?: (groupId: string, entryId: string) => void; // Add root entry to group (e.g. on drag-drop)
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
	groups = [],
	projectId = "",
	projectIndexTypeId,
	onEntryClick,
	onCreateEntry,
	onCreateGroup,
	onEditGroup,
	onAddEntryToGroup,
	isLoading = false,
	error = null,
}: EntryTreeProps) => {
	const [draggedEntryId, setDraggedEntryId] = useState<string | null>(null);
	const [isRootDropTarget, setIsRootDropTarget] = useState(false);
	const [groupDropTargetId, setGroupDropTargetId] = useState<string | null>(
		null,
	);
	const [editingEntry, setEditingEntry] = useState<IndexEntry | null>(null);
	const [deletingEntry, setDeletingEntry] = useState<IndexEntry | null>(null);
	const [mergingEntry, setMergingEntry] = useState<IndexEntry | null>(null);
	const updateParent = useUpdateEntryParent({ projectId });

	// Clear deletingEntry if it no longer exists in the entries list
	useEffect(() => {
		if (deletingEntry && !entries.find((e) => e.id === deletingEntry.id)) {
			setDeletingEntry(null);
		}
	}, [entries, deletingEntry]);

	const topLevelEntries = useMemo(
		() => entries.filter((e) => e.parentId === null),
		[entries],
	);

	// Partition top-level entries by group (for group-as-section layout)
	const entriesByGroup = useMemo(() => {
		const byGroup = new Map<string | null, IndexEntry[]>();
		for (const entry of topLevelEntries) {
			const gid = entry.groupId ?? null;
			const list = byGroup.get(gid) ?? [];
			list.push(entry);
			byGroup.set(gid, list);
		}
		return byGroup;
	}, [topLevelEntries]);

	const ungroupedEntries = entriesByGroup.get(null) ?? [];
	const hasGroups = groups.length > 0;

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

	const handleGroupDragOver = (e: React.DragEvent, groupId: string) => {
		const entry = draggedEntryId
			? entries.find((x) => x.id === draggedEntryId)
			: null;
		const isRootEntry = entry?.parentId === null;
		if (isRootEntry && onAddEntryToGroup) {
			e.preventDefault();
			e.dataTransfer.dropEffect = "move";
			setGroupDropTargetId(groupId);
		}
	};

	const handleGroupDragLeave = (e: React.DragEvent, groupId: string) => {
		const related = e.relatedTarget as Node | null;
		if (
			groupDropTargetId === groupId &&
			(!related || !e.currentTarget.contains(related))
		) {
			setGroupDropTargetId(null);
		}
	};

	const handleGroupDrop = (e: React.DragEvent, groupId: string) => {
		e.preventDefault();
		e.stopPropagation();
		setGroupDropTargetId(null);
		if (
			draggedEntryId &&
			onAddEntryToGroup &&
			entries.some((x) => x.id === draggedEntryId && x.parentId === null)
		) {
			onAddEntryToGroup(groupId, draggedEntryId);
			setDraggedEntryId(null);
		}
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
				<div className="flex gap-2 justify-center">
					<CreateEntryButton onClick={onCreateEntry} />
					{onCreateGroup && (
						<button
							type="button"
							onClick={onCreateGroup}
							className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded dark:text-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 dark:border-gray-600"
						>
							<FolderOpen className="w-4 h-4" />
							<span>Create Group</span>
						</button>
					)}
				</div>
			</div>
		);
	}

	const renderEntryList = (listEntries: IndexEntry[]) =>
		listEntries.map((entry) => (
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
				onDelete={setDeletingEntry}
				onMerge={setMergingEntry}
			/>
		));

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
					<div className="flex gap-2">
						<CreateEntryButton onClick={onCreateEntry} />
						{onCreateGroup && (
							<button
								type="button"
								onClick={onCreateGroup}
								className="flex-1 flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded dark:text-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 dark:border-gray-600"
							>
								<FolderOpen className="w-4 h-4" />
								<span>Create Group</span>
							</button>
						)}
					</div>
					{isRootDropTarget && (
						<p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
							Drop here to move to top level
						</p>
					)}
				</div>

				{hasGroups ? (
					<>
						{/* Ungrouped entries (outside any group box) */}
						{ungroupedEntries.length > 0 && (
							<div className="space-y-1">
								{renderEntryList(ungroupedEntries)}
							</div>
						)}
						{/* Groups in bordered boxes (including empty groups for visibility and drag-drop) */}
						{groups.map((group) => {
							const groupEntries = entriesByGroup.get(group.id) ?? [];
							const isDropTarget = groupDropTargetId === group.id;
							return (
								<section
									key={group.id}
									aria-label={`Group: ${group.name}`}
									className={`border rounded-lg p-2 mb-2 transition-colors ${
										isDropTarget
											? "border-blue-400 bg-blue-50 dark:border-blue-500 dark:bg-blue-950/50"
											: "border-neutral-200 dark:border-neutral-700"
									}`}
									onDragOver={(e) => handleGroupDragOver(e, group.id)}
									onDragLeave={(e) => handleGroupDragLeave(e, group.id)}
									onDrop={(e) => handleGroupDrop(e, group.id)}
								>
									<button
										type="button"
										onClick={() => onEditGroup?.(group.id)}
										className="w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded mb-1"
									>
										<FolderOpen className="w-4 h-4" />
										{group.name}
									</button>
									<div className="space-y-1 min-h-[2px]">
										{groupEntries.length > 0 ? (
											renderEntryList(groupEntries)
										) : (
											<p className="text-xs text-neutral-500 dark:text-neutral-400 py-1 px-2">
												Drop entries here
											</p>
										)}
									</div>
								</section>
							);
						})}
					</>
				) : (
					<div className="space-y-1">{renderEntryList(topLevelEntries)}</div>
				)}
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
