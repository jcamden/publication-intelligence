"use client";

import { ErrorState } from "@pubint/yaboujee";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { RefObject } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { IndexEntry } from "@/app/projects/[projectDir]/_types/index-entry";
import { getChildEntries } from "@/app/projects/[projectDir]/_utils/entry-filters";
import { buildEntryMaps } from "@/app/projects/[projectDir]/_utils/entry-maps";
import {
	sortBookEntriesForGroup,
	sortUngroupedBooks,
	unknownFirstCompare,
} from "@/app/projects/[projectDir]/_utils/scripture-sort";
import { DeleteEntryDialog } from "../delete-entry-dialog/delete-entry-dialog";
import { DeleteGroupDialog } from "../delete-group-dialog/delete-group-dialog";
import type { Mention } from "../editor/editor";
import { EntryEditModal } from "../entry-edit-modal";
import { EntryMergeModal } from "../entry-merge-modal";
import { MergeGroupModal } from "../merge-group-modal";
import { useUpdateEntryParent } from "./_hooks/use-update-entry-parent";
import { EntryDropZone } from "./components/entry-drop-zone";
import { EntryItem } from "./components/entry-item";
import { EntryListSkeleton } from "./components/entry-list-skeleton";
import { GroupDropZone } from "./components/group-drop-zone";
import { GroupItem } from "./components/group-item";

export type EntryTreeGroup = {
	id: string;
	name: string;
	sortMode?:
		| "a_z"
		| "canon_book_order"
		| "custom"
		| "protestant"
		| "roman_catholic"
		| "tanakh"
		| "eastern_orthodox";
};

export type EntryTreeProps = {
	entries: IndexEntry[]; // All entries for this index type
	mentions?: Mention[]; // For showing counts (legacy)
	mentionCountsByEntryId?: Record<string, number>; // Preferred: avoids loading full mentions payload
	/** When empty, entries are shown as flat A-Z list. When provided, groups are shown as bordered boxes. */
	groups?: EntryTreeGroup[];
	projectId?: string; // Optional for hierarchy updates (disabled if not provided)
	projectIndexTypeId?: string; // For approval cache invalidation
	onEntryClick?: (entry: IndexEntry) => void; // Optional click handler
	onEditGroup?: (groupId: string) => void; // Open edit group modal
	onAddEntryToGroup?: (groupId: string, entryId: string) => void; // Add root entry to group (e.g. on drag-drop)
	onReorderGroups?: (groupIds: string[]) => void; // Reorder groups (drag to reorder)
	onReorderEntriesInGroup?: (groupId: string, entryIds: string[]) => void; // Reorder entries within group (custom sort only)
	/** Scroll viewport from IndexPanelScrollArea for virtualization. */
	scrollViewportRef?: RefObject<HTMLDivElement | null>;
	isLoading?: boolean; // Loading state
	error?: Error | null; // Error state
};

const LARGE_TREE_VIRTUALIZE_AFTER = 600;

