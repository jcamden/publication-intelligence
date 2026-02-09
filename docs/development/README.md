# MVP Development Roadmap

## Vision

Build an AI-assisted PDF indexing tool that helps professional indexers create high-quality indices 2-5× faster than manual indexing.

## MVP Scope

**Core Workflow:**
1. Upload PDF manuscript
2. Configure project (index types, colors, page numbering)
3. Set up contexts (ignore regions, page number extraction)
4. AI generates candidate index entries per type
5. User reviews/edits entries interactively
6. User links entries to PDF text via highlights (can index as multiple types)
7. Export formatted indices (separate per type)

## Epics & Status

### 1. [PDF Viewer & Annotation](./01-pdf-viewer-annotation/) 🟡 In Progress
Interactive PDF viewer with multi-type mentions, contexts, and page numbering system.

**Status:** Phase 3 complete, Phase 4 next  
**Completed:** Phase 1 (Text Layer), Phase 2 (Rendering), Phase 3 (Selection Capture)  
**Priority:** P0 (Critical path)

### 2. [Concept Detection & Indexing](./02-concept-detection/) ⚪ Not Started
AI-powered concept extraction and index entry generation per index type, respecting ignore contexts.

**Status:** Waiting on PDF viewer completion  
**Priority:** P0 (Critical path)

### 3. [Index Editor](./03-index-editor/) ⚪ Not Started
Tree-based editor with tabs per index type, managing entries, hierarchy, and cross-references.

**Status:** Waiting on concept detection  
**Priority:** P0 (Critical path)

### 4. [Export & Publishing](./04-export-publishing/) ⚪ Not Started
Format and export each index type separately in HTML (MVP) or Word/LaTeX (post-MVP).

**Status:** Can start in parallel with editor work  
**Priority:** P1 (Required for MVP)

### 5. [Infrastructure](./05-infrastructure/) 🟢 Partially Complete
Core services: auth, projects, document storage, database schema.

**Status:** Auth & projects done, document storage in progress  
**Priority:** P0 (Foundational)

## Current Sprint

**Focus:** Epic 1 - PDF Viewer & Annotation  
**Completed:**
- ✅ Phase 3: Selection Capture (commit b88f38a)

**Next Up:**
- Phase 4: Highlight Management UI (sidebar actions + multi-type system)

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
- ✅ User can configure index types and colors
- ✅ User can set up contexts (ignore, page numbers)
- ✅ AI generates candidate entries per index type
- ✅ User can review entries in tree view (tabs per type)
- ✅ User can link entries to PDF text via highlights
- ✅ User can index mentions as multiple types
- ✅ User can edit/merge/delete entries
- ✅ User can export formatted indices (HTML copy/paste)
- ✅ Page numbering system works (context → project → page overrides)
- ✅ 3 real indexers complete a book with the tool

## Out of Scope (Post-MVP)

- Multi-user collaboration (workspaces, collaborators)
- Cross-document indexing
- OCR for scanned PDFs
- Mobile/tablet support
- Advanced knowledge graphs
- Real-time auto-suggestions
- Multi-language support
