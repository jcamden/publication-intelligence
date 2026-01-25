import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "../../button";

const defaultVrtConfig = {
	parameters: {
		chromatic: { disableSnapshot: false },
	},
};

const viewportConfig = {
	small: {
		parameters: {
			viewport: {
				defaultViewport: "mobile1",
			},
		},
	},
};

export default {
	title: "Components/Button/tests/Visual Regression Tests",
	component: Button,
	tags: ["visual-regression"],
	parameters: {
		...defaultVrtConfig.parameters,
		previewTabs: { "storybook/docs/panel": { hidden: true } },
		controls: {
			exclude: ["children", "variant", "size", "disabled"],
		},
	},
} satisfies Meta<typeof Button>;

export const PrimaryVariant: StoryObj<typeof Button> = {
	args: {
		variant: "primary",
		children: "Primary Button",
	},
};

export const SecondaryVariant: StoryObj<typeof Button> = {
	args: {
		variant: "secondary",
		children: "Secondary Button",
	},
};

export const OutlineVariant: StoryObj<typeof Button> = {
	args: {
		variant: "outline",
		children: "Outline Button",
	},
};

export const GhostVariant: StoryObj<typeof Button> = {
	args: {
		variant: "ghost",
		children: "Ghost Button",
	},
};

export const SmallSize: StoryObj<typeof Button> = {
	args: {
		size: "sm",
		children: "Small Button",
	},
};

export const MediumSize: StoryObj<typeof Button> = {
	args: {
		size: "md",
		children: "Medium Button",
	},
};

export const LargeSize: StoryObj<typeof Button> = {
	args: {
		size: "lg",
		children: "Large Button",
	},
};

export const DisabledState: StoryObj<typeof Button> = {
	args: {
		disabled: true,
		children: "Disabled Button",
	},
};

export const DisabledPrimary: StoryObj<typeof Button> = {
	args: {
		variant: "primary",
		disabled: true,
		children: "Disabled Primary",
	},
};

export const DisabledOutline: StoryObj<typeof Button> = {
	args: {
		variant: "outline",
		disabled: true,
		children: "Disabled Outline",
	},
};

export const AllVariantsComparison: StoryObj<typeof Button> = {
	render: () => (
		<div
			style={{
				display: "flex",
				gap: "16px",
				flexWrap: "wrap",
				padding: "16px",
			}}
		>
			<Button variant="primary">Primary</Button>
			<Button variant="secondary">Secondary</Button>
			<Button variant="outline">Outline</Button>
			<Button variant="ghost">Ghost</Button>
		</div>
	),
};

export const AllSizesComparison: StoryObj<typeof Button> = {
	render: () => (
		<div
			style={{
				display: "flex",
				gap: "16px",
				alignItems: "center",
				padding: "16px",
			}}
		>
			<Button size="sm">Small</Button>
			<Button size="md">Medium</Button>
			<Button size="lg">Large</Button>
		</div>
	),
};

export const ButtonGroup: StoryObj<typeof Button> = {
	render: () => (
		<div style={{ display: "flex", gap: "12px", padding: "16px" }}>
			<Button variant="primary">Save</Button>
			<Button variant="secondary">Cancel</Button>
			<Button variant="outline">Reset</Button>
		</div>
	),
};

export const VerticalButtonStack: StoryObj<typeof Button> = {
	render: () => (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				gap: "12px",
				padding: "16px",
				maxWidth: "200px",
			}}
		>
			<Button variant="primary" size="md">
				Create Document
			</Button>
			<Button variant="secondary" size="md">
				Upload File
			</Button>
			<Button variant="outline" size="md">
				View All
			</Button>
			<Button variant="ghost" size="sm">
				Cancel
			</Button>
		</div>
	),
};

export const LongTextButton: StoryObj<typeof Button> = {
	args: {
		variant: "primary",
		children: "This is a very long button text that might wrap",
	},
	parameters: {
		viewport: {
			defaultViewport: "mobile1",
		},
	},
};

export const SmallViewportLayout: StoryObj<typeof Button> = {
	parameters: {
		...viewportConfig.small.parameters,
	},
	render: () => (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				gap: "12px",
				padding: "16px",
			}}
		>
			<Button variant="primary" size="md">
				Full Width Action
			</Button>
			<Button variant="outline" size="md">
				Secondary Action
			</Button>
		</div>
	),
};

export const DarkBackground: StoryObj<typeof Button> = {
	parameters: {
		backgrounds: { default: "dark" },
	},
	render: () => (
		<div
			style={{
				display: "flex",
				gap: "16px",
				flexWrap: "wrap",
				padding: "16px",
			}}
		>
			<Button variant="primary">Primary</Button>
			<Button variant="secondary">Secondary</Button>
			<Button variant="outline">Outline</Button>
			<Button variant="ghost">Ghost</Button>
		</div>
	),
};

export const WithIconLikeContent: StoryObj<typeof Button> = {
	render: () => (
		<div style={{ display: "flex", gap: "16px", padding: "16px" }}>
			<Button variant="primary">
				<span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
					<span>📄</span>
					<span>Upload Document</span>
				</span>
			</Button>
			<Button variant="outline">
				<span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
					<span>🔍</span>
					<span>Search</span>
				</span>
			</Button>
		</div>
	),
};
