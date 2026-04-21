import { defaultGlobals, defaultVrtMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { PageRegionsContent } from "../../page-regions-content";
import { withMockedDependencies } from "../shared";

const meta: Meta<typeof PageRegionsContent> = {
	...defaultVrtMeta,
	title:
		"Projects/[ProjectDir]/Editor/PageSidebar/PageRegionsContent/tests/Visual Regression Tests",
	component: PageRegionsContent,
	decorators: [withMockedDependencies],
	parameters: {
		...defaultVrtMeta.parameters,
		layout: "centered",
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const LightMode: Story = {
	args: {
		currentPage: 1,
	},
	globals: {
		...defaultGlobals,
	},
};

export const DarkMode: Story = {
	args: {
		currentPage: 1,
	},
	globals: {
		...defaultGlobals,
		theme: "dark",
	},
};
