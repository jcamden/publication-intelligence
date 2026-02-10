import { Skeleton } from "@pubint/yabasic/components/ui/skeleton";
import { useMemo } from "react";

type EntryListSkeletonProps = {
	count?: number;
};

export const EntryListSkeleton = ({ count = 5 }: EntryListSkeletonProps) => {
	const skeletonKeys = useMemo(
		() => Array.from({ length: count }, () => crypto.randomUUID()),
		[count],
	);

	return (
		<div className="space-y-1">
			{skeletonKeys.map((key) => (
				<div
					key={key}
					className="flex items-center gap-2 p-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
				>
					{/* Drag handle skeleton */}
					<Skeleton className="h-4 w-4 shrink-0" />

					{/* Chevron/expand skeleton */}
					<Skeleton className="h-4 w-4 shrink-0" />

					{/* Label skeleton - varies width for visual variety */}
					<Skeleton
						className="h-4 flex-1"
						style={{ width: `${60 + Math.random() * 30}%` }}
					/>

					{/* Count badge skeleton */}
					<Skeleton className="h-5 w-8 rounded-full" />
				</div>
			))}
		</div>
	);
};
