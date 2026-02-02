# Phase 2: Highlight Rendering

**Status:** ✅ Complete  
**Plan Doc:** `~/.cursor/plans/pdf_highlight_overlay_phase2.plan.md`

## Overview

Integrated PdfHighlightLayer component with coordinate conversion to render highlights from PDF user space coordinates.

## Deliverables

- ✅ Coordinate conversion helper (PDF user space → DOM pixels)
- ✅ PdfHighlightLayer integrated between canvas and text layer
- ✅ Per-page highlight filtering and conversion
- ✅ Highlights prop added to PdfViewer
- ✅ onHighlightClick callback for interactions
- ✅ Types exported from yaboujee

## Technical Implementation

**Coordinate Conversion:**
```tsx
const convertBboxToViewport = (
  bbox: BoundingBox,
  viewport: pdfjsLib.PageViewport
): BoundingBox => {
  const [xA, yA, xB, yB] = viewport.convertToViewportRectangle([
    bbox.x,
    bbox.y,
    bbox.x + bbox.width,
    bbox.y + bbox.height,
  ]);
  
  return {
    x: Math.min(xA, xB),
    y: Math.min(yA, yB),
    width: Math.abs(xA - xB),
    height: Math.abs(yA - yB),
  };
};
```

**Per-Page Processing:**
- Each page has its own viewport (different size/rotation)
- Highlights filtered by page number
- Converted using page-specific viewport
- Rendered in DOM pixel space

## Validation

- ✅ Highlights align correctly with PDF content
- ✅ Alignment maintained at scales: 0.75x, 1.0x, 1.5x, 2.0x
- ✅ Only current page highlights visible
- ✅ Hover/click interactions work
- ✅ Performance good with 10-20 highlights per page

## Key Learning

**Coordinate System:** PyMuPDF bboxes (PDF user space, bottom-left origin, points) are canonical for storage. PDF.js viewport coordinates are display-only and derived at render time.

This validated our architecture for Phase 3's reverse conversion (DOM → PDF).

## Next Phase

Phase 3 implements the reverse conversion for selection capture. See [phase-3-selection-capture.md](./phase-3-selection-capture.md).
