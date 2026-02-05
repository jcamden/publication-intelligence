import { defaultGlobals, defaultVrtMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { Editor } from "../../editor";
import { SAMPLE_PDF_URL } from "../shared";

const meta: Meta<typeof Editor> = {
	...defaultVrtMeta,
	title: "Projects/[ProjectDir]/Editor/tests/Visual Regression Tests",
	component: Editor,
	parameters: {
		...defaultVrtMeta.parameters,
		layout: "fullscreen",
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default editor view in light mode
 */
export const LightMode: Story = {
	globals: {
		...defaultGlobals,
	},
	args: {
		fileUrl: SAMPLE_PDF_URL,
	},
};

/**
 * Default editor view in dark mode
 */
export const DarkMode: Story = {
	globals: {
		...defaultGlobals,
		theme: "dark",
	},
	args: {
		fileUrl: SAMPLE_PDF_URL,
	},
};
