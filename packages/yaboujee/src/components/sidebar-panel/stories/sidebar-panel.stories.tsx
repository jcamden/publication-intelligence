import type { Meta, StoryObj } from "@storybook/react";
import { SidebarPanel } from "../sidebar-panel";
import { defaultSidebarPanelArgs } from "./shared";

const codeBlock = `import { SidebarPanel } from "@pubint/yaboujee";

// With title and close button
<SidebarPanel title="Page Info" onClose={() => setVisible(false)}>
  <div>Panel content here</div>
</SidebarPanel>

// Title only
<SidebarPanel title="Page Info">
  <div>Panel content without close button</div>
</SidebarPanel>

// Content only
<SidebarPanel>
  <div>Panel content without header</div>
</SidebarPanel>
`;

const additionalMarkdownDescription = `
## Use cases
Use the SidebarPanel component to create consistent panel containers for sidebar content. It provides a card-based design with optional header elements.

## Features
- **Card-based design**: Consistent styling with elevation
- **Optional title header**: Display a title at the top of the panel
- **Optional close button**: Allow users to dismiss the panel
- **Flexible content**: Any React content can be placed inside
- **Consistent spacing**: Automatic padding and border styling

## Variations
- **Full header**: With both title and close button
- **Title only**: Shows title without close button
- **Close only**: Shows close button without title
- **No header**: Content only, no header elements

## Accessibility
Close buttons include proper aria-labels for screen readers.
`;

const meta = {
	title: "Components/SidebarPanel",
	component: SidebarPanel,
	parameters: {
		docs: {
			description: {
				component: `A reusable panel container for sidebar content with optional title and close button.

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
} satisfies Meta<typeof SidebarPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Panel with both title and close button
 */
export const WithTitleAndClose: Story = {
	args: {
		...defaultSidebarPanelArgs,
		title: "Panel Title",
		children: (
			<div>
				<p>This is the panel content.</p>
				<p>It can contain any React elements.</p>
			</div>
		),
	},
	parameters: {
		docs: {
			description: {
				story: "Panel with both title and close button in the header.",
			},
		},
	},
};

/**
 * Panel with title only (no close button)
 */
export const TitleOnly: Story = {
	args: {
		title: "Panel Title",
		children: (
			<div>
				<p>This panel has a title but no close button.</p>
			</div>
		),
	},
	parameters: {
		docs: {
			description: {
				story: "Panel with only a title, no close button.",
			},
		},
	},
};

/**
 * Panel with close button only (no title)
 */
export const CloseOnly: Story = {
	args: {
		onClose: defaultSidebarPanelArgs.onClose,
		children: (
			<div>
				<p>This panel has a close button but no title.</p>
			</div>
		),
	},
	parameters: {
		docs: {
			description: {
				story: "Panel with only a close button, no title.",
			},
		},
	},
};

/**
 * Panel without header (content only)
 */
export const NoHeader: Story = {
	args: {
		children: (
			<div>
				<p>This panel has no header elements.</p>
				<p>Only the content is displayed with padding.</p>
			</div>
		),
	},
	parameters: {
		docs: {
			description: {
				story: "Panel without any header elements, just content.",
			},
		},
	},
};

/**
 * Panel with rich content
 */
export const WithRichContent: Story = {
	args: {
		...defaultSidebarPanelArgs,
		title: "Document Information",
		children: (
			<div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
				<div>
					<strong>Title:</strong> Sample Document
				</div>
				<div>
					<strong>Author:</strong> John Doe
				</div>
				<div>
					<strong>Date:</strong> January 31, 2026
				</div>
				<div>
					<strong>Pages:</strong> 42
				</div>
				<div style={{ marginTop: "8px" }}>
					<p style={{ fontSize: "14px", color: "#666" }}>
						This is a sample panel showing how rich content can be displayed
						within the sidebar panel component.
					</p>
				</div>
			</div>
		),
	},
	parameters: {
		docs: {
			description: {
				story: "Panel displaying structured content with multiple elements.",
			},
		},
	},
};

/**
 * Panel with custom className
 */
export const CustomClassName: Story = {
	args: {
		...defaultSidebarPanelArgs,
		title: "Custom Styled Panel",
		className: "shadow-2xl",
		children: (
			<div>
				<p>This panel has a custom className applied for additional styling.</p>
			</div>
		),
	},
	parameters: {
		docs: {
			description: {
				story:
					"Panel with custom className for additional styling customization.",
			},
		},
	},
};
