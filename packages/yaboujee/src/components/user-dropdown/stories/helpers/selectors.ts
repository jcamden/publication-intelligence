import type { StorybookCanvas } from "@pubint/yaboujee/_stories";
import { within } from "@storybook/test";

export type UserDropdownStorySelectors = {
	body: () => StorybookCanvas;
	settingsItem: () => Promise<HTMLElement>;
	signOutItem: () => Promise<HTMLElement>;
	trigger: (canvas: StorybookCanvas) => HTMLElement;
	userEmail: (userEmail: string) => Promise<HTMLElement>;
	userName: (userName: string) => Promise<HTMLElement>;
};

export const userDropdownSelectors: UserDropdownStorySelectors = {
	body: () => within(document.body),
	settingsItem: () => userDropdownSelectors.body().findByText("Settings"),
	signOutItem: () => userDropdownSelectors.body().findByText("Sign out"),
	trigger: (canvas: StorybookCanvas) => canvas.getByRole("button"),
	userEmail: (userEmail: string) =>
		userDropdownSelectors.body().findByText(userEmail),
	userName: (userName: string) =>
		userDropdownSelectors.body().findByText(userName),
};
