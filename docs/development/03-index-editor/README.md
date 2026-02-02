# Epic 3: Index Editor

## Goal

Provide tree-based UI for managing index entries, hierarchy, and cross-references.

## User Story

As an indexer, I want to organize entries into a hierarchical structure with cross-references, so I can build a professional index that matches publishing standards.

## Dependencies

- Epic 2: Concept Detection (generates initial entries)
- Epic 1: Phase 4+ (for mention linking)

## Tasks

### Task 1: Tree View ([task-1-tree-view.md](./task-1-tree-view.md))
**Status:** Not Started  
**Duration:** 3-4 days

Hierarchical tree view for browsing/organizing entries.

**Deliverables:**
- Collapsible tree component
- Drag-and-drop for reorganization
- Keyboard navigation (arrow keys, enter)
- Search/filter

### Task 2: Entry CRUD ([task-2-entry-crud.md](./task-2-entry-crud.md))
**Status:** Not Started  
**Duration:** 2 days

Create, edit, delete entries with validation.

**Deliverables:**
- Entry creation form
- Inline editing
- Delete with confirmation
- Undo/redo stack

### Task 3: Hierarchy Management ([task-3-hierarchy-management.md](./task-3-hierarchy-management.md))
**Status:** Not Started  
**Duration:** 2-3 days

Parent/child relationships and cross-references.

**Deliverables:**
- Set parent entry
- Move entry to new parent (drag-and-drop)
- See also / cross-reference links
- Circular reference prevention

### Task 4: Search & Filter ([task-4-search-filter.md](./task-4-search-filter.md))
**Status:** Not Started  
**Duration:** 1-2 days

Find entries by label, mentions, or metadata.

**Deliverables:**
- Full-text search
- Filter by: has mentions, no mentions, orphaned
- Sort by: alpha, mention count, recently modified
- Jump to entry from PDF highlight

## Success Criteria

- ✅ User can browse entries in tree view
- ✅ Drag-and-drop reorganization works
- ✅ Entry CRUD operations functional
- ✅ Parent/child relationships maintained
- ✅ Search finds entries quickly (< 100ms)
- ✅ Cross-references linkable

## Technical Notes

- Use react-arborist or similar for tree view
- State management: Jotai or Zustand for complex tree
- Optimistic updates for smooth UX
- Keyboard shortcuts critical for pro users
