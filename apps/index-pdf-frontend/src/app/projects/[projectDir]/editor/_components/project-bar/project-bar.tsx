"use client";

import { StyledToggleButtonGroup } from "@pubint/yaboujee";
import { useProjectBarButtons } from "./use-project-bar-buttons";

type ProjectBarProps = {
	enabledIndexTypes: string[]; // Index types enabled for this project
};

/**
 * Project Bar Component
 *
 * Controls which panels are visible in the project sidebar (left side).
 * Shows toggle buttons for: Pages, Rrgions, Bibliography, Authors, Scripture, Subject
 */
export const ProjectBar = ({ enabledIndexTypes }: ProjectBarProps) => {
	const { buttons, onReorder } = useProjectBarButtons({ enabledIndexTypes });

	return (
		<StyledToggleButtonGroup
			buttons={buttons}
			draggable={true}
			onReorder={onReorder}
			excludeFromDrag={["toggleSidebar"]}
		/>
	);
};
