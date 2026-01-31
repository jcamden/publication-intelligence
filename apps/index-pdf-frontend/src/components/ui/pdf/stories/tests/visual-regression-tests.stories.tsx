import {
	defaultGlobals,
	visualRegressionTestConfig,
} from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { PdfEditor } from "../../pdf-editor";
import { SAMPLE_PDF_URL } from "../shared";

const meta: Meta<typeof PdfEditor> = {
	title: "Components/PDF/PdfEditor/tests/Visual Regression Tests",
	component: PdfEditor,
	tags: ["visual-regression"],
	parameters: {
		...visualRegressionTestConfig,
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
