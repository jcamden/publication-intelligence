import { defaultGlobals, defaultVrtMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { ProjectScriptureContent } from "../../project-scripture-content";

const meta: Meta<typeof ProjectScriptureContent> = {
	...defaultVrtMeta,
	title:
		"Projects/[ProjectDir]/Editor/ProjectSidebar/ProjectScriptureContent/tests/Visual Regression Tests",
	component: ProjectScriptureContent,
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
