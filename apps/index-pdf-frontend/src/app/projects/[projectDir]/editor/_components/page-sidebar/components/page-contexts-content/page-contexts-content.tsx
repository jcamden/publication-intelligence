"use client";

import { PageSectionContent } from "../page-section-content/page-section-content";

type MentionData = {
	id: string;
	text: string;
	entryLabel: string;
	type: "text" | "region";
};

type PageContextsContentProps = {
	mentions: MentionData[];
	onMentionClick?: ({ mentionId }: { mentionId: string }) => void;
};

export const PageContextsContent = ({
	mentions,
	onMentionClick,
}: PageContextsContentProps) => {
	return (
		<PageSectionContent mentions={mentions} onMentionClick={onMentionClick} />
	);
};
