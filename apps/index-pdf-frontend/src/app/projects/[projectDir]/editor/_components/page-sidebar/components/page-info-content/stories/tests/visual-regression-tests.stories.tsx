import {
	defaultGlobals,
	visualRegressionTestConfig,
} from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { PageInfoContent } from "../../page-info-content";

const meta: Meta<typeof PageInfoContent> = {
	title:
		"Projects/[ProjectDir]/Editor/PageSidebar/PageInfoContent/tests/Visual Regression Tests",
	component: PageInfoContent,
	parameters: {
		...visualRegressionTestConfig,
		layout: "centered",
	},
	tags: ["visual-regression"],
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
