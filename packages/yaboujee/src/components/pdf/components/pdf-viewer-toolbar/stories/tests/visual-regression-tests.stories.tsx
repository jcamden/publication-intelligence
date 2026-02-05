import { defaultGlobals, defaultVrtMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { PdfViewerToolbar } from "../../pdf-viewer-toolbar";
import { defaultArgs } from "../shared";

const meta: Meta<typeof PdfViewerToolbar> = {
	...defaultVrtMeta,
	title: "Components/PDF/PdfViewerToolbar/tests/Visual Regression Tests",
	component: PdfViewerToolbar,
	parameters: {
		...defaultVrtMeta.parameters,
	},
	args: defaultArgs,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	globals: {
		...defaultGlobals,
		viewport: { value: "mobile1", isRotated: true },
	},
};

export const DefaultDark: Story = {
	globals: {
		...defaultGlobals,
		viewport: { value: "mobile1", isRotated: true },
		theme: "dark",
	},
};
