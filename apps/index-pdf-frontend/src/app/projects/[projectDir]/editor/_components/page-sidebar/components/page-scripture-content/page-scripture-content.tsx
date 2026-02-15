"use client";

import { PageSectionContent } from "../page-section-content/page-section-content";

type MentionData = {
	id: string;
	text: string;
	entryLabel: string;
	type: "text" | "region";
	detectionRunId?: string | null;
};

type PageScriptureContentProps = {
	mentions: MentionData[];
	onMentionClick?: ({ mentionId }: { mentionId: string }) => void;
	projectId?: string;
	documentId?: string;
	pageNumber?: number;
};

export const PageScriptureContent = ({
	mentions,
	onMentionClick,
	projectId,
	documentId,
	pageNumber,
}: PageScriptureContentProps) => {
	return (
		<PageSectionContent
			mentions={mentions}
			onMentionClick={onMentionClick}
			projectId={projectId}
			documentId={documentId}
			pageNumber={pageNumber}
		/>
	);
};
