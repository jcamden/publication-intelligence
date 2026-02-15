"use client";

import { clsx } from "clsx";
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
	projectId?: string;
	documentId?: string;
	pageNumber?: number;
};

export const MentionButton = ({
	mention,
	onClick,
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

	return (
		<div className="flex items-center border-1 line-clamp-2 rounded pr-2">
			<button
				type="button"
				onClick={() => onClick({ mentionId: mention.id })}
				className="w-full text-left p-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors "
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
			{isSuggested && projectId && (
				<ApproveSuggestionButton
					onClick={handleApprove}
					disabled={approveMention.isPending}
				/>
			)}
		</div>
	);
};
