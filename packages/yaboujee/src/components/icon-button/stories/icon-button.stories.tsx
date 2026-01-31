import type { Meta, StoryObj } from "@storybook/react";
import { CloseButton, MaximizeButton, PopButton, UnpopButton } from "../index";
import {
	defaultCloseButtonArgs,
	defaultMaximizeButtonArgs,
	defaultPopButtonArgs,
	defaultUnpopButtonArgs,
} from "./shared";

const codeBlock = `import { CloseButton, MaximizeButton, PopButton, UnpopButton } from "@pubint/yaboujee";

// Close button
<CloseButton onClick={() => console.log("close")} />

// Maximize button
<MaximizeButton 
  isMaximized={false} 
  onClick={() => console.log("maximize")} 
/>

// Pop out button
<PopButton onClick={() => console.log("pop")} />

// Unpop button (return to sidebar)
<UnpopButton 
  side="left" 
  onClick={() => console.log("unpop")} 
/>
`;

const additionalMarkdownDescription = `
## Use cases
These icon buttons are used for window management controls in the yaboujee component library. They provide consistent styling and behavior for common window actions.

## Features
- **CloseButton**: Close a window or dismiss a panel
- **MaximizeButton**: Toggle between maximized and restored window states
- **PopButton**: Pop content out from sidebar to a floating window
- **UnpopButton**: Return content from floating window back to sidebar
- Consistent ghost button styling
- Stop propagation by default (safe for nested click handlers)
- Full accessibility with aria-labels
- Disabled state support

## Accessibility
All buttons include proper aria-labels and support keyboard navigation.
`;

const meta = {
	title: "Components/IconButton",
	parameters: {
		docs: {
			description: {
				component: `A collection of icon buttons for window and panel management.

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
} satisfies Meta;

export default meta;

/**
 * Close button for dismissing windows or panels
 */
export const Close: StoryObj<typeof CloseButton> = {
	render: () => <CloseButton {...defaultCloseButtonArgs} />,
	parameters: {
		docs: {
			description: {
				story: "Standard close button with X icon.",
			},
		},
	},
};

/**
 * Close button in disabled state
 */
export const CloseDisabled: StoryObj<typeof CloseButton> = {
	render: () => <CloseButton {...defaultCloseButtonArgs} disabled />,
	parameters: {
		docs: {
			description: {
				story: "Close button when disabled.",
			},
		},
	},
};

/**
 * Maximize button in default (not maximized) state
 */
export const Maximize: StoryObj<typeof MaximizeButton> = {
	render: () => <MaximizeButton {...defaultMaximizeButtonArgs} />,
	parameters: {
		docs: {
			description: {
				story: "Maximize button showing maximize icon.",
			},
		},
	},
};

/**
 * Maximize button in maximized state (shows restore icon)
 */
export const MaximizeRestoreState: StoryObj<typeof MaximizeButton> = {
	render: () => <MaximizeButton {...defaultMaximizeButtonArgs} isMaximized />,
	parameters: {
		docs: {
			description: {
				story: "Maximize button when window is maximized, shows minimize icon.",
			},
		},
	},
};

/**
 * Maximize button in disabled state
 */
export const MaximizeDisabled: StoryObj<typeof MaximizeButton> = {
	render: () => <MaximizeButton {...defaultMaximizeButtonArgs} disabled />,
	parameters: {
		docs: {
			description: {
				story: "Maximize button when disabled.",
			},
		},
	},
};

/**
 * Pop button for popping content out to a window
 */
export const Pop: StoryObj<typeof PopButton> = {
	render: () => <PopButton {...defaultPopButtonArgs} />,
	parameters: {
		docs: {
			description: {
				story: "Pop button with arrow pointing out and up.",
			},
		},
	},
};

/**
 * Pop button in disabled state
 */
export const PopDisabled: StoryObj<typeof PopButton> = {
	render: () => <PopButton {...defaultPopButtonArgs} disabled />,
	parameters: {
		docs: {
			description: {
				story: "Pop button when disabled.",
			},
		},
	},
};

/**
 * Unpop button for left sidebar (arrow points down-left)
 */
export const UnpopLeft: StoryObj<typeof UnpopButton> = {
	render: () => <UnpopButton {...defaultUnpopButtonArgs} side="left" />,
	parameters: {
		docs: {
			description: {
				story: "Unpop button for left sidebar with arrow pointing down-left.",
			},
		},
	},
};

/**
 * Unpop button for right sidebar (arrow points down-right)
 */
export const UnpopRight: StoryObj<typeof UnpopButton> = {
	render: () => <UnpopButton {...defaultUnpopButtonArgs} side="right" />,
	parameters: {
		docs: {
			description: {
				story: "Unpop button for right sidebar with arrow pointing down-right.",
			},
		},
	},
};

/**
 * Unpop button in disabled state
 */
export const UnpopDisabled: StoryObj<typeof UnpopButton> = {
	render: () => <UnpopButton {...defaultUnpopButtonArgs} disabled />,
	parameters: {
		docs: {
			description: {
				story: "Unpop button when disabled.",
			},
		},
	},
};

/**
 * All buttons shown together
 */
export const AllButtons: StoryObj = {
	render: () => (
		<div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
			<CloseButton {...defaultCloseButtonArgs} />
			<MaximizeButton {...defaultMaximizeButtonArgs} />
			<MaximizeButton {...defaultMaximizeButtonArgs} isMaximized />
			<PopButton {...defaultPopButtonArgs} />
			<UnpopButton {...defaultUnpopButtonArgs} side="left" />
			<UnpopButton {...defaultUnpopButtonArgs} side="right" />
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: "All icon buttons displayed together for comparison.",
			},
		},
	},
};
