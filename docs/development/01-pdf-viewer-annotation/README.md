# Epic 1: PDF Viewer & Annotation

## Goal

Build interactive PDF viewer with multi-type mentions, context system, and page numbering for professional indexing workflows.

## User Stories

**As an indexer:**
- I want to create mentions for different index types (subject, author, scripture), so I can generate multiple indices from one document
- I want to mark a mention as belonging to multiple index types, so it appears in multiple indices
- I want to define ignore contexts (headers/footers), so they don't interfere with text extraction
- I want to define page number contexts, so the AI can extract canonical page numbers
- I want to override page numbers at project or page level, so I can handle complex pagination (Roman numerals, alphabetic, etc.)

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

### ✅ Phase 3: Selection Capture ([phase-3-selection-capture.md](./phase-3-selection-capture.md))
**Status:** Complete (needs Phase 4 refactoring)  
**Completed:** Commit b88f38a (Feb 2, 2026)  
**Summary:** Text selection and region drawing → draft highlights with coordinate conversion

**Deliverables:**
- Annotation mode system (view, add-text-highlight, add-region)
- Mode-based layer control (CSS pointer-events)
- Selection event handlers
- DOM→PDF coordinate conversion
- Draft highlight state with visual styling
- onCreateDraftHighlight callback

**Current Blockers:** None  
**Next Steps:** Complete implementation, test at multiple scales

### ⚪ Phase 4: Highlight Management ([phase-4-highlight-management/](./phase-4-highlight-management/))
**Status:** Planning  
**Summary:** UI for persisting drafts, managing highlights, linking to IndexEntries

**Sub-phases:**
- [4A: Sidebar Action Buttons](./phase-4-highlight-management/task-4a-sidebar-actions.md)
- [4B: Mention Creation Flow](./phase-4-highlight-management/task-4b-mention-creation.md)
- [4C: Highlight CRUD Operations](./phase-4-highlight-management/task-4c-crud-operations.md)
- [4D: IndexEntry Connection UI](./phase-4-highlight-management/task-4d-entry-connection.md)

**Dependencies:** Phase 3 completion  
**Estimated Duration:** 1 week

### ⚪ Phase 5: Backend Integration ([phase-5-backend-integration.md](./phase-5-backend-integration.md))
**Status:** Not Started  
**Summary:** Persist highlights to database, CRUD API integration

**Deliverables:**
- IndexMention Gel schema (with multi-type support)
- IndexEntry Gel schema (typed)
- Context Gel schema
- tRPC CRUD endpoints
- Application adapter (IndexMention ↔ PdfHighlight)
- Optimistic updates
- Error handling

**Dependencies:** Phase 4 completion  
**Estimated Duration:** 3-4 days

### ⚪ Phase 6: Context System ([phase-6-context-system.md](./phase-6-context-system.md))
**Status:** Not Started  
**Summary:** Draw regions for ignore/page-number contexts, apply to pages

**Deliverables:**
- Draw region mode (rectangle drawing)
- Context creation UI (type, page config)
- Context management (project sidebar)
- Page-level context display (page sidebar)
- Apply to pages configuration (this-page, all-pages, range, custom, every-other)
- Context visibility toggles

**Dependencies:** Phase 4 completion  
**Estimated Duration:** 4-5 days

### ⚪ Phase 7: Page Numbering System ([phase-7-page-numbering.md](./phase-7-page-numbering.md))
**Status:** Not Started  
**Summary:** Multi-layer page numbering with context extraction and overrides

**Deliverables:**
- Document page display
- Context-derived page extraction and display
- Project-level override UI (editable string)
- Page-level override UI (single-page)
- Final page number computation
- Validation (count, sequence, format)
- Color-coded display per layer

**Dependencies:** Phase 6 completion  
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
- ✅ User can select text and draw regions
- ✅ User can create mentions for different index types
- ✅ User can mark mentions as multiple types (diagonal stripes)
- ✅ User can create ignore contexts (exclude from extraction)
- ✅ User can create page number contexts (auto-extract page numbers)
- ✅ User can configure contexts to apply to multiple pages
- ✅ Page numbering system works (4 layers with overrides)
- ✅ Mentions and contexts persist to database
- ✅ Highlights render correctly at all zoom levels
- ✅ User can edit/delete mentions and contexts
- ✅ Round-trip coordinate conversion is accurate (±1pt)

## Dependencies

**Required:**
- Infrastructure: Auth, Projects (✅ Complete)
- Infrastructure: Document upload (🟡 In Progress)

**Enables:**
- Concept Detection: Needs highlight data for training
- Index Editor: Needs highlight linking for mentions
