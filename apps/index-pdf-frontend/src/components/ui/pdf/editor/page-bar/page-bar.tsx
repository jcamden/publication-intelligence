"use client";

import { DraggableToggleButtonGroup } from "../draggable-toggle-button-group";
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
		<DraggableToggleButtonGroup
			buttons={buttons}
			onReorder={onReorder}
			excludeFromDrag={["toggleSidebar"]}
		/>
	);
};
