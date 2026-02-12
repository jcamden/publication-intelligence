import { cn } from "@pubint/yabasic/lib/utils";
import type { CSSProperties } from "react";

type SkeletonProps = {
	className?: string;
	style?: CSSProperties;
};

export const Skeleton = ({ className, style }: SkeletonProps) => {
	return (
		<div
			className={cn(
				"animate-pulse rounded-md bg-muted/50 dark:bg-muted/30",
				className,
			)}
			style={style}
		/>
	);
};
