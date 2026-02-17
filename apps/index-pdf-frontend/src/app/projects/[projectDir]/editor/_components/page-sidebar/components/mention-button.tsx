"use client";

import { clsx } from "clsx";
import { Edit2, Trash2 } from "lucide-react";
import { ApproveSuggestionButton } from "@/app/_common/_components/approve-suggestion-button";
import { useApproveMention } from "@/app/_common/_hooks/use-approve-mention";

type MentionButtonProps = {
	mention: {
		id: string;
		text: string;
		entryLabel: string;
		type: "text" | "region";
		detectionRunId?: string | null;
	};
	onClick: ({ mentionId }: { mentionId: string }) => void;
	onEdit?: ({ mentionId }: { mentionId: string }) => void;
	onDelete?: ({ mentionId }: { mentionId: string }) => void;
	projectId?: string;
	documentId?: string;
	pageNumber?: number;
};

export const MentionButton = ({
	mention,
	onClick,
	onEdit,
	onDelete,
	projectId,
	documentId,
	pageNumber,
}: MentionButtonProps) => {
	const approveMention = useApproveMention({
		projectId: projectId || "",
		documentId,
		pageNumber,
	});

	const isRegion = mention.type === "region";
	const displayText = isRegion ? `${mention.text} (region)` : `${mention.text}`;
	const isSuggested = !!mention.detectionRunId;

	const handleApprove = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (!projectId) return;
		approveMention.mutate({ id: mention.id, projectId });
	};

	const handleEdit = (e: React.MouseEvent) => {
		e.stopPropagation();
		onEdit?.({ mentionId: mention.id });
	};

	const handleDelete = (e: React.MouseEvent) => {
		e.stopPropagation();
		onDelete?.({ mentionId: mention.id });
	};

	return (
		<div className="group flex items-center border-1 line-clamp-2 rounded">
			<button
				type="button"
				onClick={() => onClick({ mentionId: mention.id })}
				className="flex-1 text-left p-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
			>
				<span className="font-medium text-neutral-900 dark:text-neutral-100">
					{mention.entryLabel} -{" "}
				</span>
				<span
					className={clsx(
						"text-xs text-neutral-600 dark:text-neutral-400",
						mention.type === "text" && "italic",
					)}
				>
					{displayText}
				</span>
			</button>

			{/* Approve button (for suggested mentions) */}
			{isSuggested && projectId && (
				<div className="flex-shrink-0 pr-2">
					<ApproveSuggestionButton
						onClick={handleApprove}
						disabled={approveMention.isPending}
					/>
				</div>
			)}

			{/* Action buttons (visible on hover) */}
			<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pr-2">
				{onEdit && (
					<button
						type="button"
						onClick={handleEdit}
						className="flex-shrink-0 p-1 hover:bg-gray-200 rounded dark:hover:bg-gray-700"
						aria-label="Edit mention"
					>
						<Edit2 className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
					</button>
				)}
				{onDelete && (
					<button
						type="button"
						onClick={handleDelete}
						className="flex-shrink-0 p-1 hover:bg-red-100 rounded dark:hover:bg-red-900/30"
						aria-label="Delete mention"
					>
						<Trash2 className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
					</button>
				)}
			</div>
		</div>
	);
};
