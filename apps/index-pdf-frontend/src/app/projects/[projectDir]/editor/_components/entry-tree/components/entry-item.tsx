import { ChevronDown, ChevronRight } from "lucide-react";
import { useMemo } from "react";
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
};

export const EntryItem = ({
	entry,
	mentions,
	depth,
	hasChildren,
	expanded,
	onToggleExpand,
	onClick,
}: EntryItemProps) => {
	const mentionCount = useMemo(
		() => mentions.filter((m) => m.entryId === entry.id).length,
		[mentions, entry.id],
	);

	return (
		<div
			className="group w-full flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 rounded dark:hover:bg-gray-800"
			style={{ paddingLeft: `${8 + depth * 20}px` }}
		>
			{/* Expand/collapse icon */}
			{hasChildren ? (
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
			) : (
				<div className="w-4" /> // Spacer for alignment
			)}

			{/* Entry label */}
			<button
				type="button"
				onClick={() => onClick?.(entry)}
				className="flex-1 text-sm font-medium text-gray-900 truncate text-left dark:text-gray-100"
			>
				{entry.label}
			</button>

			{/* Mention count badge */}
			{mentionCount > 0 && (
				<span className="flex-shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
					{mentionCount}
				</span>
			)}
		</div>
	);
};
