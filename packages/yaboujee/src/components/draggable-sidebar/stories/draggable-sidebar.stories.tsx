import type { DropResult } from "@hello-pangea/dnd";
import type { Meta, StoryObj } from "@storybook/react";
import { FileText, Tag, User } from "lucide-react";
import { useState } from "react";
import { DraggableSidebar } from "../draggable-sidebar";

const codeBlock = `import { DraggableSidebar } from "@pubint/yaboujee";
import { FileText, Tag, User } from "lucide-react";
import { useState } from "react";

const [visibleSections, setVisibleSections] = useState(["pages", "tags", "author"]);
const [expandedItems, setExpandedItems] = useState(["pages"]);

const sectionMetadata = {
  pages: { 
    title: "Pages", 
    icon: FileText, 
    content: PagesContent 
  },
  tags: { 
    title: "Tags", 
    icon: Tag, 
    content: TagsContent 
  },
  author: { 
    title: "Author", 
    icon: User, 
    content: AuthorContent 
  },
};

const handleDragEnd = (result) => {
  if (!result.destination) return;
  const items = Array.from(visibleSections);
  const [reorderedItem] = items.splice(result.source.index, 1);
  items.splice(result.destination.index, 0, reorderedItem);
  setVisibleSections(items);
};

const handlePop = ({ id }) => {
  console.log(\`Popping out: \${id}\`);
};

<DraggableSidebar
  visibleSections={visibleSections}
  sectionMetadata={sectionMetadata}
  expandedItems={expandedItems}
  onExpandedChange={setExpandedItems}
  onDragEnd={handleDragEnd}
  onPop={handlePop}
  droppableId="sidebar"
  side="left"
/>
`;

const additionalMarkdownDescription = `
## Use cases
Use DraggableSidebar to create a flexible sidebar with draggable, collapsible sections. Perfect for document editors, project management tools, or any application requiring customizable sidebar layouts.

## Features
- **Draggable sections**: Reorder sections via drag-and-drop
- **Accordion sections**: Each section can expand/collapse
- **Pop-out actions**: Move sections to floating windows
- **Left/right orientation**: Supports both sidebar positions
- **Flexible content**: Any React components can be section content
- **Scroll container**: Full-height with overflow scrolling

## Section Metadata
Each section requires:
- \`title\`: Display name
- \`icon\`: Lucide icon component
- \`content\`: React component to render inside

## Callbacks
- \`onExpandedChange\`: Update expanded sections state
- \`onDragEnd\`: Handle section reordering
- \`onPop\`: Handle pop-out action for a section

## Accessibility
Full keyboard navigation support via Accordion and drag-drop libraries.
`;

// Mock content components
const PagesContent = () => (
	<div style={{ padding: "12px" }}>
		<p style={{ marginBottom: "8px" }}>Page 1: Introduction</p>
		<p style={{ marginBottom: "8px" }}>Page 2: Background</p>
		<p style={{ marginBottom: "8px" }}>Page 3: Methods</p>
		<p>Page 4: Results</p>
	</div>
);

const TagsContent = () => (
	<div style={{ padding: "12px" }}>
		<div style={{ marginBottom: "8px" }}>
			<strong>Tags:</strong>
		</div>
		<div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
			<span
				style={{
					background: "#e5e7eb",
					padding: "4px 8px",
					borderRadius: "4px",
					fontSize: "12px",
				}}
			>
				Research
			</span>
			<span
				style={{
					background: "#e5e7eb",
					padding: "4px 8px",
					borderRadius: "4px",
					fontSize: "12px",
				}}
			>
				Analysis
			</span>
			<span
				style={{
					background: "#e5e7eb",
					padding: "4px 8px",
					borderRadius: "4px",
					fontSize: "12px",
				}}
			>
				Data
			</span>
		</div>
	</div>
);

const AuthorContent = () => (
	<div style={{ padding: "12px" }}>
		<div style={{ marginBottom: "8px" }}>
			<strong>John Doe</strong>
		</div>
		<p style={{ fontSize: "14px", color: "#666" }}>john.doe@example.com</p>
	</div>
);

const sectionMetadata = {
	pages: { title: "Pages", icon: FileText, content: PagesContent },
	tags: { title: "Tags", icon: Tag, content: TagsContent },
	author: { title: "Author", icon: User, content: AuthorContent },
};

