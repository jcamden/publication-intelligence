"use client";

import { StyledToggleButtonGroup } from "@pubint/yaboujee";
import { useProjectBarButtons } from "./use-project-bar-buttons";

/**
 * Project Bar Component
 *
 * Controls which panels are visible in the project sidebar (left side).
 * Shows toggle buttons for: Pages, Contexts, Bibliography, Authors, Scripture, Subject
 */
export const ProjectBar = () => {
	const { buttons, onReorder } = useProjectBarButtons();

	return (
		<StyledToggleButtonGroup
			buttons={buttons}
			draggable={true}
			onReorder={onReorder}
			excludeFromDrag={["toggleSidebar"]}
		/>
	);
};
