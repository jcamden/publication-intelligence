import {
	defaultGlobals,
	visualRegressionTestConfig,
} from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { WindowTopBar } from "../../window-top-bar";
import { defaultWindowTopBarArgs } from "../shared";

const meta: Meta<typeof WindowTopBar> = {
	title: "Components/Window/WindowTopBar/tests/Visual Regression Tests",
	component: WindowTopBar,
	parameters: {
		...visualRegressionTestConfig,
	},
	tags: ["visual-regression"],
};

export default meta;
type Story = StoryObj<typeof meta>;

const renderAllVariants = () => (
	<div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
		<div>
			<div
				style={{
					fontSize: "12px",
					fontWeight: "bold",
					marginBottom: "8px",
				}}
			>
				Default (Not Maximized, Unpop Button)
			</div>
			<div style={{ width: "400px", border: "1px solid #ddd" }}>
				<WindowTopBar
					{...defaultWindowTopBarArgs}
					isMaximized={false}
					sidebarCollapsed={false}
				/>
			</div>
		</div>

		<div>
			<div
				style={{
					fontSize: "12px",
					fontWeight: "bold",
					marginBottom: "8px",
				}}
			>
				Maximized (Restore Button, Unpop Button)
			</div>
			<div style={{ width: "400px", border: "1px solid #ddd" }}>
				<WindowTopBar
					{...defaultWindowTopBarArgs}
					isMaximized={true}
					sidebarCollapsed={false}
				/>
			</div>
		</div>

		<div>
			<div
				style={{
					fontSize: "12px",
					fontWeight: "bold",
					marginBottom: "8px",
				}}
			>
				Sidebar Collapsed (Close Button)
			</div>
			<div style={{ width: "400px", border: "1px solid #ddd" }}>
				<WindowTopBar
					{...defaultWindowTopBarArgs}
					isMaximized={false}
					sidebarCollapsed={true}
				/>
			</div>
		</div>

		<div>
			<div
				style={{
					fontSize: "12px",
					fontWeight: "bold",
					marginBottom: "8px",
				}}
			>
				Maximized + Sidebar Collapsed
			</div>
			<div style={{ width: "400px", border: "1px solid #ddd" }}>
				<WindowTopBar
					{...defaultWindowTopBarArgs}
					isMaximized={true}
					sidebarCollapsed={true}
				/>
			</div>
		</div>

		<div>
			<div
				style={{
					fontSize: "12px",
					fontWeight: "bold",
					marginBottom: "8px",
				}}
			>
				Left Side
			</div>
			<div style={{ width: "400px", border: "1px solid #ddd" }}>
				<WindowTopBar {...defaultWindowTopBarArgs} side="left" />
			</div>
		</div>

		<div>
			<div
				style={{
					fontSize: "12px",
					fontWeight: "bold",
					marginBottom: "8px",
				}}
			>
				Right Side
			</div>
			<div style={{ width: "400px", border: "1px solid #ddd" }}>
				<WindowTopBar {...defaultWindowTopBarArgs} side="right" />
			</div>
		</div>

		<div>
			<div
				style={{
					fontSize: "12px",
					fontWeight: "bold",
					marginBottom: "8px",
				}}
			>
				Long Title
			</div>
			<div style={{ width: "400px", border: "1px solid #ddd" }}>
				<WindowTopBar
					{...defaultWindowTopBarArgs}
					title="This is a very long window title that demonstrates text overflow"
				/>
			</div>
		</div>
	</div>
);

/**
 * All states and combinations
 */
export const AllVariants: Story = {
	globals: {
		...defaultGlobals,
		viewport: { value: "tablet" },
	},
	render: renderAllVariants,
};

/**
 * All states and combinations in dark mode
 */
export const AllVariantsDark: Story = {
	globals: {
		...defaultGlobals,
		viewport: { value: "tablet" },
		theme: "dark",
	},
	render: renderAllVariants,
};
