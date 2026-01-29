import type { Meta, StoryObj } from "@storybook/react";
import { PdfViewerToolbar } from "../../pdf-viewer-toolbar";
import { defaultArgs } from "../shared";

const meta: Meta<typeof PdfViewerToolbar> = {
	title: "Components/PdfViewerToolbar/tests/Visual Regression Tests",
	component: PdfViewerToolbar,
	parameters: {
		layout: "centered",
		chromatic: {
			viewports: [375, 768, 1200],
		},
	},
	tags: ["test:visual"],
	args: defaultArgs,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
