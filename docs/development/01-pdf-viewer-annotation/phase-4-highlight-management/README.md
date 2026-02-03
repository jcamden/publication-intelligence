# Phase 4: Highlight Management UI

**Status:** ⚪ Not Started  
**Dependencies:** Phase 3 completion  
**Duration:** 1 week (6-8 days)

## Overview

Transform draft highlights into persistent, manageable mentions linked to IndexEntries. Support multi-type indexing (subject, author, scripture, etc.) with visual distinction (diagonal stripes for multi-type mentions).

## Sub-Phases

### [4A: Sidebar Action Buttons](./task-4a-sidebar-actions.md)
**Duration:** 1 day  
**Status:** ✅ Complete

"Select Text" and "Draw Region" buttons in page sidebar sections (per index type). Transient activation (one action, then auto-revert).

### [4B: Mention Creation Flow](./task-4b-mention-creation.md)
**Duration:** 2-3 days  
**Status:** ✅ Complete

Draft → persistent flow with popover UI and autocomplete.

### [4C: Highlight CRUD Operations](./task-4c-crud-operations.md)
**Duration:** 1-2 days  
**Status:** 🟡 Mostly Complete

View, edit, and delete highlights with confirmation dialogs. Index type tracking implemented. Sidebar navigation pending (click mention in sidebar → scroll to highlight and show popover).

### [4D: IndexEntry Connection UI](./task-4d-entry-connection.md)
**Duration:** 2 days  
**Status:** ⚪ Not Started

Entry creation modal, picker with hierarchy, and color-coded highlights.

## Completion Criteria

Phase 4 complete when:
- [x] Page sidebar sections per index type (created dynamically)
- [x] "Select Text" and "Draw Region" buttons per section
- [x] Transient activation (one action, auto-revert to view mode)
- [x] Escape key cancels active action
- [x] Mention creation popover functional
- [x] Draft → persistent transition works
- [x] Entry picker with hierarchy works
- [x] All stored in React state (no backend yet)
- [x] Highlight CRUD operations work (view, edit, delete)
- [x] Index type captured when creating mentions
- [x] Sidebar sections filter mentions by index type
- [ ] "Index As" checklist for multi-type mentions (optional enhancement, see task-4c-multi-type-enhancement.md)
- [ ] Multi-type visual (diagonal stripes with multiple colors) (optional enhancement)
- [ ] IndexEntry creation UI implemented (Task 4D)

## State Management (Phase 4)

**Local state only** - no backend calls:

```tsx
// In editor.tsx
const [mentions, setMentions] = useState<Mention[]>([]);
const [indexEntries, setIndexEntries] = useState<IndexEntry[]>([]);
const [draftMention, setDraftMention] = useState<MentionDraft | null>(null);

// Project-level index type configuration
const [projectIndexTypes, setProjectIndexTypes] = useState<IndexType[]>([
  { id: 'subject', name: 'Subject', color: '#FCD34D', ordinal: 0, visible: true },
  { id: 'author', name: 'Author', color: '#86EFAC', ordinal: 1, visible: true },
  { id: 'scripture', name: 'Scripture', color: '#93C5FD', ordinal: 2, visible: true },
]);

// Mention now has indexTypes array (captured from sidebar section)
type Mention = {
  id: string;
  pageNumber: number;
  text: string;
  bbox: BoundingBox;
  entryId: string;
  entryLabel: string;
  indexTypes: string[]; // ['subject', 'author'] - captured from activeAction.indexType
  createdAt: Date;
};
```

**Phase 5** replaces this with tRPC queries/mutations.

## Technical Notes

### Coordinate Persistence

Store bboxes in PDF user space (PyMuPDF coordinates), not DOM pixels:

```tsx
// ✅ CORRECT
const mention: Mention = {
  bbox: draftBbox, // Already in PDF user space from Phase 3
};

// ❌ WRONG
const mention: Mention = {
  bbox: convertedDomBbox, // Will break on scale change
};
```

### Performance Considerations

- Lazy load mentions (per-page or viewport)
- Debounce autocomplete search (300ms)
- Virtualize entry picker if > 100 entries
- Memoize color generation

### Accessibility

- [ ] Keyboard navigation in all popovers
- [ ] Screen reader labels for action buttons ("Select Text", "Draw Region")
- [ ] Focus management (trap focus in modals)
- [ ] ARIA labels for active state indicators
- [ ] Keyboard shortcuts (Escape to cancel)

## Next Phase

[Phase 5: Backend Integration](../phase-5-backend-integration.md) adds:
- IndexMention Gel schema
- IndexEntry Gel schema
- tRPC CRUD endpoints
- Optimistic updates
- Error handling
