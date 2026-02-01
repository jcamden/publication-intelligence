import type { Meta, StoryObj } from "@storybook/react";
import { PageSidebar } from "../page-sidebar";

const meta: Meta<typeof PageSidebar> = {
	title: "Projects/[ProjectDir]/Editor/PageSidebar",
	component: PageSidebar,
	tags: ["autodocs"],
	parameters: {
		layout: "fullscreen",
		docs: {
			description: {
				component:
					"Right sidebar showing page-level panels (info, indices, etc.). Note: This component requires Jotai Provider to function.",
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
			<PageSidebar />
		</div>
	),
};
