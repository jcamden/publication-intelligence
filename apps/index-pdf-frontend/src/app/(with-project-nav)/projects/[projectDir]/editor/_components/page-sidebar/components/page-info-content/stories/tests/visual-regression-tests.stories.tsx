import { defaultGlobals, defaultVrtMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { PageInfoContent } from "../../page-info-content";

const meta: Meta<typeof PageInfoContent> = {
	...defaultVrtMeta,
	title:
		"Projects/[ProjectDir]/Editor/PageSidebar/PageInfoContent/tests/Visual Regression Tests",
	component: PageInfoContent,
	parameters: {
		...defaultVrtMeta.parameters,
		layout: "centered",
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Light mode
 */
export const LightMode: Story = {
	globals: {
		...defaultGlobals,
	},
};

/**
 * Dark mode
 */
export const DarkMode: Story = {
	globals: {
		...defaultGlobals,
		theme: "dark",
	},
};
