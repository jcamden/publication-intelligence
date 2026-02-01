import { interactionTestConfig } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { Editor } from "../../editor";
import { SAMPLE_PDF_URL } from "../shared";

const meta: Meta<typeof Editor> = {
	title: "Projects/[ProjectDir]/Editor/tests/Interaction Tests",
	component: Editor,
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
