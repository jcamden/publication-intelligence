"use client";

import { ScrollArea } from "@pubint/yabasic/components/ui/scroll-area";
import { cn } from "@pubint/yabasic/lib/utils";
import { useCallback, useEffect, useRef, useState } from "react";
import { INDEX_PANEL_SCROLL_AREA_CLASS } from "@/app/projects/[projectDir]/editor/_utils/index-panel-styles";

type IndexPanelScrollAreaProps = {
	children: React.ReactNode;
	className?: string;
};

/**
 * Scroll area for index panels (entries and mentions) that adds pr-4 to the
 * content when a vertical scrollbar is active, preventing content from
 * running into the scrollbar.
 */
export const IndexPanelScrollArea = ({
	children,
	className,
}: IndexPanelScrollAreaProps) => {
	const viewportRef = useRef<HTMLDivElement>(null);
	const [hasVerticalScrollbar, setHasVerticalScrollbar] = useState(false);

	const checkOverflow = useCallback(() => {
		const viewport = viewportRef.current;
		if (!viewport) return;
		setHasVerticalScrollbar(viewport.scrollHeight > viewport.clientHeight);
	}, []);

	useEffect(() => {
		const viewport = viewportRef.current;
		if (!viewport) return;

		checkOverflow();

		const resizeObserver = new ResizeObserver(checkOverflow);
		resizeObserver.observe(viewport);

		// MutationObserver for when children change (e.g. entries load)
		const mutationObserver = new MutationObserver(checkOverflow);
		mutationObserver.observe(viewport, {
			childList: true,
			subtree: true,
		});

		return () => {
			resizeObserver.disconnect();
			mutationObserver.disconnect();
		};
	}, [checkOverflow]);

	return (
		<ScrollArea
			className={cn(INDEX_PANEL_SCROLL_AREA_CLASS, className)}
			viewportRef={viewportRef}
		>
			<div className={cn("p-2", hasVerticalScrollbar && "pr-4")}>
				{children}
			</div>
		</ScrollArea>
	);
};
