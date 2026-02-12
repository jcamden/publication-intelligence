import { defaultGlobals, defaultVrtMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { PageContextsContent } from "../../page-contexts-content";
import { withMockedDependencies } from "../shared";

const meta: Meta<typeof PageContextsContent> = {
	...defaultVrtMeta,
	title:
		"Projects/[ProjectDir]/Editor/PageSidebar/PageContextsContent/tests/Visual Regression Tests",
	component: PageContextsContent,
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
