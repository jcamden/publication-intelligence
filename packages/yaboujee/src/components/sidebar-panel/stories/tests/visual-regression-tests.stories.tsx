import { defaultGlobals, defaultVrtMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { SidebarPanel } from "../../sidebar-panel";
import { defaultSidebarPanelArgs } from "../shared";

const meta: Meta<typeof SidebarPanel> = {
	...defaultVrtMeta,
	title: "Components/SidebarPanel/tests/Visual Regression Tests",
	component: SidebarPanel,
	parameters: {
		...defaultVrtMeta.parameters,
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

const renderAllVariants = () => (
	<div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
		<div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
			<div style={{ width: "300px" }}>
				<div
					style={{
						fontSize: "12px",
						fontWeight: "bold",
						marginBottom: "8px",
					}}
				>
					With Title and Close
				</div>
				<SidebarPanel {...defaultSidebarPanelArgs} title="Panel Title">
					<div>Content with title and close button</div>
				</SidebarPanel>
			</div>

			<div style={{ width: "300px" }}>
				<div
					style={{
						fontSize: "12px",
						fontWeight: "bold",
						marginBottom: "8px",
					}}
				>
					Title Only
				</div>
				<SidebarPanel title="Panel Title">
					<div>Content with title only</div>
				</SidebarPanel>
			</div>

			<div style={{ width: "300px" }}>
				<div
					style={{
						fontSize: "12px",
						fontWeight: "bold",
						marginBottom: "8px",
					}}
				>
					Close Only
				</div>
				<SidebarPanel onClose={defaultSidebarPanelArgs.onClose}>
					<div>Content with close button only</div>
				</SidebarPanel>
			</div>
		</div>

		<div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
			<div style={{ width: "300px" }}>
				<div
					style={{
						fontSize: "12px",
						fontWeight: "bold",
						marginBottom: "8px",
					}}
				>
					No Header
				</div>
				<SidebarPanel>
					<div>Content without header</div>
				</SidebarPanel>
			</div>

			<div style={{ width: "300px" }}>
				<div
					style={{
						fontSize: "12px",
						fontWeight: "bold",
						marginBottom: "8px",
					}}
				>
					Rich Content
				</div>
				<SidebarPanel {...defaultSidebarPanelArgs} title="Document Info">
					<div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
						<div>
							<strong>Title:</strong> Sample
						</div>
						<div>
							<strong>Author:</strong> John Doe
						</div>
						<div>
							<strong>Pages:</strong> 42
						</div>
					</div>
				</SidebarPanel>
			</div>
		</div>
	</div>
);

/**
 * All header variants
 */
export const AllVariants: Story = {
	globals: {
		...defaultGlobals,
		viewport: { value: "tablet" },
	},
	render: renderAllVariants,
};

/**
 * All header variants in dark mode
 */
export const AllVariantsDark: Story = {
	globals: {
		...defaultGlobals,
		viewport: { value: "tablet" },
		theme: "dark",
	},
	render: renderAllVariants,
};
