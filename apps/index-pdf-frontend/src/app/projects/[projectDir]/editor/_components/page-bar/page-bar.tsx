"use client";

import { StyledToggleButtonGroup } from "@pubint/yaboujee";
import { usePageBarButtons } from "./use-page-bar-buttons";

type PageBarProps = {
	enabledIndexTypes: string[]; // Index types enabled for this project
};

/**
 * Page Bar Component
 *
 * Controls which panels are visible in the page sidebar (right side).
 * Shows toggle buttons for: Info, Regions, Bibliography, Authors, Scripture, Subject
 */
export const PageBar = ({ enabledIndexTypes }: PageBarProps) => {
	const { buttons, onReorder } = usePageBarButtons({ enabledIndexTypes });

	return (
		<StyledToggleButtonGroup
			buttons={buttons}
			draggable={true}
			onReorder={onReorder}
			excludeFromDrag={["toggleSidebar"]}
		/>
	);
};
