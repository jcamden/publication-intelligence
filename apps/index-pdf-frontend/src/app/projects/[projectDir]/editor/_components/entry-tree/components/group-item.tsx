"use client";

import { TreeRow } from "./tree-row";

export type GroupItemProps = {
	group: { id: string; name: string };
	hasEntries: boolean;
	expanded: boolean;
	onToggleExpand: () => void;
	onEdit?: (groupId: string) => void;
	onDelete?: (groupId: string) => void;
	onMerge?: (groupId: string) => void;
	onDragStart: (groupId: string) => void;
	isDragging: boolean;
};

export const GroupItem = ({
	group,
	hasEntries,
	expanded,
	onToggleExpand,
	onEdit,
	onDelete,
	onMerge,
	onDragStart,
	isDragging,
}: GroupItemProps) => {
	const handleDragStart = (e: React.DragEvent) => {
		e.dataTransfer.effectAllowed = "move";
		e.dataTransfer.setData("application/x-group-id", group.id);
		e.dataTransfer.setData("text/plain", group.id);
		onDragStart(group.id);
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = "move";
	};

	const handleDragLeave = () => {
		// No-op; groups are not drop targets
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		// Groups are not drop targets; drop zones handle reorder
	};

	return (
		<TreeRow
			variant="group"
			label={group.name}
			hasChildren={hasEntries}
			expanded={expanded}
			onToggleExpand={onToggleExpand}
			onDragStart={handleDragStart}
			onDrop={handleDrop}
			onDragOver={handleDragOver}
			onDragLeave={handleDragLeave}
			isDragging={isDragging}
			isDropTarget={false}
			onEdit={onEdit ? () => onEdit(group.id) : undefined}
			onDelete={onDelete ? () => onDelete(group.id) : undefined}
			onMerge={onMerge ? () => onMerge(group.id) : undefined}
			depth={0}
			showDragHandle={true}
		/>
	);
};
