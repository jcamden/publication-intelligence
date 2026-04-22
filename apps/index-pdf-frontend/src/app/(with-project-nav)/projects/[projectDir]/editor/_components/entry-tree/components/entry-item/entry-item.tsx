import { useMemo, useState } from "react";
import { formatCrossReferencesAsSegments } from "@/app/projects/[projectDir]/_utils/cross-reference-utils";
import type { IndexEntry } from "../../../../_types/index-entry";
import type { Mention } from "../../../editor/editor";
import { TreeRow } from "../tree-row";
import { useApproveEntry } from "./_hooks/use-approve-entry";

export type EntryItemProps = {
	entry: IndexEntry;
	mentions: Mention[];
	allEntries: IndexEntry[]; // For formatting cross references with full labels
	depth: number;
	hasChildren: boolean;
	expanded: boolean;
	onToggleExpand: () => void;
	onClick?: (entry: IndexEntry) => void;
	onDragStart: (entryId: string) => void;
	onDrop: (targetEntryId: string | null) => void;
	isDragging: boolean;
	projectId?: string; // For approval mutation
	projectIndexTypeId?: string; // For cache invalidation
	onEdit?: (entry: IndexEntry) => void;
	onDelete?: (entry: IndexEntry) => void;
	onMerge?: (entry: IndexEntry) => void;
};

export const EntryItem = ({
	entry,
	mentions,
	allEntries,
	depth,
	hasChildren,
	expanded,
	onToggleExpand,
	onClick,
	onDragStart,
	onDrop,
	isDragging,
	projectId,
	projectIndexTypeId,
	onEdit,
	onDelete,
	onMerge,
}: EntryItemProps) => {
	const [isDropTarget, setIsDropTarget] = useState(false);
	const approveEntry = useApproveEntry({
		projectId: projectId || "",
		projectIndexTypeId,
	});

	const mentionCount = useMemo(
		() => mentions.filter((m) => m.entryId === entry.id).length,
		[mentions, entry.id],
	);

	const crossReferenceSegments = useMemo(
		() =>
			formatCrossReferencesAsSegments({
				crossReferences: entry.crossReferences ?? [],
				allEntries,
			}),
		[entry.crossReferences, allEntries],
	);

	const isSuggested = entry.status === "suggested";

	const handleApprove = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (!projectId) return;
		approveEntry.mutate({ id: entry.id, projectId });
	};

	const handleDragStart = (e: React.DragEvent) => {
		e.dataTransfer.effectAllowed = "move";
		e.dataTransfer.setData("text/plain", entry.id);
		onDragStart(entry.id);
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = "move";
		setIsDropTarget(true);
	};

	const handleDragLeave = () => {
		setIsDropTarget(false);
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDropTarget(false);
		onDrop(entry.id);
	};

	return (
		<TreeRow
			variant="entry"
			label={entry.label}
			onDragStart={handleDragStart}
			onDrop={handleDrop}
			onDragOver={handleDragOver}
			onDragLeave={handleDragLeave}
			isDragging={isDragging}
			isDropTarget={isDropTarget}
			onEdit={onEdit ? () => onEdit(entry) : undefined}
			onDelete={onDelete ? () => onDelete(entry) : undefined}
			onMerge={onMerge ? () => onMerge(entry) : undefined}
			depth={depth}
			showDragHandle={entry.slug !== "unknown"}
			draggable={entry.slug !== "unknown"}
			onClick={() => onClick?.(entry)}
			hasChildren={hasChildren}
			expanded={expanded}
			onToggleExpand={onToggleExpand}
			mentionCount={mentionCount}
			isSuggested={isSuggested}
			onApprove={handleApprove}
			approveDisabled={approveEntry.isPending}
			crossReferenceSegments={crossReferenceSegments}
			projectId={projectId}
		/>
	);
};
