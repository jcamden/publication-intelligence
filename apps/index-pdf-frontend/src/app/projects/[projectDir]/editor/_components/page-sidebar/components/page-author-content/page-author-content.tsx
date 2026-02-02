"use client";

import { MentionActionButtons } from "../mention-action-buttons";

type PageAuthorContentProps = {
	activeAction: { type: string | null; indexType: string | null };
	onSelectText: ({ indexType }: { indexType: string }) => void;
	onDrawRegion: ({ indexType }: { indexType: string }) => void;
};

export const PageAuthorContent = ({
	activeAction,
	onSelectText,
	onDrawRegion,
}: PageAuthorContentProps) => {
	return (
		<div>
			<MentionActionButtons
				indexType="author"
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
