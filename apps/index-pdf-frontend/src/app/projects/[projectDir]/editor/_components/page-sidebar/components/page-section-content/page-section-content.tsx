"use client";

import type { ReactNode } from "react";
import { MentionButton } from "../mention-button";

type MentionData = {
	id: string;
	text: string;
	entryLabel: string;
	type: "text" | "region";
	detectionRunId?: string | null;
};

type PageSectionContentProps = {
	mentions: MentionData[];
	onMentionClick?: ({ mentionId }: { mentionId: string }) => void;
	onMentionEdit?: ({ mentionId }: { mentionId: string }) => void;
	onMentionDelete?: ({ mentionId }: { mentionId: string }) => void;
	projectId?: string;
	documentId?: string;
	pageNumber?: number;
	/** Wraps only the mentions list (not the header). Use for scrollable containers. */
	listWrapper?: (content: ReactNode) => ReactNode;
};

export const PageSectionContent = ({
	mentions,
	onMentionClick,
	onMentionEdit,
	onMentionDelete,
	projectId,
	documentId,
	pageNumber,
	listWrapper,
}: PageSectionContentProps) => {
	const mentionCount = mentions.length;

	const listContent =
		mentionCount > 0 && onMentionClick ? (
			<div className="space-y-2">
				{mentions.map((mention) => (
					<MentionButton
						key={mention.id}
						mention={mention}
						onClick={onMentionClick}
						onEdit={onMentionEdit}
						onDelete={onMentionDelete}
						projectId={projectId}
						documentId={documentId}
						pageNumber={pageNumber}
					/>
				))}
			</div>
		) : null;

	return (
		<div>
			{/* <div className="text-sm mb-2">Mentions on this page ({mentionCount})</div> */}
			{listWrapper && listContent ? listWrapper(listContent) : listContent}
		</div>
	);
};
