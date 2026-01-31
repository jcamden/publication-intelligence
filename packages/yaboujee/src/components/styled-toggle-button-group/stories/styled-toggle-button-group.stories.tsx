import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { StyledToggleButtonGroup } from "../styled-toggle-button-group";
import { createMockStyledButtons } from "./shared";

const codeBlock = `import { StyledToggleButtonGroup } from "@pubint/yaboujee";
import { Eye, FileText, Tag } from "lucide-react";
import { useState } from "react";

// Non-draggable
const [activeButton, setActiveButton] = useState("view");

const buttons = [
  { name: "view", icon: Eye, isActive: activeButton === "view", onClick: () => setActiveButton("view") },
  { name: "pages", icon: FileText, isActive: activeButton === "pages", onClick: () => setActiveButton("pages") },
  { name: "tags", icon: Tag, isActive: activeButton === "tags", onClick: () => setActiveButton("tags") },
];

<StyledToggleButtonGroup buttons={buttons} />

// Draggable
const [buttonOrder, setButtonOrder] = useState(buttons);

const handleReorder = ({ fromIndex, toIndex }) => {
  const newButtons = [...buttonOrder];
  const [movedButton] = newButtons.splice(fromIndex, 1);
  newButtons.splice(toIndex, 0, movedButton);
  setButtonOrder(newButtons);
};

<StyledToggleButtonGroup
  buttons={buttonOrder}
  draggable={true}
  onReorder={handleReorder}
  excludeFromDrag={["view"]} // "view" button won't be draggable
/>
`;

const additionalMarkdownDescription = `
## Use cases
Use StyledToggleButtonGroup for creating a horizontal group of styled toggle buttons with sophisticated visual effects. Ideal for toolbar controls with optional drag-and-drop reordering capability.

## Features
- **Large icon buttons**: Each button displays a large Lucide icon (h-6 w-6)
- **Sophisticated styling**: Ring and shadow effects optimized for light/dark modes
- **Active state**: Clear visual distinction with cyan glow in dark mode
- **Optional drag-and-drop**: Reorder buttons by dragging
- **Exclude from drag**: Some buttons can be locked in place
- **Hover effects**: Ring highlight on hover in both modes
- **Accessibility**: Full keyboard navigation and aria-labels

## Styling Details

### Light Mode
- **Inactive**: Ring + shadow for depth
- **Active**: Subtle ring, no shadow  
- **Hover**: Visible ring effect

### Dark Mode
- **Inactive**: Shadow only (no ring), dark background
- **Active**: Ring visible, no shadow, cyan icon with glow effect
- **Hover**: Bright ring effect

### Drag Behavior
- Cursor changes to grab/grabbing during drag
- Opacity reduction while dragging
- Smooth reordering with placeholder
- First/last buttons can be excluded from drag

## Accessibility
Buttons support both mouse and keyboard interaction, with proper aria-labels and keyboard navigation between buttons.
`;

