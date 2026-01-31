import {
	defaultGlobals,
	visualRegressionTestConfig,
} from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { FileText, Image, Table, Type } from "lucide-react";
import { DraggableToggleButtonGroup } from "../../draggable-toggle-button-group";

const meta: Meta<typeof DraggableToggleButtonGroup> = {
	title:
		"Components/PDF/PdfEditor/DraggableToggleButtonGroup/tests/Visual Regression Tests",
	component: DraggableToggleButtonGroup,
	parameters: {
		...visualRegressionTestConfig,
		layout: "centered",
	},
	tags: ["visual-regression"],
};

export default meta;
type Story = StoryObj<typeof meta>;

const renderAllVariants = () => (
	<div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
		<div>
			<div
				style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "8px" }}
			>
				Default (First Active)
			</div>
			<DraggableToggleButtonGroup
				buttons={[
					{
						name: "text",
						icon: Type,
						tooltip: "Text",
						isActive: true,
						onClick: fn(),
					},
					{
						name: "image",
						icon: Image,
						tooltip: "Images",
						isActive: false,
						onClick: fn(),
					},
					{
						name: "table",
						icon: Table,
						tooltip: "Tables",
						isActive: false,
						onClick: fn(),
					},
					{
						name: "file",
						icon: FileText,
						tooltip: "Files",
						isActive: false,
						onClick: fn(),
					},
				]}
				onReorder={fn()}
				excludeFromDrag={[]}
			/>
		</div>

		<div>
			<div
				style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "8px" }}
			>
				Middle Active
			</div>
			<DraggableToggleButtonGroup
				buttons={[
					{
						name: "text",
						icon: Type,
						tooltip: "Text",
						isActive: false,
						onClick: fn(),
					},
					{
						name: "image",
						icon: Image,
						tooltip: "Images",
						isActive: false,
						onClick: fn(),
					},
					{
						name: "table",
						icon: Table,
						tooltip: "Tables",
						isActive: true,
						onClick: fn(),
					},
					{
						name: "file",
						icon: FileText,
						tooltip: "Files",
						isActive: false,
						onClick: fn(),
					},
				]}
				onReorder={fn()}
				excludeFromDrag={[]}
			/>
		</div>

		<div>
			<div
				style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "8px" }}
			>
				Two Buttons
			</div>
			<DraggableToggleButtonGroup
				buttons={[
					{
						name: "text",
						icon: Type,
						tooltip: "Text",
						isActive: true,
						onClick: fn(),
					},
					{
						name: "image",
						icon: Image,
						tooltip: "Images",
						isActive: false,
						onClick: fn(),
					},
				]}
				onReorder={fn()}
				excludeFromDrag={[]}
			/>
		</div>

		<div>
			<div
				style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "8px" }}
			>
				Many Buttons
			</div>
			<DraggableToggleButtonGroup
				buttons={[
					{
						name: "1",
						icon: Type,
						tooltip: "Button 1",
						isActive: true,
						onClick: fn(),
					},
					{
						name: "2",
						icon: Image,
						tooltip: "Button 2",
						isActive: false,
						onClick: fn(),
					},
					{
						name: "3",
						icon: Table,
						tooltip: "Button 3",
						isActive: false,
						onClick: fn(),
					},
					{
						name: "4",
						icon: FileText,
						tooltip: "Button 4",
						isActive: false,
						onClick: fn(),
					},
					{
						name: "5",
						icon: Type,
						tooltip: "Button 5",
						isActive: false,
						onClick: fn(),
					},
					{
						name: "6",
						icon: Image,
						tooltip: "Button 6",
						isActive: false,
						onClick: fn(),
					},
				]}
				onReorder={fn()}
				excludeFromDrag={[]}
			/>
		</div>
	</div>
);

/**
 * All variants in light mode
 */
export const AllVariants: Story = {
	globals: {
		...defaultGlobals,
		viewport: { value: "mobile1" },
	},
	render: renderAllVariants,
};

/**
 * All variants in dark mode
 */
export const AllVariantsDark: Story = {
	globals: {
		...defaultGlobals,
		viewport: { value: "mobile1" },
		theme: "dark",
	},
	render: renderAllVariants,
};
