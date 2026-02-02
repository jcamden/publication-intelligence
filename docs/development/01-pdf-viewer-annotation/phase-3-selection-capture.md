# Phase 3: Selection Capture

**Status:** In Progress  
**Plan Doc:** `~/.cursor/plans/pdf_selection_capture_phase3.plan.md`

## Overview

Implement annotation mode system and capture user text selections to create draft highlights.

## Key Features

- Annotation mode system (view, add-text-highlight, add-region)
- Mode-based layer control (CSS pointer-events toggle)
- Text selection event handlers
- DOM → PDF coordinate conversion
- Draft highlight state with visual styling
- onCreateDraftHighlight callback

## Implementation Status

### ✅ Complete
- Annotation mode type definition
- Mode-based layer control concept

### 🟡 In Progress
- Selection event handlers
- convertDomRectToPdf helper
- convertSelectionToPdfBbox (multi-rect union)
- Draft highlight state
- Keyboard handlers (Escape to cancel)

### ⚪ Todo
- Testing at multiple scales
- Round-trip conversion validation
- Edge case handling

## Technical Details

**Coordinate Conversion (reverse of Phase 2):**
```tsx
// Phase 2: PDF → DOM (rendering)
viewport.convertToViewportRectangle([x1, y1, x2, y2])

// Phase 3: DOM → PDF (capture)
viewport.convertToPdfPoint(x, y)
```

**Mode-Based Layer Interaction:**
```tsx
// Text layer: selectable ONLY in add-text-highlight mode
<div style={{
  pointerEvents: annotationMode === 'add-text-highlight' ? 'auto' : 'none'
}} />

// Highlight layer: clickable ONLY in view mode
<PdfHighlightLayer style={{
  pointerEvents: annotationMode === 'view' ? 'auto' : 'none'
}} />
```

**Draft Highlight Styling:**
- Blue with dashed border (vs yellow solid for persistent)
- metadata: { isDraft: true }

## Testing Requirements

- [ ] Single-line selection works
- [ ] Multi-line selection creates union bbox
- [ ] Coordinates scale-independent (same at 0.75x and 2.0x)
- [ ] Escape key clears draft
- [ ] Round-trip conversion accurate (±1pt tolerance)
- [ ] Mode switching clean (no stale state)

## Next Phase

Phase 4 will add UI for persisting drafts and managing highlights. See [phase-4-highlight-management.md](./phase-4-highlight-management.md) for details.
