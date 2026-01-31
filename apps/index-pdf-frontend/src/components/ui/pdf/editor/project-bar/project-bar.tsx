"use client";

import { DraggableToggleButtonGroup } from "../draggable-toggle-button-group";
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
		<DraggableToggleButtonGroup
			buttons={buttons}
			onReorder={onReorder}
			excludeFromDrag={["toggleSidebar"]}
		/>
	);
};
