"use client";

import { MentionButton } from "../mention-button";

type MentionData = {
	id: string;
	text: string;
	entryLabel: string;
	type: "text" | "region";
};

type PageSectionContentProps = {
	mentions: MentionData[];
	onMentionClick?: ({ mentionId }: { mentionId: string }) => void;
};

export const PageSectionContent = ({
	mentions,
	onMentionClick,
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
						/>
					))}
				</div>
			)}
		</div>
	);
};
