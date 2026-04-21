import type { StorybookCanvas } from "@pubint/yaboujee/_stories";
import { within } from "@storybook/test";

export type UserDropdownStorySelectors = {
	trigger: (canvas: StorybookCanvas) => HTMLElement;
	body: () => StorybookCanvas;
	settingsItem: () => Promise<HTMLElement>;
	signOutItem: () => Promise<HTMLElement>;
	userName: (userName: string) => Promise<HTMLElement>;
	userEmail: (userEmail: string) => Promise<HTMLElement>;
};

export const userDropdownSelectors: UserDropdownStorySelectors = {
	trigger: (canvas: StorybookCanvas) => canvas.getByRole("button"),
	body: () => within(document.body),
	settingsItem: () => userDropdownSelectors.body().findByText("Settings"),
	signOutItem: () => userDropdownSelectors.body().findByText("Sign out"),
	userName: (userName: string) =>
		userDropdownSelectors.body().findByText(userName),
	userEmail: (userEmail: string) =>
		userDropdownSelectors.body().findByText(userEmail),
};
