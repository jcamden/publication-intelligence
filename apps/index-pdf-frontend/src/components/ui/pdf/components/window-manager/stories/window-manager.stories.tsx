import type { Meta, StoryObj } from "@storybook/react";
import { WindowManager } from "../window-manager";

const meta: Meta<typeof WindowManager> = {
	title: "Components/PDF/PdfEditor/WindowManager",
	component: WindowManager,
	tags: ["autodocs"],
	parameters: {
		layout: "fullscreen",
		docs: {
			description: {
				component:
					"Manages floating windows for popped-out sidebar sections. Handles window positioning, z-index ordering, maximize/restore, and drag/resize interactions. Note: This component requires Jotai Provider to function and will not render windows without proper state initialization.",
			},
		},
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => (
		<div style={{ width: "100vw", height: "100vh", position: "relative" }}>
			<WindowManager />
		</div>
	),
};
