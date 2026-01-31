import { fn } from "@storybook/test";

export const SIDEBAR_PANEL_TEST_IDS = {
	panel: "sidebar-panel",
	title: "sidebar-panel-title",
	closeButton: "sidebar-panel-close",
	content: "sidebar-panel-content",
} as const;

export const defaultSidebarPanelArgs = {
	onClose: fn() as () => void,
	title: "Panel Title",
};
