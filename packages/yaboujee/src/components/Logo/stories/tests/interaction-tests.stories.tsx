import { defaultInteractionTestMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "@storybook/test";
import { Logo } from "../../logo";

export default {
	...defaultInteractionTestMeta,
	title: "Components/Logo/tests/Interaction Tests",
	component: Logo,
	parameters: {
		...defaultInteractionTestMeta.parameters,
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
