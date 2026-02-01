"use client";

import { StyledToggleButtonGroup } from "@pubint/yaboujee";
import { usePageBarButtons } from "./use-page-bar-buttons";

/**
 * Page Bar Component
 *
 * Controls which panels are visible in the page sidebar (right side).
 * Shows toggle buttons for: Info, Contexts, Bibliography, Authors, Scripture, Subject
 */
export const PageBar = () => {
	const { buttons, onReorder } = usePageBarButtons();

	return (
		<StyledToggleButtonGroup
			buttons={buttons}
			draggable={true}
			onReorder={onReorder}
			excludeFromDrag={["toggleSidebar"]}
		/>
	);
};
