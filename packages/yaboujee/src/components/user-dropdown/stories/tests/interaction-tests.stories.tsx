import { defaultInteractionTestMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within } from "@storybook/test";
import { UserDropdown } from "../../user-dropdown";
import {
	clickUserDropdownTrigger,
	dropdownItemsAreVisible,
	userInfoIsVisible,
} from "../helpers/steps";
import { defaultHandlers, defaultUser } from "../shared";

export default {
	...defaultInteractionTestMeta,
	title: "Components/UserDropdown/tests/Interaction Tests",
	component: UserDropdown,
	parameters: {
		...defaultInteractionTestMeta.parameters,
	},
} satisfies Meta<typeof UserDropdown>;

export const OpensDropdownMenu: StoryObj<typeof UserDropdown> = {
	render: () => (
		<div data-testid="dropdown-test-container">
			<UserDropdown {...defaultUser} {...defaultHandlers} />
		</div>
	),
	play: async ({ canvasElement, step }) => {
		const user = userEvent.setup();
		const canvas = within(canvasElement);
		await clickUserDropdownTrigger({ canvas, user, step });
		await dropdownItemsAreVisible({ step });
	},
};

export const DisplaysUserInfo: StoryObj<typeof UserDropdown> = {
	render: () => (
		<div data-testid="user-info-test">
			<UserDropdown {...defaultUser} {...defaultHandlers} />
		</div>
	),
	play: async ({ canvasElement, step }) => {
		const user = userEvent.setup();
		const canvas = within(canvasElement);
		await clickUserDropdownTrigger({ canvas, user, step });
		await userInfoIsVisible({
			userName: defaultUser.userName,
			userEmail: defaultUser.userEmail,
			step,
		});
	},
};
