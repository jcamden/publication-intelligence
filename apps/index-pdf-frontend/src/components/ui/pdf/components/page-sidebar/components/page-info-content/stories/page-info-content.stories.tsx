import type { Meta, StoryObj } from "@storybook/react";
import { PageInfoContent } from "../page-info-content";

const meta: Meta<typeof PageInfoContent> = {
	title: "Components/PDF/PdfEditor/PageSidebar/PageInfoContent",
	component: PageInfoContent,
	tags: ["autodocs"],
	parameters: {
		layout: "centered",
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
