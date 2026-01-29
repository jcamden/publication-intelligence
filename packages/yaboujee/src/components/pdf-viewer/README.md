# PDF Viewer Component

A minimal PDF viewer built with PDF.js that displays one page at a time. Use with `PdfViewerToolbar` for navigation controls.

## Features

- **Controlled Component**: Page and zoom controlled via props
- **Loading States**: Spinner during PDF load
- **Error Handling**: Clear error messages
- **Configurable Scale**: Adjust zoom level
- **Theme Support**: Light and dark mode
- **External Navigation**: Pairs with `PdfViewerToolbar` for controls

## Installation

The component requires `pdfjs-dist` which is already included in yaboujee's dependencies.

## Setup

### Automatic Setup (Recommended)

Worker files are automatically copied after `pnpm install` via the `postinstall` script:

```bash
pnpm install  # Worker files are automatically copied
```

The script copies `pdf.worker.min.mjs` to:
- `packages/yaboujee/.storybook/public/` (for yaboujee Storybook)
- `apps/index-pdf-frontend/public/` (for Next.js app + Storybook)

### Manual Setup (If Needed)

If worker files are missing, run:

```bash
pnpm pdf:copy-workers
```

### For Other Next.js Applications

If you're using this component in a different Next.js app, copy the worker file:

```bash
cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/pdf.worker.min.mjs
```

### Updating PDF.js

When upgrading `pdfjs-dist`, the worker files are automatically updated during `pnpm install`. No manual action needed!

## Usage

The viewer is a controlled component that requires state management. Pair it with `PdfViewerToolbar` for navigation controls:

```tsx
import { useState } from "react";
import { PdfViewer, PdfViewerToolbar } from "@pubint/yaboujee";

export const MyComponent = () => {
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1.25);
  const [numPages, setNumPages] = useState(0);

  return (
    <div className="relative h-screen">
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
        <PdfViewerToolbar
          currentPage={page}
          totalPages={numPages}
          zoom={zoom}
          onPageChange={({ page }) => setPage(page)}
          onZoomChange={({ zoom }) => setZoom(zoom)}
        />
      </div>
      
      <PdfViewer
        url="/document.pdf"
        scale={zoom}
        currentPage={page}
        onPageChange={({ page }) => setPage(page)}
        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
      />
    </div>
  );
};
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `url` | `string` | required | URL of the PDF file to display |
| `scale` | `number` | `1.25` | Scale/zoom level for rendering pages |
| `currentPage` | `number` | `1` | Current page number to display (1-indexed) |
| `onPageChange` | `function` | `undefined` | Callback when page changes: `({ page }) => void` |
| `onLoadSuccess` | `function` | `undefined` | Callback when PDF loads: `({ numPages }) => void` |
| `className` | `string` | `""` | Additional CSS classes |

## Examples

### Basic Viewer (No Controls)

```tsx
const [page, setPage] = useState(1);
const [numPages, setNumPages] = useState(0);

<PdfViewer 
  url="/document.pdf"
  currentPage={page}
  onPageChange={({ page }) => setPage(page)}
  onLoadSuccess={({ numPages }) => setNumPages(numPages)}
/>
```

### With Custom Zoom

```tsx
const [page, setPage] = useState(1);
const [zoom, setZoom] = useState(2.0);
const [numPages, setNumPages] = useState(0);

<PdfViewer 
  url="/document.pdf"
  scale={zoom}
  currentPage={page}
  onPageChange={({ page }) => setPage(page)}
  onLoadSuccess={({ numPages }) => setNumPages(numPages)}
/>
```

### With Toolbar (Recommended)

See the Usage section above for a complete example with `PdfViewerToolbar`.

## Architecture

The component uses:
- **PDF.js**: For PDF rendering to canvas
- **Web Worker**: Off-main-thread parsing for performance
- **React Hooks**: For state management and effects
- **CSS Custom Properties**: For theme-aware styling

## Storybook

View the component in Storybook:

```bash
# From yaboujee package
cd packages/yaboujee
pnpm storybook

# Or from index-pdf-frontend
cd apps/index-pdf-frontend
pnpm storybook
```

The component includes:
- Main stories with variants
- Interaction tests
- Visual regression tests (light/dark themes)

## Related Components

- **PdfViewerToolbar**: Dock-style toolbar for page and zoom controls

## Known Limitations

- Renders one page at a time (not continuous scroll)
- No text selection support
- No search functionality
- No thumbnail navigation
- Navigation controls must be provided externally

## Future Enhancements

- Continuous scroll mode
- Text selection and copy
- Search with highlighting
- Thumbnail sidebar
- Annotation support
- Print functionality
