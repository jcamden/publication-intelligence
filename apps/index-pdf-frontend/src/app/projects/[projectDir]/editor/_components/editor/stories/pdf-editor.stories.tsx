import type { Meta, StoryObj } from "@storybook/react";
import { Editor } from "../editor";
import { ERROR_PDF_URL, SAMPLE_PDF_URL } from "./shared";

const codeBlock = `import { Editor } from "@/app/projects/[projectDir]/editor/_components/editor";

const MyComponent = () => {
  return <Editor fileUrl="/document.pdf" />;
};
`;

const additionalMarkdownDescription = `
## Use cases
Use the PDF Editor for indexing and annotating PDF documents with project-level and page-level metadata.

## Features
- **Three-Section Layout**: Project sidebar (left) | PDF viewer (center) | Page sidebar (right)
- **Collapsible Sidebars**: Toggle visibility of project and page sidebars
- **Resizable Sections**: Drag handles to adjust sidebar widths
- **Floating Windows**: Pop out sections into draggable/resizable windows
- **State Persistence**: Layout preferences saved to localStorage
- **Theme Support**: Works with both light and dark themes
- **Accordion Panels**: Organized sections for different types of metadata
- **PDF Navigation**: Integrated toolbar for page navigation and zoom controls

## Architecture
The editor uses Jotai for state management with atoms for:
- Sidebar widths and collapse states
- Section visibility and order
- Window positions and sizes
- Current page and zoom level
- PDF visibility toggle

## Accessibility
- Semantic HTML structure
- Keyboard-friendly navigation
- ARIA labels for all interactive elements
`;

const meta: Meta<typeof Editor> = {
	title: "Projects/[ProjectDir]/Editor",
	component: Editor,
	tags: ["autodocs"],
	parameters: {
		docs: {
			description: {
				component: `A comprehensive PDF editor with three-section layout for indexing and annotating documents. Features collapsible sidebars, floating windows, and persistent state management.

${additionalMarkdownDescription}

## Example Usage

\`\`\`tsx
${codeBlock}
\`\`\``,
			},
		},
		layout: "fullscreen",
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		fileUrl: SAMPLE_PDF_URL,
		projectId: "test-project-id",
	},
	parameters: {
		docs: {
			description: {
				story:
					"Default PDF editor with all three sections visible (project sidebar, PDF viewer, and page sidebar).",
			},
		},
	},
};

export const ErrorState: Story = {
	args: {
		fileUrl: ERROR_PDF_URL,
		projectId: "test-project-id",
	},
	parameters: {
		docs: {
			description: {
				story:
					"Shows error state when PDF fails to load. The editor layout remains functional but the PDF viewer displays an error message.",
			},
		},
	},
};