const meta: Meta<typeof DraggableSidebar> = {
	title: "Components/DraggableSidebar",
	component: DraggableSidebar,
	parameters: {
		docs: {
			description: {
				component: `A draggable sidebar with collapsible accordion sections and pop-out actions.

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
			<div
				style={{ height: "600px", width: "350px", border: "1px solid #ddd" }}
			>
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof DraggableSidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Left sidebar with multiple sections
 */
export const LeftSidebar: Story = {
	// biome-ignore lint/suspicious/noExplicitAny: custom render function doesn't use args
	args: {} as any,
	render: () => {
		const [visibleSections, setVisibleSections] = useState<string[]>([
			"pages",
			"tags",
			"author",
		]);
		const [expandedItems, setExpandedItems] = useState<string[]>(["pages"]);

		const handleDragEnd = (result: DropResult) => {
			if (!result.destination) return;
			const items = Array.from(visibleSections);
			const [reorderedItem] = items.splice(result.source.index, 1);
			items.splice(result.destination.index, 0, reorderedItem);
			setVisibleSections(items);
		};

		return (
			<DraggableSidebar
				visibleSections={visibleSections}
				sectionMetadata={sectionMetadata}
				expandedItems={expandedItems}
				onExpandedChange={setExpandedItems}
				onDragEnd={handleDragEnd}
				onPop={({ id }) => console.log(`Pop: ${id}`)}
				droppableId="left-sidebar"
				side="left"
			/>
		);
	},
	parameters: {
		docs: {
			description: {
				story:
					"Left sidebar with draggable sections. Try dragging sections to reorder them.",
			},
		},
	},
};

/**
 * Right sidebar (flipped layout)
 */
export const RightSidebar: Story = {
	// biome-ignore lint/suspicious/noExplicitAny: custom render function doesn't use args
	args: {} as any,
	render: () => {
		const [visibleSections, setVisibleSections] = useState<string[]>([
			"pages",
			"tags",
			"author",
		]);
		const [expandedItems, setExpandedItems] = useState<string[]>(["tags"]);

		const handleDragEnd = (result: DropResult) => {
			if (!result.destination) return;
			const items = Array.from(visibleSections);
			const [reorderedItem] = items.splice(result.source.index, 1);
			items.splice(result.destination.index, 0, reorderedItem);
			setVisibleSections(items);
		};

		return (
			<DraggableSidebar
				visibleSections={visibleSections}
				sectionMetadata={sectionMetadata}
				expandedItems={expandedItems}
				onExpandedChange={setExpandedItems}
				onDragEnd={handleDragEnd}
				onPop={({ id }) => console.log(`Pop: ${id}`)}
				droppableId="right-sidebar"
				side="right"
			/>
		);
	},
	parameters: {
		docs: {
			description: {
				story: "Right sidebar with flipped layout - controls on opposite side.",
			},
		},
	},
};

/**
 * Multiple sections expanded
 */
export const MultipleSectionsExpanded: Story = {
	// biome-ignore lint/suspicious/noExplicitAny: custom render function doesn't use args
	args: {} as any,
	render: () => {
		const [visibleSections, setVisibleSections] = useState<string[]>([
			"pages",
			"tags",
			"author",
		]);
		const [expandedItems, setExpandedItems] = useState<string[]>([
			"pages",
			"tags",
			"author",
		]);

		const handleDragEnd = (result: DropResult) => {
			if (!result.destination) return;
			const items = Array.from(visibleSections);
			const [reorderedItem] = items.splice(result.source.index, 1);
			items.splice(result.destination.index, 0, reorderedItem);
			setVisibleSections(items);
		};

		return (
			<DraggableSidebar
				visibleSections={visibleSections}
				sectionMetadata={sectionMetadata}
				expandedItems={expandedItems}
				onExpandedChange={setExpandedItems}
				onDragEnd={handleDragEnd}
				onPop={({ id }) => console.log(`Pop: ${id}`)}
				droppableId="expanded-sidebar"
				side="left"
			/>
		);
	},
	parameters: {
		docs: {
			description: {
				story: "All sections expanded showing overflow scrolling.",
			},
		},
	},
};

/**
 * All collapsed
 */
export const AllCollapsed: Story = {
	// biome-ignore lint/suspicious/noExplicitAny: custom render function doesn't use args
	args: {} as any,
	render: () => {
		const [visibleSections, setVisibleSections] = useState<string[]>([
			"pages",
			"tags",
			"author",
		]);
		const [expandedItems, setExpandedItems] = useState<string[]>([]);

		const handleDragEnd = (result: DropResult) => {
			if (!result.destination) return;
			const items = Array.from(visibleSections);
			const [reorderedItem] = items.splice(result.source.index, 1);
			items.splice(result.destination.index, 0, reorderedItem);
			setVisibleSections(items);
		};

		return (
			<DraggableSidebar
				visibleSections={visibleSections}
				sectionMetadata={sectionMetadata}
				expandedItems={expandedItems}
				onExpandedChange={setExpandedItems}
				onDragEnd={handleDragEnd}
				onPop={({ id }) => console.log(`Pop: ${id}`)}
				droppableId="collapsed-sidebar"
				side="left"
			/>
		);
	},
	parameters: {
		docs: {
			description: {
				story: "All sections collapsed showing compact view.",
			},
		},
	},
};

/**
 * Single section
 */
export const SingleSection: Story = {
	// biome-ignore lint/suspicious/noExplicitAny: custom render function doesn't use args
	args: {} as any,
	render: () => {
		const [visibleSections, setVisibleSections] = useState<string[]>(["pages"]);
		const [expandedItems, setExpandedItems] = useState<string[]>(["pages"]);

		const handleDragEnd = (result: DropResult) => {
			if (!result.destination) return;
			const items = Array.from(visibleSections);
			const [reorderedItem] = items.splice(result.source.index, 1);
			items.splice(result.destination.index, 0, reorderedItem);
			setVisibleSections(items);
		};

		return (
			<DraggableSidebar
				visibleSections={visibleSections}
				sectionMetadata={sectionMetadata}
				expandedItems={expandedItems}
				onExpandedChange={setExpandedItems}
				onDragEnd={handleDragEnd}
				onPop={({ id }) => console.log(`Pop: ${id}`)}
				droppableId="single-sidebar"
				side="left"
			/>
		);
	},
	parameters: {
		docs: {
			description: {
				story: "Sidebar with only one section visible.",
			},
		},
	},
};
