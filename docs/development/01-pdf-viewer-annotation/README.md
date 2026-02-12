# Epic 1: PDF Viewer & Annotation

## Goal

Build interactive PDF viewer with multi-type mentions, region system, and page numbering for professional indexing workflows.

## User Stories

**As an indexer:**
- I want to create mentions for different index types (subject, author, scripture), so I can generate multiple indices from one document
- I want to mark a mention as belonging to multiple index types, so it appears in multiple indices
- I want to define exclude regions (headers/footers), so they don't interfere with text extraction
- I want to define page number regions, so the AI can extract canonical page numbers
- I want to override page numbers at project or page level, so I can handle complex pagination (Roman numerals, alphabetic, etc.)

## Phases

### ✅ Phase 1: Text Layer ([phase-1-text-layer/](./phase-1-text-layer/))
**Status:** Complete  
**Summary:** Implemented selectable text layer using PDF.js TextLayer API

**Deliverables:**
- Selectable text overlay on PDF canvas
- Viewport ref for coordinate conversions
- Page container ref for bounds checking

### ✅ Phase 2: Highlight Rendering ([phase-2-highlight-rendering/](./phase-2-highlight-rendering/))
**Status:** Complete  
**Summary:** Integrated PdfHighlightLayer with PDF→DOM coordinate conversion

**Deliverables:**
- Coordinate conversion (PDF user space → DOM pixels)
- Highlight rendering at all zoom levels
- Per-page filtering and viewport-based conversion
- Click handlers for highlight interactions

### ✅ Phase 3: Selection Capture ([phase-3-selection-capture/](./phase-3-selection-capture/))
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

### ✅ Phase 4: Highlight Management ([phase-4-highlight-management/](./phase-4-highlight-management/))
**Status:** Complete (Feb 3, 2026)  
**Summary:** UI for persisting drafts, managing highlights, linking to IndexEntries

**Sub-phases:**
- ✅ [4A: Sidebar Action Buttons](./phase-4-highlight-management/task-4a-sidebar-actions.md) - Complete
- ✅ [4B: Mention Creation Flow](./phase-4-highlight-management/task-4b-mention-creation.md) - Complete
- ✅ [4C: Highlight CRUD Operations](./phase-4-highlight-management/task-4c-crud-operations.md) - Complete
- ✅ [4D: IndexEntry Connection UI](./phase-4-highlight-management/task-4d-entry-connection.md) - Complete (optional 4D-7 deferred)

**Deliverables:**
- Sidebar action buttons (per index type)
- Mention creation popover with entry picker
- Entry creation modal with hierarchy
- Smart autocomplete (exact-match detection)
- Multi-type mentions with diagonal stripes
- Configurable index type colors
- Entry trees in project sidebar
- View/Edit mode for mentions
- Sidebar navigation to highlights

**Dependencies:** Phase 3 completion  
**Actual Duration:** ~2 weeks

### ✅ Phase 5: Backend Integration ([phase-5-backend-integration/](./phase-5-backend-integration/))
**Status:** Complete  
**Completed:** February 2026  
**Summary:** Database persistence, tRPC CRUD integration, optimistic updates

**Sub-Tasks:**
- ✅ [5A: Schema Migration & IndexType Backend](./phase-5-backend-integration/task-5a-schema-migration.md) - Complete
- ✅ [5B: IndexEntry Backend](./phase-5-backend-integration/task-5b-index-entry-backend.md) - Complete
- ✅ [5C: IndexMention Backend](./phase-5-backend-integration/task-5c-index-mention-backend.md) - Complete
- ✅ [5D: Frontend Integration & Polish](./phase-5-backend-integration/task-5d-optimistic-updates.md) - Complete (4 sub-tasks)

**Key Deliverables:**
- ✅ Database migration (EdgeDB → Drizzle + PostgreSQL)
- ✅ Index type enum + addon access model
- ✅ IndexEntry, IndexMention schemas with multi-type support
- ✅ Region schema ready for Phase 6
- ✅ tRPC CRUD endpoints with RLS policies
- ✅ Optimistic updates (instant perceived latency)
- ✅ Error handling with rollback
- ✅ Loading states and error boundaries
- ✅ 172/172 interaction tests passing

**Dependencies:** Phase 4 completion ✅  
**Actual Duration:** 7-10 days

### ⚪ Phase 6: Region System ([phase-6-region-system/](./phase-6-region-system/))
**Status:** Not Started  
**Summary:** Draw regions for ignore/page-number regions, apply to pages

**Deliverables:**
- Draw region mode (rectangle drawing)
- Region creation UI (type, page config)
- Region management (project sidebar)
- Page-level context display (page sidebar)
- Apply to pages configuration (this-page, all-pages, range, custom, every-other)
- Context visibility toggles

**Dependencies:** Phase 4 completion  
**Estimated Duration:** 4-5 days

### ⚪ Phase 7: Page Numbering System ([phase-7-page-numbering/](./phase-7-page-numbering/))
**Status:** Not Started  
**Summary:** Multi-layer page numbering with context extraction and overrides

**Deliverables:**
- Document page display
- Region-derived page extraction and display
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

### Frontend Patterns (Established in Phase 4B)

**Two-Component Popover Architecture:**
- Generic: `PdfAnnotationPopover` (yaboujee) handles positioning, bounds checking, escape key
- Specific: Content components (e.g., `MentionCreationPopover`) are pure content, no positioning logic
- Integration: Render props pattern with `PdfViewer.renderDraftPopover`

**Standardized Form Components:**
- `FormInput` (yaboujee) integrates TanStack Form with yabasic Field components
- Automatic validation state handling (`data-invalid`, `aria-invalid`)
- Supports `hideLabel` prop for accessible hidden labels
- All forms use TanStack Form for state management

**PdfViewer Integration:**
- Draft state managed internally by `PdfViewer`
- Callbacks: `onDraftConfirmed({ draft, entry })`, `onDraftCancelled()`
- Render props for custom popover content
- No external draft state or popover visibility state needed

## Success Criteria

Epic 1 complete when:
- ✅ User can select text and draw regions
- ✅ User can create mentions for different index types
- ✅ User can mark mentions as multiple types (diagonal stripes)
- ⚪ User can create exclude regions (exclude from extraction)
- ⚪ User can create page number regions (auto-extract page numbers)
- ⚪ User can configure contexts to apply to multiple pages
- ⚪ Page numbering system works (4 layers with overrides)
- ✅ Mentions persist to database with optimistic updates
- ✅ Entries persist to database with hierarchy support
- ✅ Highlights render correctly at all zoom levels
- ✅ User can edit/delete mentions and entries
- ✅ Round-trip coordinate conversion is accurate (±1pt)

## Dependencies

**Required:**
- Infrastructure: Auth, Projects (✅ Complete)
- Infrastructure: Document upload (🟡 In Progress)

**Enables:**
- Concept Detection: Needs highlight data for training
- Index Editor: Needs highlight linking for mentions
