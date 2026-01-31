import type { Meta, StoryObj } from "@storybook/react";
import { PageSubjectContent } from "../page-subject-content";

const meta: Meta<typeof PageSubjectContent> = {
	title: "Components/PDF/PdfEditor/PageSidebar/PageSubjectContent",
	component: PageSubjectContent,
	tags: ["autodocs"],
	parameters: {
		layout: "centered",
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
