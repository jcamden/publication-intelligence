# Phase 3: Selection Capture

**Status:** ✅ Complete (needs Phase 4 refactoring)  
**Completed:** Commit b88f38a (Feb 2, 2026)  
**Plan Doc:** `~/.cursor/plans/pdf_selection_capture_phase3.plan.md`  
**Status Doc:** [PHASE-3-STATUS.md](./PHASE-3-STATUS.md)

## Overview

Enable text selection and region drawing capabilities in PdfViewer. Activated transiently from sidebar buttons (Phase 4), not persistent modes.

## Key Features

- Text layer pointer-events control (enabled only when selecting)
- Region drawing capability (click-drag to draw bbox)
- Text selection event handlers
- DOM → PDF coordinate conversion
- Draft highlight state with visual styling
- onCreateDraftHighlight callback
- Auto-revert to view mode after creation

## Implementation Status

### ✅ Complete (Commit b88f38a)
- Text selection event handlers
- Region drawing interaction (click-drag with live preview)
- convertDomRectToPdf helper
- convertSelectionToPdfBbox (multi-rect union)
- Draft highlight state and visual styling
- Escape key handler (cancel draft)
- Pointer-events control for layers
- VRT and interaction tests

### ⚠️ Needs Refactoring (Phase 4)
- Replace `annotationMode` prop with `textLayerInteractive`/`regionDrawingActive`
- Update pointer-events logic for sidebar-based activation
- Add auto-revert after draft creation

### ⚪ Minor Improvements
- Add scale-independence test (test at 0.75x, 1.0x, 1.5x, 2.0x)
- Add round-trip conversion validation test
- Document region drawing interaction test (currently manual)

## Technical Details

**Coordinate Conversion (reverse of Phase 2):**
```tsx
// Phase 2: PDF → DOM (rendering)
viewport.convertToViewportRectangle([x1, y1, x2, y2])

// Phase 3: DOM → PDF (capture)
viewport.convertToPdfPoint(x, y)
```

**Layer Interaction Control:**
```tsx
// Text layer: selectable when activated from sidebar button
<div style={{
  pointerEvents: textLayerInteractive ? 'auto' : 'none'
}} />

// Highlight layer: clickable by default (view mode)
// Disabled when text selection or region drawing active
<PdfHighlightLayer style={{
  pointerEvents: (!textLayerInteractive && !regionDrawingActive) ? 'auto' : 'none'
}} />
```

**Draft Highlight Styling:**
- Blue with dashed border (vs yellow solid for persistent)
- metadata: { isDraft: true }

## Testing Requirements

- [ ] Text selection works when activated
- [ ] Region drawing works when activated
- [ ] Single-line selection captures correctly
- [ ] Multi-line selection creates union bbox
- [ ] Coordinates scale-independent (same at 0.75x and 2.0x)
- [ ] Escape key clears draft
- [ ] Round-trip conversion accurate (±1pt tolerance)
- [ ] Auto-revert to view mode after draft creation

## Next Phase

Phase 4 will add UI for persisting drafts and managing highlights. See [phase-4-highlight-management.md](./phase-4-highlight-management.md) for details.
