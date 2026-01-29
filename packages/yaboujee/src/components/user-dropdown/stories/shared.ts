import { fn } from "@storybook/test";

export const defaultHandlers: {
	onSettingsClick: () => void;
	onSignOutClick: () => void;
} = {
	onSettingsClick: fn(),
	onSignOutClick: fn(),
};

export const defaultUser = {
	userName: "John Doe",
	userEmail: "john.doe@example.com",
};
