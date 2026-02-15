import { ChevronDown, ChevronRight, GripVertical } from "lucide-react";
import { useMemo, useState } from "react";
import { ApproveSuggestionButton } from "@/app/_common/_components/approve-suggestion-button";
import { useApproveEntry } from "@/app/_common/_hooks/use-approve-entry";
import type { IndexEntry } from "../../../_types/index-entry";
import type { Mention } from "../../editor/editor";

export type EntryItemProps = {
	entry: IndexEntry;
	mentions: Mention[];
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
};

export const EntryItem = ({
	entry,
	mentions,
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
		// biome-ignore lint/a11y/useSemanticElements: Draggable element requires div
		<div
			role="button"
			tabIndex={0}
			draggable
			onDragStart={handleDragStart}
			onDragOver={handleDragOver}
			onDragLeave={handleDragLeave}
			onDrop={handleDrop}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					onClick?.(entry);
				}
			}}
			className={`group border-1 h-10 flex items-center gap-2 px-2 py-1.5 rounded transition-colors ${
				isDragging
					? "opacity-50 bg-gray-200 dark:bg-gray-700"
					: isDropTarget
						? "bg-blue-100 dark:bg-blue-900"
						: "hover:bg-gray-100 dark:hover:bg-gray-800"
			}`}
			style={{ marginLeft: `${0 + depth * 20}px` }}
		>
			{/* Drag handle */}
			<div className="flex-shrink-0 cursor-move opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity">
				<GripVertical className="w-4 h-4 text-gray-400" />
			</div>

			{/* Expand/collapse icon */}
			{hasChildren && (
				<button
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						onToggleExpand();
					}}
					className="flex-shrink-0 w-4 h-4 flex items-center justify-center hover:bg-gray-200 rounded dark:hover:bg-gray-700"
				>
					{expanded ? (
						<ChevronDown className="w-3 h-3" />
					) : (
						<ChevronRight className="w-3 h-3" />
					)}
				</button>
			)}

			{/* Entry label */}
			<button
				type="button"
				onClick={() => onClick?.(entry)}
				className="flex-1 text-sm font-medium text-gray-900 truncate text-left dark:text-gray-100"
			>
				{entry.label}
			</button>

			{/* Approve button (for suggested entries) */}
			{isSuggested && projectId && (
				<ApproveSuggestionButton
					onClick={handleApprove}
					disabled={approveEntry.isPending}
					size="sm"
				/>
			)}

			{/* Mention count badge */}
			{mentionCount > 0 && (
				<span className="flex-shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
					{mentionCount}
				</span>
			)}
		</div>
	);
};
