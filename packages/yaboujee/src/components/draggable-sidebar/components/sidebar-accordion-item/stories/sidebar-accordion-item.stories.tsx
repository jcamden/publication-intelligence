import { Accordion } from "@pubint/yabasic/components/ui/accordion";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { SidebarAccordionItem } from "../sidebar-accordion-item";
import {
	defaultSidebarAccordionItemArgs,
	mockDragHandleProps,
	sampleContent,
	sampleIcons,
} from "./shared";

const codeBlock = `import { SidebarAccordionItem } from "@pubint/yaboujee";
import { Accordion } from "@pubint/yabasic";
import { FileText } from "lucide-react";

// Inside DraggableSidebar (with drag-and-drop context)
<Accordion value={expandedItems} onValueChange={setExpandedItems}>
  <SidebarAccordionItem
    value="pages"
    title="Pages"
    icon={FileText}
    onPop={() => handlePop("pages")}
    dragHandleProps={provided.dragHandleProps}
    index={0}
    side="left"
  >
    <PagesContent />
  </SidebarAccordionItem>
</Accordion>
`;

const additionalMarkdownDescription = `
## Use cases
Use SidebarAccordionItem as the building block for sections within DraggableSidebar. Each item represents a collapsible section with a drag handle for reordering and a pop-out button.

## Features
- **Accordion integration**: Built on shadcn/ui Accordion components
- **Drag handle**: Optional drag handle for reordering (from react-beautiful-dnd)
- **Pop button**: Action to pop content out to a floating window
- **Directional layout**: Supports left and right sidebar orientations
- **Icon support**: Displays a Lucide icon next to the title
- **Border handling**: First item has no top border, others do

## Layout Variants
- **Left side**: Default layout with drag handle on left, pop button on right
- **Right side**: Flipped layout with drag handle on right, pop button on left

## Accessibility
- Accordion trigger supports keyboard navigation
- Drag handle has proper ARIA labels
- Pop button has descriptive aria-label

## Integration
This component is designed to be used within DraggableSidebar and requires an Accordion parent component. The dragHandleProps come from @hello-pangea/dnd's Draggable component.
`;

