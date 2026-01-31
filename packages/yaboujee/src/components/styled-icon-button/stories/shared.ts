import { fn } from "@storybook/test";
import type { StyledIconButtonProps } from "../styled-icon-button";

export const STYLED_ICON_BUTTON_TEST_IDS = {
	button: "styled-icon-button",
	wrapper: "styled-icon-button-wrapper",
} as const;

export const defaultStyledIconButtonArgs: Omit<StyledIconButtonProps, "icon"> =
	{
		onClick: fn(),
		isActive: false,
		disabled: false,
		size: "lg",
	};
