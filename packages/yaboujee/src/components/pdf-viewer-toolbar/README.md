# PdfViewerToolbar Component

A dock-style toolbar with rounded corners for controlling PDF viewer page navigation and zoom. Uses Button components from `@pubint/yabasic` and icons from `lucide-react`.

## Features

- **Page Navigation**: Previous/next buttons (ChevronLeft/Right icons) and direct page input
- **Zoom Controls**: Zoom in/out buttons (Plus/Minus icons) and direct zoom percentage input
- **Dock Design**: Rounded corners with shadow for modern UI
- **Dark Mode**: Full theme support
- **Accessibility**: ARIA labels and keyboard navigation
- **Icon Buttons**: Uses lucide-react icons with @yabasic Button components

## Usage

The toolbar is designed to work with the `PdfViewer` component by managing page and zoom state:

```tsx
import { useState } from "react";
import { PdfViewer, PdfViewerToolbar } from "@pubint/yaboujee";

const MyPdfApp = () => {
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1.25);
  const [numPages, setNumPages] = useState(0);

  return (
    <div>
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

- `currentPage` (number): The current page number (1-indexed)
- `totalPages` (number): Total number of pages in the document
- `zoom` (number): Current zoom level (0.5 to 3.0)
- `onPageChange` (function): Callback when page changes: `({ page }) => void`
- `onZoomChange` (function): Callback when zoom changes: `({ zoom }) => void`
- `className` (string, optional): Additional CSS classes

## Zoom Limits

- Minimum: 0.5 (50%)
- Maximum: 3.0 (300%)
- Step: 0.25 (25%)

## Positioning

The toolbar is designed to be positioned as a floating dock, typically at the bottom-center of the screen. Use Tailwind classes like:

```tsx
<div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
  <PdfViewerToolbar {...props} />
</div>
```
