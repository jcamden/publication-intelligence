"use client";

export type GroupDropZoneProps = {
	insertIndex: number;
	isActive: boolean;
	onDragOver: (e: React.DragEvent) => void;
	onDragLeave: (e: React.DragEvent) => void;
	onDrop: (e: React.DragEvent) => void;
};

export const GroupDropZone = ({
	insertIndex,
	isActive,
	onDragOver,
	onDragLeave,
	onDrop,
}: GroupDropZoneProps) => {
	return (
		<section
			aria-label="Insertion point for group"
			className={`min-h-6 -my-3 transition-colors ${
				isActive ? "bg-blue-200 dark:bg-blue-800 rounded" : ""
			}`}
			onDragOver={onDragOver}
			onDragLeave={onDragLeave}
			onDrop={onDrop}
			data-drop-index={insertIndex}
		/>
	);
};
