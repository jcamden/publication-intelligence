"use client";

import { PageSectionContent } from "../page-section-content/page-section-content";

type MentionData = {
	id: string;
	text: string;
	entryLabel: string;
	type: "text" | "region";
};

type PageAuthorContentProps = {
	mentions: MentionData[];
	onMentionClick?: ({ mentionId }: { mentionId: string }) => void;
};

export const PageAuthorContent = ({
	mentions,
	onMentionClick,
}: PageAuthorContentProps) => {
	return (
		<PageSectionContent mentions={mentions} onMentionClick={onMentionClick} />
	);
};
