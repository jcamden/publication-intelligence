"use client";

import { PageSectionContent } from "../page-section-content/page-section-content";

type MentionData = {
	id: string;
	text: string;
	entryLabel: string;
	type: "text" | "region";
};

type PageSubjectContentProps = {
	mentions: MentionData[];
	onMentionClick?: ({ mentionId }: { mentionId: string }) => void;
};

export const PageSubjectContent = ({
	mentions,
	onMentionClick,
}: PageSubjectContentProps) => {
	return (
		<PageSectionContent mentions={mentions} onMentionClick={onMentionClick} />
	);
};
