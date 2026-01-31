import { fn } from "@storybook/test";
import { Eye, FileText, Search, Settings, Tag } from "lucide-react";
import type { StyledToggleButton } from "../styled-toggle-button-group";

export const STYLED_TOGGLE_BUTTON_GROUP_TEST_IDS = {
	group: "styled-toggle-button-group",
	button: "styled-toggle-button",
} as const;

export const createMockStyledButtons = ({
	count = 3,
	activeIndices = [0],
}: {
	count?: number;
	activeIndices?: number[];
}): StyledToggleButton[] => {
	const icons = [Eye, FileText, Search, Tag, Settings];
	const names = ["view", "pages", "search", "tags", "settings"];
	const tooltips = [
		"Toggle view",
		"Show pages",
		"Open search",
		"Manage tags",
		"Open settings",
	];

	return Array.from({ length: count }, (_, i) => ({
		name: names[i] || `button-${i}`,
		icon: icons[i] || Eye,
		isActive: activeIndices.includes(i),
		onClick: fn(),
		tooltip: tooltips[i] || `Button ${i}`,
	}));
};

export const defaultStyledToggleButtonGroupArgs = {
	buttons: createMockStyledButtons({ count: 3, activeIndices: [0] }),
	draggable: false,
};
