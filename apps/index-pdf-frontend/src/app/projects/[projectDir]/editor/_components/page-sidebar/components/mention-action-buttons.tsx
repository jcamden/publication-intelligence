"use client";

type MentionActionButtonsProps = {
	indexType: string;
	activeAction: { type: string | null; indexType: string | null };
	onSelectText: ({ indexType }: { indexType: string }) => void;
	onDrawRegion: ({ indexType }: { indexType: string }) => void;
};

export const MentionActionButtons = ({
	indexType,
	activeAction,
	onSelectText,
	onDrawRegion,
}: MentionActionButtonsProps) => {
	const isSelectTextActive =
		activeAction.type === "select-text" && activeAction.indexType === indexType;
	const isDrawRegionActive =
		activeAction.type === "draw-region" && activeAction.indexType === indexType;

	return (
		<div className="flex gap-2 mb-3">
			<button
				type="button"
				onClick={() => onSelectText({ indexType })}
				className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
					isSelectTextActive
						? "bg-blue-600 text-white dark:bg-blue-500"
						: "bg-neutral-200 text-neutral-700 hover:bg-neutral-300 dark:bg-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-600"
				}`}
			>
				Select Text
			</button>
			<button
				type="button"
				onClick={() => onDrawRegion({ indexType })}
				className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
					isDrawRegionActive
						? "bg-blue-600 text-white dark:bg-blue-500"
						: "bg-neutral-200 text-neutral-700 hover:bg-neutral-300 dark:bg-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-600"
				}`}
			>
				Draw Region
			</button>
		</div>
	);
};
