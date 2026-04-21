import { defaultGlobals, defaultVrtMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { ProjectAuthorContent } from "../../project-author-content";

const meta: Meta<typeof ProjectAuthorContent> = {
	...defaultVrtMeta,
	title:
		"Projects/[ProjectDir]/Editor/ProjectSidebar/ProjectAuthorContent/tests/Visual Regression Tests",
	component: ProjectAuthorContent,
	parameters: {
		...defaultVrtMeta.parameters,
		layout: "centered",
	},
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
