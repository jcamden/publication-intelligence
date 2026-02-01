import type { Meta, StoryObj } from "@storybook/react";
import { Eye, Plus, Settings, Zap } from "lucide-react";
import { StyledIconButton } from "../styled-icon-button";
import { defaultStyledIconButtonArgs } from "./shared";

const codeBlock = `import { StyledIconButton } from "@pubint/yaboujee";
import { Eye, Plus } from "lucide-react";
import { useState } from "react";

// Toggle button with active state
const [isVisible, setIsVisible] = useState(true);

<StyledIconButton
  icon={Eye}
  onClick={() => setIsVisible(!isVisible)}
  isActive={isVisible}
  tooltip="Toggle visibility"
/>

// Regular button (no toggle state)
<StyledIconButton
  icon={Plus}
  onClick={() => console.log("clicked")}
  tooltip="Zoom in"
  size="sm"
/>
`;

const additionalMarkdownDescription = `
## Use cases
Use StyledIconButton for icon buttons that need sophisticated ring and shadow effects. Ideal for toolbar buttons, toggle controls, and action buttons that benefit from enhanced visual feedback.

## Features
- **Two sizes**: Large (lg) and small (sm) variants
- **Active state**: Clear visual distinction for toggle buttons
- **Sophisticated styling**: Ring and shadow effects optimized for light/dark modes
- **Hover effects**: Ring highlight on hover in both modes
- **Disabled state**: Visual and functional disable support
- **Tooltip support**: Optional tooltip text
- **Accessibility**: Full keyboard support (Enter and Space keys)

## Styling Details

### Light Mode
- **Inactive**: Ring + shadow for depth
- **Active**: Subtle ring, no shadow
- **Hover**: Visible ring effect

### Dark Mode
- **Inactive**: Shadow only (no ring)
- **Active**: Ring visible, no shadow, with glow effect
- **Hover**: Bright ring effect

### Icon Styling
- **Active icons**: Cyan color with glow effect in dark mode
- **Icon stroke**: Thicker (3px) when active, normal (2px) when inactive

## Accessibility
Buttons support both mouse and keyboard interaction. The wrapper has role="button" and handles Enter/Space keys. Tooltips are exposed via aria-label.
`;

const meta = {
	title: "Components/StyledIconButton",
	component: StyledIconButton,
	parameters: {
		docs: {
			description: {
				component: `An icon button with sophisticated ring and shadow effects for both light and dark modes.

${additionalMarkdownDescription}

## Example Usage

\`\`\`tsx
${codeBlock}
\`\`\``,
			},
		},
		layout: "centered",
	},
	tags: ["autodocs"],
} satisfies Meta<typeof StyledIconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default inactive state with large size
 */
export const Default: Story = {
	args: {
		...defaultStyledIconButtonArgs,
		icon: Eye,
		tooltip: "Toggle visibility",
	},
	parameters: {
		docs: {
			description: {
				story:
					"Default button in inactive state with large icon (ring + shadow in light, shadow in dark).",
			},
		},
	},
};

/**
 * Active state with enhanced styling
 */
export const Active: Story = {
	args: {
		...defaultStyledIconButtonArgs,
		icon: Eye,
		isActive: true,
		tooltip: "Toggle visibility",
	},
	parameters: {
		docs: {
			description: {
				story:
					"Active button with different ring/shadow treatment and cyan icon color.",
			},
		},
	},
};

/**
 * Small size variant
 */
export const SmallSize: Story = {
	args: {
		...defaultStyledIconButtonArgs,
		icon: Plus,
		size: "sm",
		tooltip: "Add item",
	},
	parameters: {
		docs: {
			description: {
				story: "Smaller button variant with compact icon.",
			},
		},
	},
};

/**
 * Active small button
 */
export const ActiveSmall: Story = {
	args: {
		...defaultStyledIconButtonArgs,
		icon: Plus,
		size: "sm",
		isActive: true,
		tooltip: "Add item",
	},
	parameters: {
		docs: {
			description: {
				story: "Small button in active state.",
			},
		},
	},
};

/**
 * Disabled state
 */
export const Disabled: Story = {
	args: {
		...defaultStyledIconButtonArgs,
		icon: Settings,
		disabled: true,
		tooltip: "Settings (disabled)",
	},
	parameters: {
		docs: {
			description: {
				story: "Disabled button with reduced opacity and no interaction.",
			},
		},
	},
};

/**
 * Disabled active state
 */
export const DisabledActive: Story = {
	args: {
		...defaultStyledIconButtonArgs,
		icon: Settings,
		isActive: true,
		disabled: true,
		tooltip: "Settings (disabled)",
	},
	parameters: {
		docs: {
			description: {
				story: "Disabled button in active state.",
			},
		},
	},
};

/**
 * With tooltip
 */
export const WithTooltip: Story = {
	args: {
		...defaultStyledIconButtonArgs,
		icon: Zap,
		tooltip: "Quick actions",
	},
	parameters: {
		docs: {
			description: {
				story:
					"Button with tooltip (hover to see tooltip via browser's default behavior).",
			},
		},
	},
};

/**
 * Multiple buttons showing different icons
 */
export const MultipleIcons: StoryObj<typeof StyledIconButton> = {
	render: () => (
		<div style={{ display: "flex", gap: "12px" }}>
			<StyledIconButton
				{...defaultStyledIconButtonArgs}
				icon={Eye}
				tooltip="View"
			/>
			<StyledIconButton
				{...defaultStyledIconButtonArgs}
				icon={Plus}
				isActive
				tooltip="Add"
			/>
			<StyledIconButton
				{...defaultStyledIconButtonArgs}
				icon={Settings}
				tooltip="Settings"
			/>
			<StyledIconButton
				{...defaultStyledIconButtonArgs}
				icon={Zap}
				isActive
				tooltip="Quick actions"
			/>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: "Collection of buttons with different icons and states.",
			},
		},
	},
};

/**
 * Size comparison
 */
export const SizeComparison: StoryObj<typeof StyledIconButton> = {
	render: () => (
		<div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
			<div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
				<div style={{ fontSize: "12px", fontWeight: "bold" }}>Large</div>
				<StyledIconButton
					{...defaultStyledIconButtonArgs}
					icon={Eye}
					size="lg"
					tooltip="Large button"
				/>
			</div>
			<div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
				<div style={{ fontSize: "12px", fontWeight: "bold" }}>Small</div>
				<StyledIconButton
					{...defaultStyledIconButtonArgs}
					icon={Eye}
					size="sm"
					tooltip="Small button"
				/>
			</div>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: "Side-by-side comparison of large and small sizes.",
			},
		},
	},
};
