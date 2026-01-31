import type { Meta, StoryObj } from "@storybook/react";
import { PageBiblioContent } from "../page-biblio-content";

const meta: Meta<typeof PageBiblioContent> = {
	title: "Components/PDF/PdfEditor/PageSidebar/PageBiblioContent",
	component: PageBiblioContent,
	tags: ["autodocs"],
	parameters: {
		layout: "centered",
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
