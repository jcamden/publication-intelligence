import { interactionTestConfig } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";
import { UserDropdown } from "../../user-dropdown";
import { defaultHandlers, defaultUser } from "../shared";

export default {
	title: "Components/UserDropdown/tests/Interaction Tests",
	component: UserDropdown,
	tags: ["interaction-test"],
	parameters: {
		...interactionTestConfig,
	},
} satisfies Meta<typeof UserDropdown>;

export const OpensDropdownMenu: StoryObj<typeof UserDropdown> = {
	render: () => (
		<div data-testid="dropdown-test-container">
			<UserDropdown {...defaultUser} {...defaultHandlers} />
		</div>
	),
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const trigger = canvas.getByRole("button");

		await userEvent.click(trigger);

		const settingsItem = await canvas.findByText("Settings");
		const signOutItem = await canvas.findByText("Sign out");

		await expect(settingsItem).toBeInTheDocument();
		await expect(signOutItem).toBeInTheDocument();
	},
};

export const DisplaysUserInfo: StoryObj<typeof UserDropdown> = {
	render: () => (
		<div data-testid="user-info-test">
			<UserDropdown {...defaultUser} {...defaultHandlers} />
		</div>
	),
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const trigger = canvas.getByRole("button");

		await userEvent.click(trigger);

		const userName = await canvas.findByText(defaultUser.userName);
		const userEmail = await canvas.findByText(defaultUser.userEmail);

		await expect(userName).toBeInTheDocument();
		await expect(userEmail).toBeInTheDocument();
	},
};