const meta = {
	title: "Components/StyledToggleButtonGroup",
	component: StyledToggleButtonGroup,
	parameters: {
		docs: {
			description: {
				component: `A horizontal group of styled toggle buttons with sophisticated ring and shadow effects for both light and dark modes. Supports optional drag-and-drop reordering.

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
} satisfies Meta<typeof StyledToggleButtonGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default non-draggable group with mixed active states
 */
export const Default: Story = {
	// biome-ignore lint/suspicious/noExplicitAny: custom render function doesn't use args
	args: {} as any,
	render: () => {
		const [activeIndex, setActiveIndex] = useState(0);
		const buttons = createMockStyledButtons({
			count: 3,
			activeIndices: [],
		}).map((btn, i) => ({
			...btn,
			isActive: activeIndex === i,
			onClick: () => setActiveIndex(i),
		}));

		return <StyledToggleButtonGroup buttons={buttons} />;
	},
	parameters: {
		docs: {
			description: {
				story: "Default non-draggable group with interactive state management.",
			},
		},
	},
};

/**
 * All buttons active
 */
export const AllActive: Story = {
	args: {
		buttons: createMockStyledButtons({ count: 3, activeIndices: [0, 1, 2] }),
	},
	parameters: {
		docs: {
			description: {
				story: "All buttons in active state showing cyan glow effect.",
			},
		},
	},
};

/**
 * All buttons inactive
 */
export const AllInactive: Story = {
	args: {
		buttons: createMockStyledButtons({ count: 3, activeIndices: [] }),
	},
	parameters: {
		docs: {
			description: {
				story: "All buttons in inactive state with ring/shadow effects.",
			},
		},
	},
};

/**
 * Single active button
 */
export const SingleActive: Story = {
	args: {
		buttons: createMockStyledButtons({ count: 3, activeIndices: [1] }),
	},
	parameters: {
		docs: {
			description: {
				story: "Only middle button is active.",
			},
		},
	},
};

/**
 * Draggable version
 */
export const Draggable: Story = {
	// biome-ignore lint/suspicious/noExplicitAny: custom render function doesn't use args
	args: {} as any,
	render: () => {
		const [buttons, setButtons] = useState(
			createMockStyledButtons({ count: 4, activeIndices: [0] }),
		);

		const handleReorder = ({
			fromIndex,
			toIndex,
		}: {
			fromIndex: number;
			toIndex: number;
		}) => {
			const newButtons = [...buttons];
			const [movedButton] = newButtons.splice(fromIndex, 1);
			newButtons.splice(toIndex, 0, movedButton);
			setButtons(newButtons);
		};

		return (
			<div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
				<StyledToggleButtonGroup
					buttons={buttons}
					draggable={true}
					onReorder={handleReorder}
				/>
				<div style={{ fontSize: "14px", color: "#666" }}>
					Drag buttons to reorder them
				</div>
			</div>
		);
	},
	parameters: {
		docs: {
			description: {
				story: "Draggable version - click and drag buttons to reorder them.",
			},
		},
	},
};

/**
 * With excluded buttons (first and last locked)
 */
export const WithExcludeFromDrag: Story = {
	// biome-ignore lint/suspicious/noExplicitAny: custom render function doesn't use args
	args: {} as any,
	render: () => {
		const [buttons, setButtons] = useState(
			createMockStyledButtons({ count: 4, activeIndices: [0] }),
		);

		const handleReorder = ({
			fromIndex,
			toIndex,
		}: {
			fromIndex: number;
			toIndex: number;
		}) => {
			const newButtons = [...buttons];
			const [movedButton] = newButtons.splice(fromIndex, 1);
			newButtons.splice(toIndex, 0, movedButton);
			setButtons(newButtons);
		};

		return (
			<div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
				<StyledToggleButtonGroup
					buttons={buttons}
					draggable={true}
					onReorder={handleReorder}
					excludeFromDrag={["view", "settings"]}
				/>
				<div style={{ fontSize: "14px", color: "#666" }}>
					First and last buttons are locked in place
				</div>
			</div>
		);
	},
	parameters: {
		docs: {
			description: {
				story:
					"Draggable with first and last buttons excluded - they stay in place.",
			},
		},
	},
};

/**
 * Many buttons
 */
export const ManyButtons: Story = {
	args: {
		buttons: createMockStyledButtons({ count: 5, activeIndices: [1, 3] }),
	},
	parameters: {
		docs: {
			description: {
				story: "Group with 5 buttons showing layout scaling.",
			},
		},
	},
};

/**
 * Interactive multi-select
 */
export const InteractiveMultiSelect: Story = {
	// biome-ignore lint/suspicious/noExplicitAny: custom render function doesn't use args
	args: {} as any,
	render: () => {
		const [activeButtons, setActiveButtons] = useState<number[]>([0]);

		const buttons = createMockStyledButtons({
			count: 4,
			activeIndices: [],
		}).map((btn, i) => ({
			...btn,
			isActive: activeButtons.includes(i),
			onClick: () => {
				if (activeButtons.includes(i)) {
					setActiveButtons(activeButtons.filter((idx) => idx !== i));
				} else {
					setActiveButtons([...activeButtons, i]);
				}
			},
		}));

		return (
			<div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
				<StyledToggleButtonGroup buttons={buttons} />
				<div style={{ fontSize: "14px", color: "#666" }}>
					Active buttons:{" "}
					{activeButtons.length === 0 ? "none" : activeButtons.join(", ")}
				</div>
			</div>
		);
	},
	parameters: {
		docs: {
			description: {
				story:
					"Interactive example with multiple active states (click buttons to toggle).",
			},
		},
	},
};
