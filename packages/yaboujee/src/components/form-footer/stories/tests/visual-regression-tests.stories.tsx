import { defaultGlobals, defaultVrtMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { FormFooter } from "../../form-footer";
import { longTextVariant } from "../shared";

export default {
	...defaultVrtMeta,
	title: "Components/FormFooter/tests/Visual Regression Tests",
	component: FormFooter,
	parameters: {
		...defaultVrtMeta.parameters,
	},
} satisfies Meta<typeof FormFooter>;

export const NarrowContainer: StoryObj<typeof FormFooter> = {
	globals: {
		...defaultGlobals,
		viewport: { value: "mobile1" },
	},
	args: longTextVariant,
};

export const NarrowContainerDark: StoryObj<typeof FormFooter> = {
	parameters: {
		backgrounds: { default: "dark" },
	},
	globals: {
		...defaultGlobals,
		theme: "dark",
		viewport: { value: "mobile1" },
	},
	args: longTextVariant,
};
