import { Skeleton } from "@pubint/yabasic/components/ui/skeleton";
import { useMemo } from "react";

type MentionListSkeletonProps = {
	count?: number;
};

export const MentionListSkeleton = ({
	count = 3,
}: MentionListSkeletonProps) => {
	const skeletonKeys = useMemo(
		() => Array.from({ length: count }, () => crypto.randomUUID()),
		[count],
	);

	return (
		<div className="space-y-2">
			{skeletonKeys.map((key) => (
				<div
					key={key}
					className="p-2 rounded border border-neutral-200 dark:border-neutral-700 space-y-1"
				>
					{/* Entry label and mention text skeleton */}
					<div className="flex items-start gap-1">
						<Skeleton className="h-4 w-20" />
						<span className="text-neutral-400">-</span>
						<Skeleton className="h-4 flex-1" />
					</div>

					{/* Second line of text (for longer mentions) */}
					<Skeleton
						className="h-3"
						style={{ width: `${40 + Math.random() * 40}%` }}
					/>
				</div>
			))}
		</div>
	);
};
