"use client";

import {
	ChevronDown,
	ChevronRight,
	Edit2,
	Folder,
	FolderOpen,
	GripVertical,
	Merge,
	Trash2,
} from "lucide-react";
import { ApproveSuggestionButton } from "@/app/projects/[projectDir]/editor/_components/approve-suggestion-button";

type CrossReferenceSegment = { text: string; italic: boolean };

type TreeRowBase = {
	label: string;
	onDragStart: (e: React.DragEvent) => void;
	onDrop: (e: React.DragEvent) => void;
	onDragOver: (e: React.DragEvent) => void;
	onDragLeave: () => void;
	isDragging: boolean;
	isDropTarget: boolean;
	onEdit?: () => void;
	onDelete?: () => void;
	onMerge?: () => void;
	depth: number;
	showDragHandle: boolean;
	/** When false, row is not draggable (e.g. Unknown entry). Defaults to true. */
	draggable?: boolean;
	onClick?: () => void;
};

export type TreeRowEntryProps = TreeRowBase & {
	variant: "entry";
	hasChildren: boolean;
	expanded: boolean;
	onToggleExpand: () => void;
	mentionCount: number;
	isSuggested: boolean;
	onApprove: (e: React.MouseEvent) => void;
	approveDisabled?: boolean;
	crossReferenceSegments: CrossReferenceSegment[];
	projectId?: string;
};

export type TreeRowGroupProps = TreeRowBase & {
	variant: "group";
	hasChildren: boolean;
	expanded: boolean;
	onToggleExpand: () => void;
};

export type TreeRowProps = TreeRowEntryProps | TreeRowGroupProps;

export const TreeRow = (props: TreeRowProps) => {
	const {
		variant,
		label,
		onDragStart,
		onDrop,
		onDragOver,
		onDragLeave,
		isDragging,
		isDropTarget,
		onEdit,
		onDelete,
		onMerge,
		depth,
		showDragHandle,
		draggable = true,
		onClick,
	} = props;

	const isEntry = variant === "entry";
	const hasChildren =
		(isEntry && props.hasChildren) ||
		(variant === "group" && props.hasChildren);
	const expanded = isEntry
		? props.expanded
		: variant === "group"
			? props.expanded
			: false;
	const mentionCount = isEntry ? props.mentionCount : 0;
	const isSuggested = isEntry && props.isSuggested;
	const crossReferenceSegments = isEntry ? props.crossReferenceSegments : [];

	return (
		// biome-ignore lint/a11y/useSemanticElements: Draggable element requires div
		<div
			role="button"
			tabIndex={0}
			draggable={draggable}
			onDragStart={onDragStart}
			onDragOver={onDragOver}
			onDragLeave={onDragLeave}
			onDrop={onDrop}
			onClick={(e) => {
				// If any child button didn't call stopPropagation, guard here.
				e.stopPropagation();
				onClick?.();
			}}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					onClick?.();
				}
			}}
			className={`group min-h-10 flex flex-col gap-1 px-2 py-1.5 rounded transition-colors ${
				variant === "entry"
					? "border-1 border-[oklch(from_var(--section-item-bg)_calc(l-0.5)_calc(c*1.1)_h)] dark:border-[oklch(from_var(--section-item-bg)_calc(l+0.18)_calc(c*1.8)_h)] "
					: ""
			}${
				isDragging
					? "opacity-50 bg-gray-200 dark:bg-gray-700"
					: isDropTarget
						? "bg-blue-100 dark:bg-blue-900"
						: variant === "group"
							? "bg-transparent"
							: "bg-[var(--section-item-bg,transparent)] dark:bg-[oklch(from_var(--section-item-bg)_calc(l+0.08)_calc(c*1.8)_h)] hover:brightness-115 dark:hover:brightness-75"
			}`}
			style={{ marginLeft: `${depth * 20}px` }}
		>
			<div className="flex items-center gap-0">
				{/* Drag handle */}
				{showDragHandle && (
					<div className="flex-shrink-0 cursor-move opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity">
						<GripVertical className="w-4 h-4 text-gray-400" />
					</div>
				)}

				{/* Expand/collapse icon or spacer */}
				{variant === "group" ? (
					<button
						type="button"
						draggable={false}
						onMouseDown={(e) => {
							// Prevent the parent draggable container from starting a drag
							// which can swallow this click.
							e.preventDefault();
						}}
						onClick={(e) => {
							e.stopPropagation();
							props.onToggleExpand();
						}}
						className="flex-shrink-0 min-w-8 min-h-8 flex items-center justify-center hover:bg-gray-200 rounded cursor-pointer dark:hover:bg-gray-700"
					>
						{expanded ? (
							<FolderOpen className="w-4 h-4 text-gray-500 dark:text-gray-400" />
						) : (
							<Folder className="w-4 h-4 text-gray-500 dark:text-gray-400" />
						)}
					</button>
				) : hasChildren ? (
					<button
						type="button"
						draggable={false}
						onMouseDown={(e) => {
							e.preventDefault();
						}}
						onClick={(e) => {
							e.stopPropagation();
							props.onToggleExpand();
						}}
						className="flex-shrink-0 min-w-8 min-h-8 flex items-center justify-center hover:bg-gray-200 rounded cursor-pointer dark:hover:bg-gray-700"
					>
						{expanded ? (
							<ChevronDown className="w-3 h-3" />
						) : (
							<ChevronRight className="w-3 h-3" />
						)}
					</button>
				) : (
					<div className="flex-shrink-0 min-w-8 min-h-8" />
				)}

				{/* Label + badge */}
				<div
					className={`flex-1 flex gap-2 font-medium text-gray-900 truncate text-left dark:text-gray-100 ${
						variant === "group" ? "text-base" : "text-sm"
					}`}
				>
					{label}
					{mentionCount > 0 && (
						<span className="flex-shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
							{mentionCount}
						</span>
					)}
				</div>

				{/* Approve button (entry, suggested only) */}
				{isEntry && isSuggested && props.projectId && (
					<ApproveSuggestionButton
						onClick={props.onApprove}
						disabled={props.approveDisabled ?? false}
						size="sm"
					/>
				)}

				{/* Action buttons (visible on hover) */}
				<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
					{onEdit && (
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								onEdit();
							}}
							className="flex-shrink-0 p-1 hover:bg-gray-200 rounded dark:hover:bg-gray-700"
							aria-label="Edit"
						>
							<Edit2 className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
						</button>
					)}
					{onMerge && (
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								onMerge();
							}}
							className="flex-shrink-0 p-1 hover:bg-gray-200 rounded dark:hover:bg-gray-700"
							aria-label="Merge"
						>
							<Merge className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
						</button>
					)}
					{onDelete && (
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								onDelete();
							}}
							className="flex-shrink-0 p-1 hover:bg-red-100 rounded dark:hover:bg-red-900/30"
							aria-label="Delete"
						>
							<Trash2 className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
						</button>
					)}
				</div>
			</div>

			{/* Cross references (entry only) */}
			{crossReferenceSegments.length > 0 && (
				<div
					className="font-merriweather text-xs text-gray-600 dark:text-gray-400 pl-8"
					style={{ marginLeft: `${hasChildren ? 20 : 0}px` }}
				>
					{crossReferenceSegments.map((seg, i) =>
						seg.italic ? (
							<em key={`${i}-italic-${seg.text}`}>{seg.text}</em>
						) : (
							<span key={`${i}-roman-${seg.text}`}>{seg.text}</span>
						),
					)}
				</div>
			)}
		</div>
	);
};
