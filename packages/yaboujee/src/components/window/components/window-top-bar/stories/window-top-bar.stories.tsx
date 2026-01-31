import type { Meta, StoryObj } from "@storybook/react";
import { WindowTopBar } from "../window-top-bar";
import { defaultWindowTopBarArgs } from "./shared";

const codeBlock = `import { WindowTopBar } from "@pubint/yaboujee";

// With unpop button (sidebar visible)
<WindowTopBar
  title="Page Info"
  isMaximized={false}
  sidebarCollapsed={false}
  side="left"
  onUnpop={() => returnToSidebar()}
  onClose={() => closeWindow()}
  onMaximize={() => toggleMaximize()}
/>

// With close button (sidebar collapsed)
<WindowTopBar
  title="Page Info"
  isMaximized={false}
  sidebarCollapsed={true}
  side="left"
  onUnpop={() => returnToSidebar()}
  onClose={() => closeWindow()}
  onMaximize={() => toggleMaximize()}
/>

// Maximized state
<WindowTopBar
  title="Page Info"
  isMaximized={true}
  sidebarCollapsed={false}
  side="left"
  onUnpop={() => returnToSidebar()}
  onClose={() => closeWindow()}
  onMaximize={() => toggleMaximize()}
/>
`;

const additionalMarkdownDescription = `
## Use cases
Use WindowTopBar as the title bar for floating windows in the Window component. It provides window controls and title display with drag handle functionality.

## Features
- **Draggable title bar**: Drag handle for moving windows
- **Window controls**: Maximize and close/unpop buttons
- **Conditional buttons**: Shows unpop or close based on sidebar state
- **Directional support**: Supports left and right sidebar orientations
- **Sticky positioning**: Stays at top during scroll
- **Title display**: Shows window title text

## Button Behavior
- **Sidebar not collapsed**: Shows unpop button (return to sidebar)
- **Sidebar collapsed**: Shows close button (close window)
- **Maximize button**: Always visible, toggles maximize state

## Drag Handle
The title bar acts as a drag handle for react-rnd. The cursor changes to grab/grabbing during drag operations.

## Accessibility
All buttons include proper aria-labels and keyboard support.
`;

const meta: Meta<typeof WindowTopBar> = {
	title: "Components/Window/WindowTopBar",
	component: WindowTopBar,
	parameters: {
		docs: {
			description: {
				component: `A title bar component for floating windows with drag handle and window controls.

${additionalMarkdownDescription}

## Example Usage

\`\`\`tsx
${codeBlock}
\`\`\``,
			},
		},
		layout: "padded",
	},
	tags: ["autodocs"],
	decorators: [
		(Story) => (
			<div style={{ width: "400px", border: "1px solid #ddd" }}>
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof WindowTopBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default state (not maximized, sidebar visible)
 */
export const Default: Story = {
	args: defaultWindowTopBarArgs,
	parameters: {
		docs: {
			description: {
				story:
					"Default state with unpop button (sidebar not collapsed) and maximize button.",
			},
		},
	},
};

/**
 * Maximized state
 */
export const Maximized: Story = {
	args: {
		...defaultWindowTopBarArgs,
		isMaximized: true,
	},
	parameters: {
		docs: {
			description: {
				story: "Maximized state - maximize button shows minimize/restore icon.",
			},
		},
	},
};

/**
 * Sidebar collapsed (shows close button)
 */
export const SidebarCollapsed: Story = {
	args: {
		...defaultWindowTopBarArgs,
		sidebarCollapsed: true,
	},
	parameters: {
		docs: {
			description: {
				story:
					"When sidebar is collapsed, shows close button instead of unpop button.",
			},
		},
	},
};

/**
 * Sidebar not collapsed (shows unpop button)
 */
export const SidebarNotCollapsed: Story = {
	args: {
		...defaultWindowTopBarArgs,
		sidebarCollapsed: false,
	},
	parameters: {
		docs: {
			description: {
				story:
					"When sidebar is visible, shows unpop button to return to sidebar.",
			},
		},
	},
};

/**
 * Left side window
 */
export const LeftSide: Story = {
	args: {
		...defaultWindowTopBarArgs,
		side: "left",
		title: "Left Window",
	},
	parameters: {
		docs: {
			description: {
				story: "Window popped from left sidebar.",
			},
		},
	},
};

/**
 * Right side window
 */
export const RightSide: Story = {
	args: {
		...defaultWindowTopBarArgs,
		side: "right",
		title: "Right Window",
	},
	parameters: {
		docs: {
			description: {
				story: "Window popped from right sidebar.",
			},
		},
	},
};

/**
 * Long title text
 */
export const LongTitle: Story = {
	args: {
		...defaultWindowTopBarArgs,
		title: "This is a very long window title that might overflow",
	},
	parameters: {
		docs: {
			description: {
				story: "Window with long title text.",
			},
		},
	},
};

/**
 * All button combinations
 */
export const AllCombinations: Story = {
	// biome-ignore lint/suspicious/noExplicitAny: custom render function doesn't use args
	args: {} as any,
	render: () => (
		<div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
			<div>
				<div
					style={{
						fontSize: "12px",
						fontWeight: "bold",
						marginBottom: "8px",
					}}
				>
					Not Maximized + Sidebar Visible (Unpop Button)
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
					Not Maximized + Sidebar Collapsed (Close Button)
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
					Maximized + Sidebar Visible
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
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: "All possible button combinations based on state.",
			},
		},
	},
};
