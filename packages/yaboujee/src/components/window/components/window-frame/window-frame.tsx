"use client";

import { cn } from "@pubint/yabasic/lib/utils";

type Edge =
	| "left"
	| "bottom"
	| "right"
	| "rightWithScrollbar"
	| "bottomWithScrollbar";

type WindowFrameProps = {
	edge: Edge;
};

const windowFrameClassNames: Record<Edge, string> = {
	left: "top-0 left-0 p-3 drag-handle cursor-grabbing",
	right: "top-0 right-0 p-3 drag-handle cursor-grabbing",
	bottom: "bottom-0 p-3 drag-handle cursor-grabbing",
	rightWithScrollbar: "top-0 right-0 p-1",
	bottomWithScrollbar: "bottom-0 p-1",
};

export const WindowFrame = ({ edge }: WindowFrameProps) => {
	return (
		<div
			className={cn(
				"sticky bg-white dark:bg-neutral-900",
				windowFrameClassNames[edge],
			)}
		/>
	);
};
