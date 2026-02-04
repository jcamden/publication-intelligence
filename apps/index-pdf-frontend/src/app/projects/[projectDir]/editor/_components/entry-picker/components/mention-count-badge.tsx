export type MentionCountBadgeProps = {
	count: number;
};

export const MentionCountBadge = ({ count }: MentionCountBadgeProps) => {
	if (count === 0) return null;

	return (
		<span className="ml-auto rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
			{count}
		</span>
	);
};
