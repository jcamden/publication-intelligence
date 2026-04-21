import type { Meta, StoryObj } from "@storybook/react";
import { atom } from "jotai";
import { ResizableSidebar } from "../resizable-sidebar";

const meta: Meta<typeof ResizableSidebar> = {
	title: "Projects/[ProjectDir]/Editor/ResizableSidebar",
	component: ResizableSidebar,
	tags: ["autodocs"],
	parameters: {
		layout: "fullscreen",
		docs: {
			description: {
				component:
					"Resizable sidebar container with drag handle for width adjustment. Note: This component requires Jotai Provider to function.",
			},
		},
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

const widthAtom = atom(20);

export const LeftSide: Story = {
	render: () => (
		<div style={{ display: "flex", height: "400px" }}>
			<ResizableSidebar side="left" widthAtom={widthAtom} isCollapsed={false}>
				<div style={{ padding: "16px", background: "#f5f5f5" }}>
					Left sidebar content
				</div>
			</ResizableSidebar>
			<div style={{ flex: 1, padding: "16px", background: "#fff" }}>
				Main content
			</div>
		</div>
	),
};

export const RightSide: Story = {
	render: () => (
		<div style={{ display: "flex", height: "400px" }}>
			<div style={{ flex: 1, padding: "16px", background: "#fff" }}>
				Main content
			</div>
			<ResizableSidebar side="right" widthAtom={widthAtom} isCollapsed={false}>
				<div style={{ padding: "16px", background: "#f5f5f5" }}>
					Right sidebar content
				</div>
			</ResizableSidebar>
		</div>
	),
};

export const Collapsed: Story = {
	render: () => (
		<div style={{ display: "flex", height: "400px" }}>
			<ResizableSidebar side="left" widthAtom={widthAtom} isCollapsed={true}>
				<div style={{ padding: "16px", background: "#f5f5f5" }}>
					Sidebar content (collapsed)
				</div>
			</ResizableSidebar>
			<div style={{ flex: 1, padding: "16px", background: "#fff" }}>
				Main content
			</div>
		</div>
	),
};
