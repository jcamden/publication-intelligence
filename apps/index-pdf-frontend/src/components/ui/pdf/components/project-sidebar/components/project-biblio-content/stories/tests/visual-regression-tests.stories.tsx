import {
	defaultGlobals,
	visualRegressionTestConfig,
} from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { ProjectBiblioContent } from "../../project-biblio-content";

const meta: Meta<typeof ProjectBiblioContent> = {
	title:
		"Components/PDF/PdfEditor/ProjectSidebar/ProjectBiblioContent/tests/Visual Regression Tests",
	component: ProjectBiblioContent,
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
