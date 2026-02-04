"use client";

import { PageSectionContent } from "../page-section-content/page-section-content";

type MentionData = {
	id: string;
	text: string;
	entryLabel: string;
	type: "text" | "region";
};

type PageScriptureContentProps = {
	mentions: MentionData[];
	onMentionClick?: ({ mentionId }: { mentionId: string }) => void;
};

export const PageScriptureContent = ({
	mentions,
	onMentionClick,
}: PageScriptureContentProps) => {
	return (
		<PageSectionContent mentions={mentions} onMentionClick={onMentionClick} />
	);
};
