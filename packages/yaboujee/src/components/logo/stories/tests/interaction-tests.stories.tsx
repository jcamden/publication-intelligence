import { defaultInteractionTestMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { within } from "@storybook/test";
import { Logo } from "../../logo";
import { logoLinkHasHref } from "../helpers/steps";

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
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		await logoLinkHasHref({
			canvas,
			expectedHref: "/home",
			step,
		});
	},
};
