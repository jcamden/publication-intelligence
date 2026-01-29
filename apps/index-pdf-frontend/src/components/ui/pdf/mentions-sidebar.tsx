"use client";

import type { ViewerMention } from "@/types/mentions";

type MentionsSidebarProps = {
	mentions: ViewerMention[];
	onMentionClick?: (mention: ViewerMention) => void;
	selectedMentionId?: string | null;
};

/**
 * Sidebar showing list of mentions, grouped by page
 *
 * FUTURE ENHANCEMENTS:
 * - Filter by entry
 * - Sort options (page, date, entry)
 * - Search mentions
 * - Bulk operations
 * - Entry color coding
 */
export const MentionsSidebar = ({
	mentions,
	onMentionClick,
	selectedMentionId,
}: MentionsSidebarProps) => {
	// Group mentions by page
	const mentionsByPage = mentions.reduce(
		(acc, mention) => {
			const page = mention.page_number;
			if (!acc[page]) {
				acc[page] = [];
			}
			acc[page].push(mention);
			return acc;
		},
		{} as Record<number, ViewerMention[]>,
	);

	const sortedPages = Object.keys(mentionsByPage)
		.map(Number)
		.sort((a, b) => a - b);

	if (mentions.length === 0) {
		return (
			<div className="flex h-full items-center justify-center p-4">
				<p className="text-sm text-neutral-500 dark:text-neutral-400">
					No mentions yet
				</p>
			</div>
		);
	}

	return (
		<div className="h-full overflow-y-auto border-r border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800">
			<div className="p-4">
				<h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
					Mentions ({mentions.length})
				</h2>
			</div>

			<div className="space-y-4 px-4 pb-4">
				{sortedPages.map((pageNumber) => (
					<div key={pageNumber}>
						<h3 className="mb-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">
							Page {pageNumber}
						</h3>
						<div className="space-y-2">
							{mentionsByPage[pageNumber].map((mention) => (
								<MentionCard
									key={mention.id}
									mention={mention}
									isSelected={mention.id === selectedMentionId}
									onClick={onMentionClick}
								/>
							))}
						</div>
					</div>
				))}
			</div>
		</div>
	);
};

type MentionCardProps = {
	mention: ViewerMention;
	isSelected: boolean;
	onClick?: (mention: ViewerMention) => void;
};

const MentionCard = ({ mention, isSelected, onClick }: MentionCardProps) => {
	const truncatedText =
		mention.text_span.length > 80
			? `${mention.text_span.substring(0, 80)}...`
			: mention.text_span;

	return (
		<button
			type="button"
			onClick={() => onClick?.(mention)}
			className={`w-full rounded-lg border p-3 text-left transition-colors ${
				isSelected
					? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/50"
					: "border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:border-neutral-600 dark:hover:bg-neutral-700"
			}`}
		>
			<div className="mb-1 flex items-start justify-between gap-2">
				<span className="text-xs font-medium text-blue-600 dark:text-blue-400">
					{mention.entryLabel}
				</span>
				{mention.range_type === "approximate" && (
					<span className="rounded bg-yellow-100 px-1.5 py-0.5 text-[10px] font-medium text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200">
						~
					</span>
				)}
			</div>
			<p className="text-xs text-neutral-700 dark:text-neutral-300">
				{truncatedText}
			</p>
		</button>
	);
};
