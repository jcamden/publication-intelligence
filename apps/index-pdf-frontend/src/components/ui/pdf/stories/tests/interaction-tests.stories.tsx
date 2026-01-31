import { interactionTestConfig } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { PdfEditor } from "../../pdf-editor";
import { SAMPLE_PDF_URL } from "../shared";

const meta: Meta<typeof PdfEditor> = {
	title: "Components/PDF/PdfEditor/tests/Interaction Tests",
	component: PdfEditor,
	tags: ["test:interaction"],
	parameters: {
		...interactionTestConfig,
		layout: "fullscreen",
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		fileUrl: SAMPLE_PDF_URL,
	},
};
