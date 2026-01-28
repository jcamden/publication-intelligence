import { interactionTestConfig } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "@storybook/test";
import { Logo } from "../../logo";

export default {
	title: "Components/Logo/tests/Interaction Tests",
	component: Logo,
	tags: ["interaction-test"],
	parameters: {
		...interactionTestConfig,
	},
} satisfies Meta<typeof Logo>;

export const LinkHrefAttribute: StoryObj<typeof Logo> = {
	render: () => (
		<div data-testid="href-test-container">
			<Logo variant="gradient" href="/home" />
		</div>
	),
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const container = canvas.getByTestId("href-test-container");
		const link = container.querySelector("a");

		await expect(link).toBeTruthy();
		await expect(link).toHaveAttribute("href", "/home");
	},
};