const meta: Meta<typeof SidebarAccordionItem> = {
	title: "Components/DraggableSidebar/SidebarAccordionItem",
	component: SidebarAccordionItem,
	parameters: {
		docs: {
			description: {
				component: `An accordion item component designed for draggable sidebars with left/right orientation support.

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
			<div style={{ width: "300px", border: "1px solid #ddd" }}>
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof SidebarAccordionItem>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Left side accordion item
 */
export const LeftSide: Story = {
	// biome-ignore lint/suspicious/noExplicitAny: custom render function doesn't use args
	args: {} as any,
	render: () => {
		const [expanded, setExpanded] = useState<string[]>(["test-section"]);

		return (
			<Accordion value={expanded} onValueChange={setExpanded}>
				<SidebarAccordionItem
					{...defaultSidebarAccordionItemArgs}
					side="left"
					dragHandleProps={mockDragHandleProps}
				>
					{sampleContent()}
				</SidebarAccordionItem>
			</Accordion>
		);
	},
	parameters: {
		docs: {
			description: {
				story:
					"Left side orientation with drag handle on left and pop button on right.",
			},
		},
	},
};

/**
 * Right side accordion item
 */
export const RightSide: Story = {
	// biome-ignore lint/suspicious/noExplicitAny: custom render function doesn't use args
	args: {} as any,
	render: () => {
		const [expanded, setExpanded] = useState<string[]>(["test-section"]);

		return (
			<Accordion value={expanded} onValueChange={setExpanded}>
				<SidebarAccordionItem
					{...defaultSidebarAccordionItemArgs}
					side="right"
					dragHandleProps={mockDragHandleProps}
				>
					{sampleContent()}
				</SidebarAccordionItem>
			</Accordion>
		);
	},
	parameters: {
		docs: {
			description: {
				story:
					"Right side orientation with flipped layout - drag handle on right, pop button on left.",
			},
		},
	},
};

/**
 * Collapsed state
 */
export const Collapsed: Story = {
	// biome-ignore lint/suspicious/noExplicitAny: custom render function doesn't use args
	args: {} as any,
	render: () => {
		const [expanded, setExpanded] = useState<string[]>([]);

		return (
			<Accordion value={expanded} onValueChange={setExpanded}>
				<SidebarAccordionItem
					{...defaultSidebarAccordionItemArgs}
					dragHandleProps={mockDragHandleProps}
				>
					{sampleContent()}
				</SidebarAccordionItem>
			</Accordion>
		);
	},
	parameters: {
		docs: {
			description: {
				story: "Collapsed accordion item (content hidden).",
			},
		},
	},
};

/**
 * First item (no top border)
 */
export const FirstItem: Story = {
	// biome-ignore lint/suspicious/noExplicitAny: custom render function doesn't use args
	args: {} as any,
	render: () => {
		const [expanded, setExpanded] = useState<string[]>(["test-section"]);

		return (
			<Accordion value={expanded} onValueChange={setExpanded}>
				<SidebarAccordionItem
					{...defaultSidebarAccordionItemArgs}
					index={0}
					dragHandleProps={mockDragHandleProps}
				>
					{sampleContent()}
				</SidebarAccordionItem>
			</Accordion>
		);
	},
	parameters: {
		docs: {
			description: {
				story: "First item (index 0) has no top border.",
			},
		},
	},
};

/**
 * Non-first item (with top border)
 */
export const NonFirstItem: Story = {
	// biome-ignore lint/suspicious/noExplicitAny: custom render function doesn't use args
	args: {} as any,
	render: () => {
		const [expanded, setExpanded] = useState<string[]>(["test-section"]);

		return (
			<Accordion value={expanded} onValueChange={setExpanded}>
				<SidebarAccordionItem
					{...defaultSidebarAccordionItemArgs}
					index={1}
					dragHandleProps={mockDragHandleProps}
				>
					{sampleContent()}
				</SidebarAccordionItem>
			</Accordion>
		);
	},
	parameters: {
		docs: {
			description: {
				story: "Non-first item (index > 0) has a top border.",
			},
		},
	},
};

/**
 * Multiple items showing interaction
 */
export const MultipleItems: Story = {
	// biome-ignore lint/suspicious/noExplicitAny: custom render function doesn't use args
	args: {} as any,
	render: () => {
		const [expanded, setExpanded] = useState<string[]>(["pages"]);

		return (
			<Accordion value={expanded} onValueChange={setExpanded}>
				<SidebarAccordionItem
					value="pages"
					title="Pages"
					icon={sampleIcons.pages}
					onPop={() => console.log("pop pages")}
					index={0}
					side="left"
					dragHandleProps={mockDragHandleProps}
				>
					<div style={{ padding: "12px" }}>
						<p>Pages content here</p>
					</div>
				</SidebarAccordionItem>

				<SidebarAccordionItem
					value="tags"
					title="Tags"
					icon={sampleIcons.tags}
					onPop={() => console.log("pop tags")}
					index={1}
					side="left"
					dragHandleProps={mockDragHandleProps}
				>
					<div style={{ padding: "12px" }}>
						<p>Tags content here</p>
					</div>
				</SidebarAccordionItem>
			</Accordion>
		);
	},
	parameters: {
		docs: {
			description: {
				story: "Multiple accordion items showing expand/collapse interaction.",
			},
		},
	},
};

/**
 * Without drag handle
 */
export const WithoutDragHandle: Story = {
	// biome-ignore lint/suspicious/noExplicitAny: custom render function doesn't use args
	args: {} as any,
	render: () => {
		const [expanded, setExpanded] = useState<string[]>(["test-section"]);

		return (
			<Accordion value={expanded} onValueChange={setExpanded}>
				<SidebarAccordionItem
					{...defaultSidebarAccordionItemArgs}
					dragHandleProps={null}
				>
					{sampleContent()}
				</SidebarAccordionItem>
			</Accordion>
		);
	},
	parameters: {
		docs: {
			description: {
				story: "Accordion item without drag handle (not draggable).",
			},
		},
	},
};
