import {
	defaultGlobals,
	visualRegressionTestConfig,
} from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within } from "@storybook/test";
import { UserDropdown } from "../../user-dropdown";
import { defaultHandlers, defaultUser } from "../shared";

export default {
	title: "Components/UserDropdown/tests/Visual Regression Tests",
	component: UserDropdown,
	tags: ["visual-regression"],
	parameters: {
		...visualRegressionTestConfig,
	},
} satisfies Meta<typeof UserDropdown>;

export const DefaultLight: StoryObj<typeof UserDropdown> = {
	globals: {
		...defaultGlobals,
		viewport: { value: "mobile1" },
	},
	render: () => (
		<div style={{ padding: "32px" }}>
			<UserDropdown {...defaultUser} {...defaultHandlers} />
		</div>
	),
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const trigger = canvas.getByRole("button");
		await userEvent.click(trigger);
	},
};

export const DefaultDark: StoryObj<typeof UserDropdown> = {
	globals: {
		...defaultGlobals,
		theme: "dark",
		viewport: { value: "mobile1" },
	},
	render: () => (
		<div style={{ padding: "32px" }}>
			<UserDropdown {...defaultUser} {...defaultHandlers} />
		</div>
	),
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const trigger = canvas.getByRole("button");
		await userEvent.click(trigger);
	},
};
