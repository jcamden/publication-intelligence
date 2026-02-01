import {
	defaultGlobals,
	visualRegressionTestConfig,
} from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { PageBiblioContent } from "../../page-biblio-content";

const meta: Meta<typeof PageBiblioContent> = {
	title:
		"Projects/[ProjectDir]/Editor/PageSidebar/PageBiblioContent/tests/Visual Regression Tests",
	component: PageBiblioContent,
	parameters: {
		...visualRegressionTestConfig,
		layout: "centered",
	},
	tags: ["visual-regression"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const LightMode: Story = {
	globals: {
		...defaultGlobals,
	},
};

export const DarkMode: Story = {
	globals: {
		...defaultGlobals,
		theme: "dark",
	},
};
