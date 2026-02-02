# Epic 1: PDF Viewer & Annotation

## Goal

Build interactive PDF viewer with text selection and highlighting capabilities for linking index entries to source text.

## User Story

As an indexer, I want to select text in the PDF and attach it to index entries, so I can create precise, verifiable index mentions that link back to the source document.

## Phases

### ✅ Phase 1: Text Layer ([phase-1-text-layer.md](./phase-1-text-layer.md))
**Status:** Complete  
**Summary:** Implemented selectable text layer using PDF.js TextLayer API

**Deliverables:**
- Selectable text overlay on PDF canvas
- Viewport ref for coordinate conversions
- Page container ref for bounds checking

### ✅ Phase 2: Highlight Rendering ([phase-2-highlight-rendering.md](./phase-2-highlight-rendering.md))
**Status:** Complete  
**Summary:** Integrated PdfHighlightLayer with PDF→DOM coordinate conversion

**Deliverables:**
- Coordinate conversion (PDF user space → DOM pixels)
- Highlight rendering at all zoom levels
- Per-page filtering and viewport-based conversion
- Click handlers for highlight interactions

### 🟡 Phase 3: Selection Capture ([phase-3-selection-capture.md](./phase-3-selection-capture.md))
**Status:** In Progress  
**Summary:** Annotation mode system + text selection → draft highlights

**Deliverables:**
- Annotation mode system (view, add-text-highlight, add-region)
- Mode-based layer control (CSS pointer-events)
- Selection event handlers
- DOM→PDF coordinate conversion
- Draft highlight state with visual styling
- onCreateDraftHighlight callback

**Current Blockers:** None  
**Next Steps:** Complete implementation, test at multiple scales

### ⚪ Phase 4: Highlight Management ([phase-4-highlight-management.md](./phase-4-highlight-management.md))
**Status:** Planning  
**Summary:** UI for persisting drafts, managing highlights, linking to IndexEntries

**Sub-phases:**
- 4A: Toolbar UI + Mode Indicators
- 4B: Mention Creation Flow (draft → persistent)
- 4C: Highlight CRUD Operations
- 4D: IndexEntry Connection UI

**Dependencies:** Phase 3 completion  
**Estimated Duration:** 1 week

### ⚪ Phase 5: Backend Integration ([phase-5-backend-integration.md](./phase-5-backend-integration.md))
**Status:** Not Started  
**Summary:** Persist highlights to database, CRUD API integration

**Deliverables:**
- IndexMention Gel schema
- tRPC CRUD endpoints
- Application adapter (IndexMention ↔ PdfHighlight)
- Optimistic updates
- Error handling

**Dependencies:** Phase 4 completion  
**Estimated Duration:** 3-4 days

## Technical Architecture

### Coordinate System
- **Storage:** PyMuPDF bboxes (PDF user space, bottom-left origin, points)
- **Display:** PDF.js viewport (DOM pixels, top-left origin)
- **Conversion:** viewport.convertToViewportRectangle() / convertToPdfPoint()

### Layer Stack (z-index order)
1. Canvas (PDF rendering)
2. Highlight layer (interactive rectangles)
3. Text layer (selectable text)

### Component Boundaries
- **yaboujee:** Generic PDF viewer components (domain-agnostic)
- **app:** Domain-specific adapters (IndexMention ↔ PdfHighlight)

## Success Criteria

Epic 1 complete when:
- ✅ User can select text and create draft highlights
- ✅ User can attach highlights to IndexEntries
- ✅ Highlights persist to database
- ✅ Highlights render correctly at all zoom levels
- ✅ User can edit/delete highlights
- ✅ Round-trip coordinate conversion is accurate (±1pt)

## Dependencies

**Required:**
- Infrastructure: Auth, Projects (✅ Complete)
- Infrastructure: Document upload (🟡 In Progress)

**Enables:**
- Concept Detection: Needs highlight data for training
- Index Editor: Needs highlight linking for mentions
