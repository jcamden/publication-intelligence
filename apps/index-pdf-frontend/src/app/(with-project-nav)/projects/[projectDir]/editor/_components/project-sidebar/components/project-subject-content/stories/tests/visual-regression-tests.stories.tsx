import { defaultGlobals, defaultVrtMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { ProjectSubjectContent } from "../../project-subject-content";

const meta: Meta<typeof ProjectSubjectContent> = {
	...defaultVrtMeta,
	title:
		"Projects/[ProjectDir]/Editor/ProjectSidebar/ProjectSubjectContent/tests/Visual Regression Tests",
	component: ProjectSubjectContent,
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
