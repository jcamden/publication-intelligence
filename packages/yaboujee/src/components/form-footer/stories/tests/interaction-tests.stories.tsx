import { defaultInteractionTestMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "@storybook/test";
import { FormFooter } from "../../form-footer";
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
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const link = canvas.getByText(longTextVariant.linkText);

		await expect(link).toBeVisible();
		await expect(link).toHaveAttribute("href", longTextVariant.linkHref);
		await expect(link.tagName.toLowerCase()).toBe("a");
	},
};
