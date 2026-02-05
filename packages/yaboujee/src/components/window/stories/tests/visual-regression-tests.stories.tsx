import { defaultGlobals, defaultVrtMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { Window } from "../../window";

const meta: Meta<typeof Window> = {
	...defaultVrtMeta,
	title: "Components/Window/tests/Visual Regression Tests",
	component: Window,
	parameters: {
		...defaultVrtMeta.parameters,
		layout: "fullscreen",
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

const renderAllVariants = () => (
	<div style={{ position: "relative", height: "100vh" }}>
		<div
			style={{
				fontSize: "12px",
				fontWeight: "bold",
				padding: "8px",
				background: "#f3f4f6",
			}}
		>
			Default Window (Not Maximized)
		</div>
		<Window
			id="default"
			title="Default Window"
			zIndex={1000}
			isMaximized={false}
			sidebarCollapsed={false}
			position={{ x: 6.25, y: 6.25 }}
			size={{ width: 25, height: 18.75 }}
			side="left"
			onUnpop={() => {}}
			onClose={() => {}}
			onMaximize={() => {}}
			onPositionChange={() => {}}
			onSizeChange={() => {}}
			onFocus={() => {}}
		>
			<div style={{ padding: "16px" }}>
				<h4>Window Content</h4>
				<p>Sample content inside the window.</p>
			</div>
		</Window>

		<Window
			id="small"
			title="Small Window"
			zIndex={1001}
			isMaximized={false}
			sidebarCollapsed={false}
			position={{ x: 35, y: 6.25 }}
			size={{ width: 18, height: 12 }}
			side="left"
			onUnpop={() => {}}
			onClose={() => {}}
			onMaximize={() => {}}
			onPositionChange={() => {}}
			onSizeChange={() => {}}
			onFocus={() => {}}
		>
			<div style={{ padding: "12px" }}>
				<p>Small window</p>
			</div>
		</Window>

		<Window
			id="with-close"
			title="With Close Button"
			zIndex={1002}
			isMaximized={false}
			sidebarCollapsed={true}
			position={{ x: 6.25, y: 28 }}
			size={{ width: 22, height: 15 }}
			side="left"
			onUnpop={() => {}}
			onClose={() => {}}
			onMaximize={() => {}}
			onPositionChange={() => {}}
			onSizeChange={() => {}}
			onFocus={() => {}}
		>
			<div style={{ padding: "16px" }}>
				<p>Window with close button (sidebar collapsed)</p>
			</div>
		</Window>

		<Window
			id="right-side"
			title="Right Side Window"
			zIndex={1003}
			isMaximized={false}
			sidebarCollapsed={false}
			position={{ x: 55, y: 6.25 }}
			size={{ width: 20, height: 15 }}
			side="right"
			onUnpop={() => {}}
			onClose={() => {}}
			onMaximize={() => {}}
			onPositionChange={() => {}}
			onSizeChange={() => {}}
			onFocus={() => {}}
		>
			<div style={{ padding: "16px" }}>
				<p>Window from right sidebar</p>
			</div>
		</Window>
	</div>
);

/**
 * All window variants and states
 */
export const AllVariants: Story = {
	globals: {
		...defaultGlobals,
	},
	render: renderAllVariants,
};

/**
 * All window variants and states in dark mode
 */
export const AllVariantsDark: Story = {
	globals: {
		...defaultGlobals,
		theme: "dark",
	},
	render: renderAllVariants,
};
