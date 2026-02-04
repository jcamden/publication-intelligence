"use client";

import { clsx } from "clsx";

type MentionButtonProps = {
	mention: {
		id: string;
		text: string;
		entryLabel: string;
		type: "text" | "region";
	};
	onClick: ({ mentionId }: { mentionId: string }) => void;
};

export const MentionButton = ({ mention, onClick }: MentionButtonProps) => {
	const isRegion = mention.type === "region";
	const displayText = isRegion ? `${mention.text} (region)` : `${mention.text}`;

	return (
		<button
			type="button"
			onClick={() => onClick({ mentionId: mention.id })}
			className="w-full text-left p-2 rounded text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors border-1 line-clamp-2"
		>
			<span className="font-medium text-neutral-900 dark:text-neutral-100">
				{mention.entryLabel} -{" "}
			</span>
			<span
				className={clsx(
					"text-xs text-neutral-600 dark:text-neutral-400",
					mention.type === "text" && "italic",
				)}
			>
				{displayText}
			</span>
		</button>
	);
};
