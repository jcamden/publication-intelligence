"use client";

import { PageSectionContent } from "../page-section-content/page-section-content";

type MentionData = {
	id: string;
	text: string;
	entryLabel: string;
	type: "text" | "region";
	detectionRunId?: string | null;
};

type PageSubjectContentProps = {
	mentions: MentionData[];
	onMentionClick?: ({ mentionId }: { mentionId: string }) => void;
	onMentionEdit?: ({ mentionId }: { mentionId: string }) => void;
	onMentionDelete?: ({ mentionId }: { mentionId: string }) => void;
	projectId?: string;
	documentId?: string;
	pageNumber?: number;
};

export const PageSubjectContent = ({
	mentions,
	onMentionClick,
	onMentionEdit,
	onMentionDelete,
	projectId,
	documentId,
	pageNumber,
}: PageSubjectContentProps) => {
	return (
		<PageSectionContent
			mentions={mentions}
			onMentionClick={onMentionClick}
			onMentionEdit={onMentionEdit}
			onMentionDelete={onMentionDelete}
			projectId={projectId}
			documentId={documentId}
			pageNumber={pageNumber}
		/>
	);
};
