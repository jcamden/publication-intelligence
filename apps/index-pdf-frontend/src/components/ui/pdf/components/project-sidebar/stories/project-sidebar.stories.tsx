import type { Meta, StoryObj } from "@storybook/react";
import { ProjectSidebar } from "../project-sidebar";

const meta: Meta<typeof ProjectSidebar> = {
	title: "Components/PDF/PdfEditor/ProjectSidebar",
	component: ProjectSidebar,
	tags: ["autodocs"],
	parameters: {
		layout: "fullscreen",
		docs: {
			description: {
				component:
					"Left sidebar showing project-level panels (pages, indices, etc.). Note: This component requires Jotai Provider to function.",
			},
		},
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => (
		<div
			style={{
				width: "300px",
				height: "600px",
				border: "1px solid #ccc",
			}}
		>
			<ProjectSidebar />
		</div>
	),
};
