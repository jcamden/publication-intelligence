import { defaultGlobals, defaultVrtMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { Eye, Plus, Settings, Zap } from "lucide-react";
import { StyledIconButton } from "../../styled-icon-button";
import { defaultStyledIconButtonArgs } from "../shared";

const meta: Meta<typeof StyledIconButton> = {
	...defaultVrtMeta,
	title: "Components/StyledIconButton/tests/Visual Regression Tests",
	component: StyledIconButton,
	parameters: {
		...defaultVrtMeta.parameters,
	},
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
				Large - Inactive
			</div>
			<div style={{ display: "flex", gap: "12px" }}>
				<StyledIconButton
					{...defaultStyledIconButtonArgs}
					icon={Eye}
					size="lg"
					tooltip="Eye"
				/>
				<StyledIconButton
					{...defaultStyledIconButtonArgs}
					icon={Plus}
					size="lg"
					tooltip="Plus"
				/>
				<StyledIconButton
					{...defaultStyledIconButtonArgs}
					icon={Settings}
					size="lg"
					tooltip="Settings"
				/>
				<StyledIconButton
					{...defaultStyledIconButtonArgs}
					icon={Zap}
					size="lg"
					tooltip="Zap"
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
				Large - Active
			</div>
			<div style={{ display: "flex", gap: "12px" }}>
				<StyledIconButton
					{...defaultStyledIconButtonArgs}
					icon={Eye}
					size="lg"
					isActive
					tooltip="Eye"
				/>
				<StyledIconButton
					{...defaultStyledIconButtonArgs}
					icon={Plus}
					size="lg"
					isActive
					tooltip="Plus"
				/>
				<StyledIconButton
					{...defaultStyledIconButtonArgs}
					icon={Settings}
					size="lg"
					isActive
					tooltip="Settings"
				/>
				<StyledIconButton
					{...defaultStyledIconButtonArgs}
					icon={Zap}
					size="lg"
					isActive
					tooltip="Zap"
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
				Small - Inactive
			</div>
			<div style={{ display: "flex", gap: "12px" }}>
				<StyledIconButton
					{...defaultStyledIconButtonArgs}
					icon={Eye}
					size="sm"
					tooltip="Eye"
				/>
				<StyledIconButton
					{...defaultStyledIconButtonArgs}
					icon={Plus}
					size="sm"
					tooltip="Plus"
				/>
				<StyledIconButton
					{...defaultStyledIconButtonArgs}
					icon={Settings}
					size="sm"
					tooltip="Settings"
				/>
				<StyledIconButton
					{...defaultStyledIconButtonArgs}
					icon={Zap}
					size="sm"
					tooltip="Zap"
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
				Small - Active
			</div>
			<div style={{ display: "flex", gap: "12px" }}>
				<StyledIconButton
					{...defaultStyledIconButtonArgs}
					icon={Eye}
					size="sm"
					isActive
					tooltip="Eye"
				/>
				<StyledIconButton
					{...defaultStyledIconButtonArgs}
					icon={Plus}
					size="sm"
					isActive
					tooltip="Plus"
				/>
				<StyledIconButton
					{...defaultStyledIconButtonArgs}
					icon={Settings}
					size="sm"
					isActive
					tooltip="Settings"
				/>
				<StyledIconButton
					{...defaultStyledIconButtonArgs}
					icon={Zap}
					size="sm"
					isActive
					tooltip="Zap"
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
				Disabled States
			</div>
			<div style={{ display: "flex", gap: "12px" }}>
				<StyledIconButton
					{...defaultStyledIconButtonArgs}
					icon={Eye}
					disabled
					tooltip="Disabled"
				/>
				<StyledIconButton
					{...defaultStyledIconButtonArgs}
					icon={Plus}
					isActive
					disabled
					tooltip="Active Disabled"
				/>
			</div>
		</div>
	</div>
);

/**
 * All states and sizes
 */
export const AllVariants: Story = {
	globals: {
		...defaultGlobals,
		viewport: { value: "mobile1" },
	},
	render: renderAllVariants,
};

/**
 * All states and sizes in dark mode
 */
export const AllVariantsDark: Story = {
	globals: {
		...defaultGlobals,
		viewport: { value: "mobile1" },
		theme: "dark",
	},
	render: renderAllVariants,
};
