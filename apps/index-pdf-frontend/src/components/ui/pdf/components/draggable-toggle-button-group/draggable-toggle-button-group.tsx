"use client";

import {
	type StyledToggleButton,
	StyledToggleButtonGroup,
} from "@pubint/yaboujee";

type DraggableToggleButtonGroupProps = {
	buttons: StyledToggleButton[];
	className?: string;
	onReorder: ({
		fromIndex,
		toIndex,
	}: {
		fromIndex: number;
		toIndex: number;
	}) => void;
	excludeFromDrag?: string[];
};

export const DraggableToggleButtonGroup = ({
	buttons,
	className,
	onReorder,
	excludeFromDrag = [],
}: DraggableToggleButtonGroupProps) => {
	return (
		<StyledToggleButtonGroup
			buttons={buttons}
			className={className}
			draggable={true}
			onReorder={onReorder}
			excludeFromDrag={excludeFromDrag}
		/>
	);
};
