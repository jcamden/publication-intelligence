"use client";

export type EntryDropZoneProps = {
	insertIndex: number;
	isActive: boolean;
	onDragOver: (e: React.DragEvent) => void;
	onDragLeave: (e: React.DragEvent) => void;
	onDrop: (e: React.DragEvent) => void;
};

export const EntryDropZone = ({
	insertIndex,
	isActive,
	onDragOver,
	onDragLeave,
	onDrop,
}: EntryDropZoneProps) => {
	return (
		<section
			aria-label="Insertion point for entry"
			className={`min-h-6 -my-3.5 transition-colors ${
				isActive ? "bg-blue-200 dark:bg-blue-800 rounded" : ""
			}`}
			onDragOver={onDragOver}
			onDragLeave={onDragLeave}
			onDrop={onDrop}
			data-drop-index={insertIndex}
		/>
	);
};
