import { fn } from "@storybook/test";

export const WINDOW_TOP_BAR_TEST_IDS = {
	topBar: "window-top-bar",
	title: "window-title",
	maximizeButton: "maximize-button",
	closeButton: "close-button",
	unpopButton: "unpop-button",
} as const;

export const defaultWindowTopBarArgs = {
	title: "Window Title",
	isMaximized: false,
	sidebarCollapsed: false,
	side: "left" as const,
	onUnpop: fn() as () => void,
	onClose: fn() as () => void,
	onMaximize: fn() as () => void,
};
