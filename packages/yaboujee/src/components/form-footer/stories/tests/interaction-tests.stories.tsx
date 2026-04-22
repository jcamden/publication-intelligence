import { defaultInteractionTestMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { within } from "storybook/test";
import { FormFooter } from "../../form-footer";
import { footerLinkMatchesExpectedTarget } from "../helpers/steps";
import { longTextVariant } from "../shared";

export default {
	...defaultInteractionTestMeta,
	title: "Components/FormFooter/tests/Interaction Tests",
	component: FormFooter,
	parameters: {
		...defaultInteractionTestMeta.parameters,
	},
} satisfies Meta<typeof FormFooter>;

export const LinkBehavior: StoryObj<typeof FormFooter> = {
	args: longTextVariant,
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		await footerLinkMatchesExpectedTarget({
			canvas,
			linkText: longTextVariant.linkText,
			linkHref: longTextVariant.linkHref,
			step,
		});
	},
};
