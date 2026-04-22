"use client";

import { ScrollArea } from "@pubint/yabasic/components/ui/scroll-area";
import { cn } from "@pubint/yabasic/lib/utils";
import { INDEX_PANEL_SCROLL_AREA_CLASS } from "./index-panel-styles";

type IndexPanelScrollAreaProps = {
	children: React.ReactNode;
	className?: string;
};

/**
 * Scroll area for index panels (entries and mentions).
 */
export const IndexPanelScrollArea = ({
	children,
	className,
}: IndexPanelScrollAreaProps) => {
	return (
		<ScrollArea className={cn(INDEX_PANEL_SCROLL_AREA_CLASS, className)}>
			{children}
		</ScrollArea>
	);
};
