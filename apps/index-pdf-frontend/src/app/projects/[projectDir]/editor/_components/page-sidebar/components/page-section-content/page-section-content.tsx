"use client";

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
};

export const PageSectionContent = ({
	mentions,
	onMentionClick,
	onMentionEdit,
	onMentionDelete,
	projectId,
	documentId,
	pageNumber,
}: PageSectionContentProps) => {
	const mentionCount = mentions.length;

	return (
		<div>
			<div className="text-sm mb-2">Mentions on this page ({mentionCount})</div>
			{mentionCount > 0 && onMentionClick && (
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
			)}
		</div>
	);
};
