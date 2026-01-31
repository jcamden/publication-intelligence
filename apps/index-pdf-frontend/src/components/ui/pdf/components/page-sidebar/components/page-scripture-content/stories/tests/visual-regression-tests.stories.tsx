import {
	defaultGlobals,
	visualRegressionTestConfig,
} from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { PageScriptureContent } from "../../page-scripture-content";

const meta: Meta<typeof PageScriptureContent> = {
	title:
		"Components/PDF/PdfEditor/PageSidebar/PageScriptureContent/tests/Visual Regression Tests",
	component: PageScriptureContent,
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
