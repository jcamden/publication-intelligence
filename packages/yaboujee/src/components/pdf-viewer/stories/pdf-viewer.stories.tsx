import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { PdfViewer } from "../pdf-viewer";

const codeBlock = `import { PdfViewer } from "@pubint/yaboujee";
import { useState } from "react";

const MyComponent = () => {
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1.25);
  const [numPages, setNumPages] = useState(0);

  return (
    <PdfViewer 
      url="/document.pdf" 
      scale={zoom}
      currentPage={page}
      onPageChange={({ page }) => setPage(page)}
      onLoadSuccess={({ numPages }) => setNumPages(numPages)}
    />
  );
};
`;

const additionalMarkdownDescription = `
## Use cases
Use the PDF Viewer when you need to display PDF documents in your application. Pair it with PdfViewerToolbar for page navigation and zoom controls.

## Features
- **Controlled Component**: Page and zoom controlled via props
- **Loading States**: Shows spinner while PDF is loading
- **Error Handling**: Displays error messages if PDF fails to load
- **Configurable Scale**: Adjust zoom level with the scale prop
- **Theme Support**: Works with both light and dark themes
- **External Navigation**: Use with PdfViewerToolbar for controls

## Setup Requirements

The PDF.js worker file must be available in your public directory:

\`\`\`bash
cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/pdf.worker.min.mjs
\`\`\`

## Accessibility
- Semantic HTML structure
- Keyboard-friendly navigation when used with toolbar
`;

export default {
	component: PdfViewer,
	title: "Components/PdfViewer",
	parameters: {
		docs: {
			description: {
				component: `A minimal PDF viewer component built with PDF.js that renders one page at a time. Use with PdfViewerToolbar for navigation controls.

${additionalMarkdownDescription}

## Example Usage

\`\`\`tsx
${codeBlock}
\`\`\``,
			},
		},
		layout: "fullscreen",
	},
} satisfies Meta<typeof PdfViewer>;

export const Default: StoryObj<typeof PdfViewer> = {
	render: () => {
		const [page, setPage] = useState(1);
		const [_numPages, setNumPages] = useState(0);

		return (
			<PdfViewer
				url="/sample.pdf"
				scale={1.25}
				currentPage={page}
				onPageChange={({ page }) => setPage(page)}
				onLoadSuccess={({ numPages }) => setNumPages(numPages)}
			/>
		);
	},
	parameters: {
		docs: {
			description: {
				story: "Default PDF viewer with standard scale (1.25).",
			},
		},
	},
};

export const Zoomed: StoryObj<typeof PdfViewer> = {
	render: () => {
		const [page, setPage] = useState(1);
		const [_numPages, setNumPages] = useState(0);

		return (
			<PdfViewer
				url="/sample.pdf"
				scale={2.0}
				currentPage={page}
				onPageChange={({ page }) => setPage(page)}
				onLoadSuccess={({ numPages }) => setNumPages(numPages)}
			/>
		);
	},
	parameters: {
		docs: {
			description: {
				story: "PDF viewer with increased zoom level.",
			},
		},
	},
};

export const SmallScale: StoryObj<typeof PdfViewer> = {
	render: () => {
		const [page, setPage] = useState(1);
		const [_numPages, setNumPages] = useState(0);

		return (
			<PdfViewer
				url="/sample.pdf"
				scale={0.75}
				currentPage={page}
				onPageChange={({ page }) => setPage(page)}
				onLoadSuccess={({ numPages }) => setNumPages(numPages)}
			/>
		);
	},
	parameters: {
		docs: {
			description: {
				story: "PDF viewer with reduced scale for overview.",
			},
		},
	},
};

export const ErrorState: StoryObj<typeof PdfViewer> = {
	render: () => {
		const [page, setPage] = useState(1);
		const [_numPages, setNumPages] = useState(0);

		return (
			<PdfViewer
				url="/nonexistent.pdf"
				scale={1.25}
				currentPage={page}
				onPageChange={({ page }) => setPage(page)}
				onLoadSuccess={({ numPages }) => setNumPages(numPages)}
			/>
		);
	},
	parameters: {
		docs: {
			description: {
				story: "Shows error state when PDF fails to load.",
			},
		},
	},
};
