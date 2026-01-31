import { fn } from "@storybook/test";

export const ICON_BUTTON_TEST_IDS = {
	closeButton: "close-button",
	maximizeButton: "maximize-button",
	popButton: "pop-button",
	unpopButton: "unpop-button",
} as const;

export const defaultCloseButtonArgs = {
	onClick: fn() as () => void,
	disabled: false,
};

export const defaultMaximizeButtonArgs = {
	onClick: fn() as () => void,
	disabled: false,
	isMaximized: false,
};

export const defaultPopButtonArgs = {
	onClick: fn() as () => void,
	disabled: false,
};

export const defaultUnpopButtonArgs = {
	onClick: fn() as () => void,
	disabled: false,
	side: "left" as const,
};