export const EntryTree = ({
	entries,
	mentions = [],
	mentionCountsByEntryId,
	groups = [],
	projectId = "",
	projectIndexTypeId,
	onEntryClick,
	onEditGroup,
	onAddEntryToGroup,
	onReorderGroups,
	onReorderEntriesInGroup,
	scrollViewportRef,
	isLoading = false,
	error = null,
}: EntryTreeProps) => {
	const mentionCountByEntryId = useMemo(() => {
		if (mentionCountsByEntryId) {
			return new Map<string, number>(Object.entries(mentionCountsByEntryId));
		}
		const map = new Map<string, number>();
		for (const m of mentions) {
			map.set(m.entryId, (map.get(m.entryId) ?? 0) + 1);
		}
		return map;
	}, [mentionCountsByEntryId, mentions]);

	const [draggedEntryId, setDraggedEntryId] = useState<string | null>(null);
	const [draggedGroupId, setDraggedGroupId] = useState<string | null>(null);
	const [isRootDropTarget, setIsRootDropTarget] = useState(false);
	const [groupDropTargetId, setGroupDropTargetId] = useState<string | null>(
		null,
	);
	const [groupReorderDropIndex, setGroupReorderDropIndex] = useState<
		number | null
	>(null);
	const [entryReorderDropTarget, setEntryReorderDropTarget] = useState<{
		groupId: string;
		insertIndex: number;
	} | null>(null);
	const [editingEntry, setEditingEntry] = useState<IndexEntry | null>(null);
	const [deletingEntry, setDeletingEntry] = useState<IndexEntry | null>(null);
	const [mergingEntry, setMergingEntry] = useState<IndexEntry | null>(null);
	const [mergingGroup, setMergingGroup] = useState<EntryTreeGroup | null>(null);
	const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);
	const [collapsedGroupIds, setCollapsedGroupIds] = useState<Set<string>>(
		new Set(),
	);
	const updateParent = useUpdateEntryParent({ projectId });

	const toggleGroupExpanded = (groupId: string) => {
		setCollapsedGroupIds((prev) => {
			const next = new Set(prev);
			if (next.has(groupId)) next.delete(groupId);
			else next.add(groupId);
			return next;
		});
	};

	// Clear deletingEntry if it no longer exists in the entries list
	useEffect(() => {
		if (deletingEntry && !entries.find((e) => e.id === deletingEntry.id)) {
			setDeletingEntry(null);
		}
	}, [entries, deletingEntry]);

	const topLevelEntries = useMemo(
		() => getChildEntries({ entries, parentId: null }),
		[entries],
	);

	const { childrenByParent } = useMemo(
		() => buildEntryMaps(entries),
		[entries],
	);

	// Expanded entry ids (collapsed by default).
	const [expandedEntryIds, setExpandedEntryIds] = useState<Set<string>>(
		() => new Set(),
	);

	const toggleExpanded = (entryId: string) => {
		setExpandedEntryIds((prev) => {
			const next = new Set(prev);
			if (next.has(entryId)) next.delete(entryId);
			else next.add(entryId);
			return next;
		});
	};

	// Partition top-level entries by group (for group-as-section layout)
	// Sort by groupPosition when group has custom sort
	const entriesByGroup = useMemo(() => {
		const byGroup = new Map<string | null, IndexEntry[]>();
		for (const entry of topLevelEntries) {
			const gid = entry.groupId ?? null;
			const list = byGroup.get(gid) ?? [];
			list.push(entry);
			byGroup.set(gid, list);
		}

		// Sort ungrouped entries (Unknown first, then A-Z)
		sortUngroupedBooks(byGroup.get(null) ?? []);

		for (const group of groups) {
			const list = byGroup.get(group.id) ?? [];
			sortBookEntriesForGroup(list, group.sortMode);
		}
		return byGroup;
	}, [topLevelEntries, groups]);

	const ungroupedEntries = entriesByGroup.get(null) ?? [];
	const hasGroups = groups.length > 0;

	// When no groups: flat list with Unknown first, then A-Z
	const flatSortedRootEntries = useMemo(() => {
		return [...topLevelEntries].sort((a, b) => {
			const cmp = unknownFirstCompare(a, b);
			if (cmp !== 0) return cmp;
			return (a.label ?? "").localeCompare(b.label ?? "", undefined, {
				sensitivity: "base",
			});
		});
	}, [topLevelEntries]);

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

	const handleGroupDragStart = (groupId: string) => {
		setDraggedGroupId(groupId);
	};

	const handleGroupDropForReorder = (insertIndex: number) => {
		if (!draggedGroupId || insertIndex < 0 || !onReorderGroups) {
			setDraggedGroupId(null);
			setGroupReorderDropIndex(null);
			return;
		}
		const currentIds = groups.map((g) => g.id);
		const fromIdx = currentIds.indexOf(draggedGroupId);
		if (fromIdx === -1) {
			setDraggedGroupId(null);
			setGroupReorderDropIndex(null);
			return;
		}
		// Adjust insertIndex if we're moving from before the drop zone
		const toIdx = fromIdx < insertIndex ? insertIndex - 1 : insertIndex;
		const newIds = [...currentIds];
		newIds.splice(fromIdx, 1);
		newIds.splice(toIdx, 0, draggedGroupId);
		onReorderGroups(newIds);
		setDraggedGroupId(null);
		setGroupReorderDropIndex(null);
	};

	const handleEntryDropForReorder = (
		groupId: string,
		insertIndex: number,
		listEntries: IndexEntry[],
	) => {
		if (
			!draggedEntryId ||
			insertIndex < 0 ||
			!onReorderEntriesInGroup ||
			!listEntries.some((e) => e.id === draggedEntryId)
		) {
			setDraggedEntryId(null);
			setEntryReorderDropTarget(null);
			return;
		}
		const fromIdx = listEntries.findIndex((e) => e.id === draggedEntryId);
		const toIdx = fromIdx < insertIndex ? insertIndex - 1 : insertIndex;
		const newOrder = [...listEntries.map((e) => e.id)];
		newOrder.splice(fromIdx, 1);
		newOrder.splice(toIdx, 0, draggedEntryId);
		onReorderEntriesInGroup(groupId, newOrder);
		setDraggedEntryId(null);
		setEntryReorderDropTarget(null);
	};

	const handleGroupDropZoneDragOver = (
		e: React.DragEvent,
		insertIndex: number,
	) => {
		if (
			e.dataTransfer.types.includes("application/x-group-id") &&
			onReorderGroups
		) {
			e.preventDefault();
			e.dataTransfer.dropEffect = "move";
			e.stopPropagation();
			setEntryReorderDropTarget(null);
			setGroupReorderDropIndex(insertIndex);
		}
	};

	const handleGroupDropZoneDrop = (e: React.DragEvent, insertIndex: number) => {
		e.preventDefault();
		e.stopPropagation();
		if (e.dataTransfer.types.includes("application/x-group-id")) {
			handleGroupDropForReorder(insertIndex);
		}
	};

	const handleSectionDragOver = (e: React.DragEvent, groupId: string) => {
		// Only handle entry drag (add to group) - not group reorder
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

	const handleSectionDragLeave = (e: React.DragEvent, groupId: string) => {
		const related = e.relatedTarget as Node | null;
		if (!related || !e.currentTarget.contains(related)) {
			if (groupDropTargetId === groupId) setGroupDropTargetId(null);
		}
	};

	const handleSectionDrop = (e: React.DragEvent, groupId: string) => {
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

	const handleEntryDropZoneDragOver = (
		e: React.DragEvent,
		groupId: string,
		insertIndex: number,
	) => {
		if (!draggedEntryId || !onReorderEntriesInGroup) return;
		const entry = entries.find((x) => x.id === draggedEntryId);
		if (!entry || entry.parentId !== null) return;
		const groupEntries = entriesByGroup.get(groupId) ?? [];
		if (!groupEntries.some((e) => e.id === draggedEntryId)) return;
		e.preventDefault();
		e.dataTransfer.dropEffect = "move";
		e.stopPropagation();
		setGroupReorderDropIndex(null);
		setEntryReorderDropTarget({ groupId, insertIndex });
	};

	const handleEntryDropZoneDrop = (
		e: React.DragEvent,
		groupId: string,
		insertIndex: number,
		listEntries: IndexEntry[],
	) => {
		e.preventDefault();
		e.stopPropagation();
		handleEntryDropForReorder(groupId, insertIndex, listEntries);
	};

	const renderEntryList = (listEntries: IndexEntry[]) =>
		listEntries.map((entry) => renderSubtree(entry, 0));

	// Virtualized flattened tree for large indices. We intentionally disable
	// drag/drop features in this mode (they require stable DOM ordering).
	const localScrollRef = useRef<HTMLDivElement | null>(null);
	const scrollRef = scrollViewportRef ?? localScrollRef;
	const shouldVirtualize =
		draggedEntryId == null &&
		draggedGroupId == null &&
		onReorderGroups == null &&
		onReorderEntriesInGroup == null &&
		entries.length >= LARGE_TREE_VIRTUALIZE_AFTER;

	const flatRows = useMemo(() => {
		if (!shouldVirtualize)
			return [] as Array<{ entry: IndexEntry; depth: number }>;

		// Roots ordering
		const roots = hasGroups ? [...topLevelEntries] : [...flatSortedRootEntries];
		const out: Array<{ entry: IndexEntry; depth: number }> = [];

		const pushSubtree = (root: IndexEntry, depth: number) => {
			out.push({ entry: root, depth });
			if (!expandedEntryIds.has(root.id)) return;
			const children = [...(childrenByParent.get(root.id) ?? [])].sort((a, b) =>
				(a.label ?? "").localeCompare(b.label ?? "", undefined, {
					sensitivity: "base",
					numeric: true,
				}),
			);
			for (const child of children) pushSubtree(child, depth + 1);
		};

		// When groups exist, we still render a single list (groups are visual only).
		for (const r of roots) pushSubtree(r, 0);
		return out;
	}, [
		shouldVirtualize,
		hasGroups,
		topLevelEntries,
		flatSortedRootEntries,
		childrenByParent,
		expandedEntryIds,
	]);

	const rowVirtualizer = useVirtualizer({
		count: shouldVirtualize ? flatRows.length : 0,
		getScrollElement: () => scrollRef.current,
		estimateSize: () => 48,
		overscan: 12,
	});

	const renderSubtree = (entry: IndexEntry, depth: number): React.ReactNode => {
		const hasChildren = (childrenByParent.get(entry.id) ?? []).length > 0;
		const expanded = expandedEntryIds.has(entry.id);
		const isUnknown = entry.slug === "unknown";
		return (
			<div key={entry.id} className="flex flex-col gap-1">
				<EntryItem
					entry={entry}
					mentionCount={mentionCountByEntryId.get(entry.id) ?? 0}
					allEntries={entries}
					depth={depth}
					hasChildren={hasChildren}
					expanded={expanded}
					onToggleExpand={() => toggleExpanded(entry.id)}
					onClick={onEntryClick}
					onDragStart={handleDragStart}
					onDrop={handleDrop}
					isDragging={draggedEntryId === entry.id}
					projectId={projectId}
					projectIndexTypeId={projectIndexTypeId}
					onEdit={isUnknown ? undefined : setEditingEntry}
					onDelete={isUnknown ? undefined : setDeletingEntry}
					onMerge={isUnknown ? undefined : setMergingEntry}
				/>
				{hasChildren && expanded && (
					<div className="flex flex-col gap-1">
						{(childrenByParent.get(entry.id) ?? [])
							.slice()
							.sort((a, b) =>
								(a.label ?? "").localeCompare(b.label ?? "", undefined, {
									sensitivity: "base",
									numeric: true,
								}),
							)
							.map((child) => renderSubtree(child, depth + 1))}
					</div>
				)}
			</div>
		);
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
				<p className="text-sm text-gray-500 dark:text-gray-400">
					No entries yet
				</p>
			</div>
		);
	}

	return (
		<>
			<div className="space-y-2">
				{draggedEntryId && (
					<>
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
							{isRootDropTarget && (
								<p className="text-xs text-blue-600 dark:text-blue-400">
									Drop here to move to top level
								</p>
							)}
						</div>
					</>
				)}

				{shouldVirtualize ? (
					<div
						// This div itself isn't the scroller; ScrollArea viewport is.
						// We just need a positioning context for absolute rows.
						style={{
							height: rowVirtualizer.getTotalSize(),
							position: "relative",
						}}
					>
						{rowVirtualizer.getVirtualItems().map((v) => {
							const row = flatRows[v.index];
							const entry = row.entry;
							const hasChildren =
								(childrenByParent.get(entry.id) ?? []).length > 0;
							const isUnknown = entry.slug === "unknown";
							return (
								<div
									key={entry.id}
									style={{
										position: "absolute",
										top: 0,
										left: 0,
										width: "100%",
										transform: `translateY(${v.start}px)`,
									}}
								>
									<EntryItem
										entry={entry}
										mentionCount={mentionCountByEntryId.get(entry.id) ?? 0}
										allEntries={entries}
										depth={row.depth}
										hasChildren={hasChildren}
										expanded={expandedEntryIds.has(entry.id)}
										onToggleExpand={() => toggleExpanded(entry.id)}
										onClick={onEntryClick}
										onDragStart={handleDragStart}
										onDrop={handleDrop}
										isDragging={false}
										projectId={projectId}
										projectIndexTypeId={projectIndexTypeId}
										onEdit={isUnknown ? undefined : setEditingEntry}
										onDelete={isUnknown ? undefined : setDeletingEntry}
										onMerge={isUnknown ? undefined : setMergingEntry}
									/>
								</div>
							);
						})}
					</div>
				) : hasGroups ? (
					<>
						{/* Ungrouped entries (outside any group box) */}
						{ungroupedEntries.length > 0 && (
							<div className="space-y-1">
								{renderEntryList(ungroupedEntries)}
							</div>
						)}
						{/* Groups with drop zones between them (groups are not drop targets) */}
						{groups.flatMap((group, groupIndex) => {
							const groupEntries = entriesByGroup.get(group.id) ?? [];
							const isEntryDropTarget = groupDropTargetId === group.id;
							const isCustomSort = group.sortMode === "custom";
							return [
								<GroupDropZone
									key={`group-drop-before-${group.id}`}
									insertIndex={groupIndex}
									isActive={groupReorderDropIndex === groupIndex}
									onDragOver={(e) => handleGroupDropZoneDragOver(e, groupIndex)}
									onDragLeave={() => setGroupReorderDropIndex(null)}
									onDrop={(e) => handleGroupDropZoneDrop(e, groupIndex)}
								/>,
								<section
									key={group.id}
									aria-label={`Group: ${group.name}`}
									className={`border rounded-lg p-2 mb-2 transition-colors ${
										isEntryDropTarget
											? "border-blue-400 bg-blue-50 dark:border-blue-500 dark:bg-blue-950/50"
											: "border-[oklch(from_var(--section-item-bg)_calc(l-0.5)_calc(c*1.1)_h)] dark:border-[oklch(from_var(--section-item-bg)_calc(l+0.18)_calc(c*1.8)_h)] bg-[oklch(from_var(--section-item-bg)_calc(l+0.80)_calc(c*0.5)_h)] dark:bg-[oklch(from_var(--section-item-bg)_calc(l-0.18)_calc(c*0.8)_h)]"
									}`}
									onDragOver={(e) => handleSectionDragOver(e, group.id)}
									onDragLeave={(e) => handleSectionDragLeave(e, group.id)}
									onDrop={(e) => handleSectionDrop(e, group.id)}
								>
									<GroupItem
										group={group}
										hasEntries={groupEntries.length > 0}
										expanded={!collapsedGroupIds.has(group.id)}
										onToggleExpand={() => toggleGroupExpanded(group.id)}
										onEdit={onEditGroup}
										onDelete={(id) => setDeletingGroupId(id)}
										onMerge={() => setMergingGroup(group)}
										onDragStart={handleGroupDragStart}
										isDragging={draggedGroupId === group.id}
									/>
									{!collapsedGroupIds.has(group.id) && (
										<div className="space-y-1 min-h-[2px] mt-1">
											{groupEntries.length > 0 ? (
												isCustomSort && onReorderEntriesInGroup ? (
													<div className="flex flex-col gap-1">
														{groupEntries.flatMap((entry, entryIndex) => [
															<EntryDropZone
																key={`entry-drop-${group.id}-before-${entry.id}`}
																insertIndex={entryIndex}
																isActive={
																	entryReorderDropTarget?.groupId ===
																		group.id &&
																	entryReorderDropTarget?.insertIndex ===
																		entryIndex
																}
																onDragOver={(e) =>
																	handleEntryDropZoneDragOver(
																		e,
																		group.id,
																		entryIndex,
																	)
																}
																onDragLeave={() =>
																	setEntryReorderDropTarget(null)
																}
																onDrop={(e) =>
																	handleEntryDropZoneDrop(
																		e,
																		group.id,
																		entryIndex,
																		groupEntries,
																	)
																}
															/>,
															renderSubtree(entry, 0),
														])}
														<EntryDropZone
															key={`entry-drop-${group.id}-end`}
															insertIndex={groupEntries.length}
															isActive={
																entryReorderDropTarget?.groupId === group.id &&
																entryReorderDropTarget?.insertIndex ===
																	groupEntries.length
															}
															onDragOver={(e) =>
																handleEntryDropZoneDragOver(
																	e,
																	group.id,
																	groupEntries.length,
																)
															}
															onDragLeave={() =>
																setEntryReorderDropTarget(null)
															}
															onDrop={(e) =>
																handleEntryDropZoneDrop(
																	e,
																	group.id,
																	groupEntries.length,
																	groupEntries,
																)
															}
														/>
													</div>
												) : (
													renderEntryList(groupEntries)
												)
											) : (
												<p className="text-xs text-neutral-500 dark:text-neutral-400 py-1 px-2">
													Drop entries here
												</p>
											)}
										</div>
									)}
								</section>,
							];
						})}
						<GroupDropZone
							key="group-drop-end"
							insertIndex={groups.length}
							isActive={groupReorderDropIndex === groups.length}
							onDragOver={(e) => handleGroupDropZoneDragOver(e, groups.length)}
							onDragLeave={() => setGroupReorderDropIndex(null)}
							onDrop={(e) => handleGroupDropZoneDrop(e, groups.length)}
						/>
					</>
				) : (
					<div className="space-y-1">
						{renderEntryList(flatSortedRootEntries)}
					</div>
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
				<DeleteEntryDialog
					entry={deletingEntry}
					open={true}
					onOpenChange={(open) => {
						if (!open) setDeletingEntry(null);
					}}
				/>
			)}
			{deletingGroupId && projectId && projectIndexTypeId && (
				<DeleteGroupDialog
					groupId={deletingGroupId}
					projectId={projectId}
					projectIndexTypeId={projectIndexTypeId}
					groups={groups}
					open={true}
					onOpenChange={(open) => {
						if (!open) setDeletingGroupId(null);
					}}
					onMergeGroup={(id) => {
						const group = groups.find((g) => g.id === id);
						if (group) {
							setDeletingGroupId(null);
							setMergingGroup(group);
						}
					}}
				/>
			)}
			{mergingGroup && projectId && projectIndexTypeId && (
				<MergeGroupModal
					open={true}
					onClose={() => setMergingGroup(null)}
					sourceGroup={mergingGroup}
					groups={groups.filter((g) => g.id !== mergingGroup.id)}
					projectId={projectId}
					projectIndexTypeId={projectIndexTypeId}
					onMerged={() => setMergingGroup(null)}
				/>
			)}
		</>
	);
};
