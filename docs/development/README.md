# MVP Development Roadmap

## Vision

Build an AI-assisted PDF indexing tool that helps professional indexers create high-quality indices 2-5× faster than manual indexing.

## MVP Scope

**Core Workflow:**
1. Upload PDF manuscript
2. AI generates candidate index entries
3. User reviews/edits entries interactively
4. User links entries to PDF text via highlights
5. Export formatted index

## Epics & Status

### 1. [PDF Viewer & Annotation](./01-pdf-viewer-annotation/) 🟡 In Progress
Interactive PDF viewer with text selection and highlighting for linking index entries to source text.

**Status:** Phase 3/5 in progress  
**Priority:** P0 (Critical path)

### 2. [Concept Detection & Indexing](./02-concept-detection/) ⚪ Not Started
AI-powered concept extraction and index entry generation from PDF text.

**Status:** Waiting on PDF viewer completion  
**Priority:** P0 (Critical path)

### 3. [Index Editor](./03-index-editor/) ⚪ Not Started
Tree-based editor for managing index entries, hierarchy, and cross-references.

**Status:** Waiting on concept detection  
**Priority:** P0 (Critical path)

### 4. [Export & Publishing](./04-export-publishing/) ⚪ Not Started
Format and export index in multiple formats (Word, LaTeX, plain text).

**Status:** Can start in parallel with editor work  
**Priority:** P1 (Required for MVP)

### 5. [Infrastructure](./05-infrastructure/) 🟢 Partially Complete
Core services: auth, projects, document storage, database schema.

**Status:** Auth & projects done, document storage in progress  
**Priority:** P0 (Foundational)

## Current Sprint

**Focus:** Epic 1 - PDF Viewer & Annotation  
**Active Tasks:**
- Phase 3: Selection Capture (implementing)
- Phase 4: Highlight Management UI (planning)

## Next 2 Weeks

1. Complete Phase 3: Selection Capture
2. Complete Phase 4: Highlight Management UI
3. Start Phase 5: Backend Integration (IndexMention CRUD)
4. Begin Epic 2 planning: Concept Detection

## Epic Dependencies

```
Infrastructure (5) ─┬─> PDF Viewer (1) ──> Concept Detection (2) ──> Index Editor (3) ──> Export (4)
                    │                                                        │
                    └────────────────────────────────────────────────────────┘
```

**Critical Path:** Infrastructure → PDF Viewer → Concept Detection → Index Editor → Export

**Parallel Work:**
- Export formatting engine can be built alongside Index Editor
- Backend APIs can be built as frontend needs them

## Success Criteria

MVP is complete when:
- ✅ User can upload PDF
- ✅ AI generates candidate index entries
- ✅ User can review entries in tree view
- ✅ User can link entries to PDF text via highlights
- ✅ User can edit/merge/delete entries
- ✅ User can export formatted index
- ✅ 3 real indexers complete a book with the tool

## Out of Scope (Post-MVP)

- Multi-user collaboration
- Cross-document indexing
- OCR for scanned PDFs
- Mobile/tablet support
- Advanced knowledge graphs
- Real-time auto-suggestions
- Multi-language support
