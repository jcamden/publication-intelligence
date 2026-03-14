import { defaultGlobals, defaultVrtMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { ScriptureSetupSection } from "../../../scripture-setup-section";

const meta: Meta<typeof ScriptureSetupSection> = {
	...defaultVrtMeta,
	title:
		"Projects/[ProjectDir]/Editor/ProjectSidebar/ProjectScriptureContent/ScriptureSetupSection/tests/Visual Regression Tests",
	component: ScriptureSetupSection,
	parameters: {
		...defaultVrtMeta.parameters,
		layout: "centered",
	},
	args: {
		projectId: "mock-project-id",
		projectIndexTypeId: "mock-pit-scripture-id",
		onBootstrapSuccess: () => {},
	},
	decorators: [
		(Story) => (
			<div className="w-80">
				<Story />
			</div>
		),
	],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
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
