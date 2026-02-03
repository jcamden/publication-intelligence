"use client";

import { MentionActionButtons } from "../mention-action-buttons";

type MentionData = {
	id: string;
	text: string;
	entryLabel: string;
};

type PageScriptureContentProps = {
	activeAction: { type: string | null; indexType: string | null };
	onSelectText: ({ indexType }: { indexType: string }) => void;
	onDrawRegion: ({ indexType }: { indexType: string }) => void;
	mentions: MentionData[];
	onMentionClick?: ({ mentionId }: { mentionId: string }) => void;
};

export const PageScriptureContent = ({
	activeAction,
	onSelectText,
	onDrawRegion,
	mentions,
	onMentionClick,
}: PageScriptureContentProps) => {
	const mentionCount = mentions.length;

	return (
		<div>
			<MentionActionButtons
				indexType="scripture"
				activeAction={activeAction}
				onSelectText={onSelectText}
				onDrawRegion={onDrawRegion}
			/>
			<div className="text-sm text-[hsl(var(--color-text-muted))] mb-2">
				Mentions on this page ({mentionCount})
			</div>
			{mentionCount > 0 && (
				<div className="space-y-2">
					{mentions.map((mention) => (
						<button
							key={mention.id}
							type="button"
							onClick={() => onMentionClick?.({ mentionId: mention.id })}
							className="w-full text-left p-2 rounded text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
						>
							<div className="font-medium text-neutral-900 dark:text-neutral-100">
								{mention.entryLabel}
							</div>
							<div className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2 mt-1">
								"{mention.text}"
							</div>
						</button>
					))}
				</div>
			)}
		</div>
	);
};
