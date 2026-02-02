"use client";

import { MentionActionButtons } from "../mention-action-buttons";

type PageSubjectContentProps = {
	activeAction: { type: string | null; indexType: string | null };
	onSelectText: ({ indexType }: { indexType: string }) => void;
	onDrawRegion: ({ indexType }: { indexType: string }) => void;
};

export const PageSubjectContent = ({
	activeAction,
	onSelectText,
	onDrawRegion,
}: PageSubjectContentProps) => {
	return (
		<div>
			<MentionActionButtons
				indexType="subject"
				activeAction={activeAction}
				onSelectText={onSelectText}
				onDrawRegion={onDrawRegion}
			/>
			<div className="text-sm text-[hsl(var(--color-text-muted))]">
				Mentions on this page (0)
			</div>
		</div>
	);
};
