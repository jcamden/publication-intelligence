# Component Architecture

## PDF Viewer Stack

**Location:** `packages/yaboujee`

**Components:**
- `PdfViewer` - PDF.js renderer + interaction surface
- `PdfViewerToolbar` - Pagination + zoom
- `PdfHighlightLayer` - Overlay for highlights
- `PdfHighlightBox` - Individual highlight box

**Types:** `packages/yaboujee/src/types/pdf-highlight.ts`

## Annotation Modes

- `view`: highlight clicks enabled, text selection disabled
- `add-text-highlight`: text selection enabled
- `add-region`: drag-to-draw region selection

## Coordinate Systems

**Backend (PyMuPDF):** Bottom-left origin, PDF user space, points  
**Frontend (PDF.js):** Top-left origin, DOM viewport, pixels

**Conversions:**
- `convertBboxToViewport` (PDF → DOM)
- `convertDomRectToPdf` (DOM → PDF)
- `convertSelectionToPdfBbox` (multi-rect → single bbox)

**Storage:** Store highlights in PDF user space (DB-friendly), convert to DOM only at render.

## MVP Assumptions

- Single bbox per highlight
- Page rotation = 0
- Rectangular highlights only