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

export const DefaultVariant: StoryObj<typeof Button> = {
	args: {
		variant: "default",
		children: "Default Button",
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

export const DefaultSize: StoryObj<typeof Button> = {
	args: {
		size: "default",
		children: "Default Size Button",
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

export const DisabledDefault: StoryObj<typeof Button> = {
	args: {
		variant: "default",
		disabled: true,
		children: "Disabled Default",
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
			<Button variant="default">Default</Button>
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
			<Button size="default">Default</Button>
			<Button size="lg">Large</Button>
		</div>
	),
};

export const ButtonGroup: StoryObj<typeof Button> = {
	render: () => (
		<div style={{ display: "flex", gap: "12px", padding: "16px" }}>
			<Button variant="default">Save</Button>
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
			<Button variant="default" size="default">
				Create Document
			</Button>
			<Button variant="secondary" size="default">
				Upload File
			</Button>
			<Button variant="outline" size="default">
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
		variant: "default",
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
			<Button variant="default" size="default">
				Full Width Action
			</Button>
			<Button variant="outline" size="default">
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
			<Button variant="default">Default</Button>
			<Button variant="secondary">Secondary</Button>
			<Button variant="outline">Outline</Button>
			<Button variant="ghost">Ghost</Button>
		</div>
	),
};

export const WithIconLikeContent: StoryObj<typeof Button> = {
	render: () => (
		<div style={{ display: "flex", gap: "16px", padding: "16px" }}>
			<Button variant="default">
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
