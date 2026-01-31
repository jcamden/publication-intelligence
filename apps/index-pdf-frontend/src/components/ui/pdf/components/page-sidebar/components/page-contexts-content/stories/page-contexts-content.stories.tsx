import type { Meta, StoryObj } from "@storybook/react";
import { PageContextsContent } from "../page-contexts-content";

const meta: Meta<typeof PageContextsContent> = {
	title: "Components/PDF/PdfEditor/PageSidebar/PageContextsContent",
	component: PageContextsContent,
	tags: ["autodocs"],
	parameters: {
		layout: "centered",
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
