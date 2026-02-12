# Phase 4: Highlight Management UI

**Status:** ✅ Complete  
**Dependencies:** Phase 3 completion  
**Actual Duration:** ~2 weeks (completed Feb 3, 2026)

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
**Status:** ✅ Complete

View, edit, and delete highlights with confirmation dialogs. Index type tracking implemented. Sidebar navigation complete (click mention in sidebar → scroll to highlight and show popover). View/Edit mode UX implemented with state preservation and explicit save/cancel actions.

### [4D: IndexEntry Connection UI](./task-4d-entry-connection.md)
**Duration:** 2 days  
**Status:** ✅ Complete (Feb 3, 2026)

Entry creation modal, picker with hierarchy, and color-coded highlights. All 6 core subtasks complete. Optional Task 4D-7 (migrate PDF popover to shadcn) deferred.

## Completion Criteria

Phase 4 complete when:
- [x] Page sidebar sections per index type (created dynamically)
- [x] "Select Text" and "Draw Region" buttons per section
- [x] Transient activation (one action, auto-revert to view mode)
- [x] Toggle functionality (click again to deactivate mode)
- [x] Escape key cancels active action
- [x] Mention creation popover functional
- [x] Draft → persistent transition works
- [x] Entry picker with hierarchy works
- [x] All stored in React state (no backend yet)
- [x] Highlight CRUD operations work (view, edit, delete)
- [x] View/Edit mode UX with explicit save/cancel
- [x] State preservation during edit mode
- [x] Index type captured when creating mentions
- [x] Sidebar sections filter mentions by index type
- [x] Click mention in sidebar → scroll to highlight and show popover
- [x] Auto-focus and click-outside behavior for popovers
- [x] Mention type field (text vs region) with conditional editing
- [x] Region text editable, text mention text read-only
- [x] Standardized button styling (StyledButton component)
- [x] Tooltips on icon-only buttons
- [x] Index type background colors for visual distinction
- [x] Component abstractions (MentionButton, PageSectionContent)
- [x] "Index As" checklist for multi-type mentions (implemented in Task 4C)
- [x] Multi-type visual (diagonal stripes with multiple colors) (implemented in Task 4C)
- [x] IndexEntry creation UI implemented (completed Task 4D)
- [x] Entry picker with hierarchy and search (Task 4D)
- [x] Smart autocomplete with exact-match detection (Task 4D)
- [x] Configurable index type colors (Task 4D)
- [x] Entry trees in project sidebar (Task 4D)

## Optional Enhancements

### [Task 4E: Migrate PDF Popover to shadcn](./task-4e-migrate-pdf-popover.md)
**Status:** ✅ Complete (Already using Base UI)

Upon review, this task was already complete. The `PdfAnnotationPopover` already uses `@base-ui/react/popover` directly, which is the same primitive that shadcn's Popover uses. The component provides a clean wrapper with PDF-specific defaults while using the standard Base UI primitives.

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

// Mention now has indexTypes array and type field
type Mention = {
  id: string;
  pageNumber: number;
  text: string;
  bbox: BoundingBox;
  entryId: string;
  entryLabel: string;
  type: 'text' | 'region'; // Differentiates text selections from region mentions
  indexTypes: string[]; // ['subject', 'author'] - captured from activeAction.indexType
  createdAt: Date;
};
```

**Phase 5** replaces this with tRPC queries/mutations.

## Key Features Implemented

### Mention Details Popover

**View/Edit Modes:**
- Default View mode displays read-only mention details (text, entry, index types, page)
- Edit button enters Edit mode with full editing capabilities
- Cancel button reverts all changes and returns to View mode
- Save button persists changes and returns to View mode
- Close button in View mode dismisses without changes
- Delete button in Edit mode for mention removal

**Smart Editing:**
- Text mentions: Extracted text is read-only (immutable PDF source)
- Region mentions: User can edit description text via Input field
- Entry selection via Combobox with search/autocomplete
- Index type multi-select for categorization
- Form state preserved when entering Edit mode

**Focus & Interaction:**
- Auto-focuses when opened
- Click-outside to close (handles portaled Select dropdowns)
- Escape key to close
- Role="dialog" for accessibility

### Sidebar Navigation

**Mention Lists:**
- Each index type section (Subject, Author, Scripture, Regions) displays filtered mentions
- Click mention button → scrolls highlight into view (smooth scroll, centered)
- Shows mention details popover anchored to highlight
- Mention buttons styled differently for text vs region mentions:
  - Text: Italic with quotes (`"text"`)
  - Region: "Region:" prefix (`Region: description`)

**Action Buttons:**
- "Select Text" and "Draw Region" buttons in accordion headers
- Toggle functionality (click again to deactivate)
- Visual active state with sophisticated ring/shadow effects
- Icon-only buttons with tooltips
- Standardized styling via `StyledButton` component

### Visual Design

**Index Type Colors:**
- Subject: Yellow background (`bg-yellow-50/50` light, `bg-yellow-600/20` dark)
- Author: Blue background (`bg-blue-50/50` light, `bg-blue-800/20` dark)
- Scripture: Green background (`bg-green-50/50` light, `bg-green-800/20` dark)
- Applied to both page and project sidebar sections

**Button Standardization:**
- All header buttons use consistent `StyledButton` component
- Icon-based with tooltip labels
- Active/inactive states with visual feedback
- Proper spacing and sizing (no overlap)

**Accordion Improvements:**
- Chevron button shows active state when expanded
- Drag handle, chevron, and action buttons properly laid out
- Title truncates gracefully for long labels
- Consistent gap spacing (`gap-2`) between buttons

### Component Architecture

**Abstractions Created:**
- `PageSectionContent`: Base component for all page sidebar content sections
- `MentionButton`: Reusable mention list item with type-aware styling
- `StyledButton`: Icon button with tooltips and sophisticated styling
- Eliminated code duplication across 4 content components

**Section Organization:**
- Removed Bibliography sections (project and page)
- Added "Page" section to page sidebar (analog to "Project Pages")
- Updated default orders for logical flow
- Page sidebar reverses order for visual symmetry

### Database Schema

**Mention Type Field:**
- Added `MentionType` enum in Gel schema (`text`, `region`)
- `mention_type` field with default value (`text`)
- Backward compatible (existing mentions auto-default to text)
- Enables future filtering, validation, and analytics

## Design Decisions

### View Mode by Default
- Reduces cognitive load - users see clean summary first
- Prevents accidental edits
- Follows common UI pattern (Gmail, GitHub, etc.)

### Explicit Save Button
- User has clear control over when changes are committed
- Can explore different values without auto-saving
- Cancel button provides safe experimentation

### Region Text Editable, Text Type Read-Only
- Text mentions are extracted from PDF - immutable source
- Region mentions have user-provided descriptions - can be improved
- Preserves data integrity of PDF extractions

### Click-Outside vs onBlur
- More reliable than focus management with portals
- Handles Select dropdowns that render outside DOM tree
- Better matches user expectations for popover behavior

### Delete Button in Edit Mode
- Separates destructive action from view-only actions
- Reduces accidental deletes
- Groups editing actions together

### Toggle Functionality for Action Buttons
- Better UX - users can easily turn off modes
- No need for separate "cancel" action
- Intuitive toggle behavior

### Sidebar Navigation with Scroll
- Automatically brings highlights into view when clicked from sidebar
- Smooth scroll animation (`behavior: "smooth"`, `block: "center"`)
- Ensures users don't have to manually scroll to find highlights

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

- [x] Keyboard shortcuts (Escape to cancel active actions and close popovers)
- [x] Focus management (auto-focus on popover open)
- [x] Role="dialog" for popovers
- [x] Tooltip labels for icon-only buttons ("Select Text", "Draw Region", etc.)
- [ ] Full keyboard navigation in all popovers (partial - tab navigation works)
- [ ] Screen reader labels for active state indicators
- [ ] Focus trap in modals (not yet implemented)

## Changes Summary

### New Components Created

1. **`MentionButton`** - Reusable mention list item button with type-aware styling
   - `apps/index-pdf-frontend/src/app/projects/[projectDir]/editor/_components/page-sidebar/components/mention-button.tsx`

2. **`PageSectionContent`** - Base component for page sidebar content sections
   - `apps/index-pdf-frontend/src/app/projects/[projectDir]/editor/_components/page-sidebar/components/page-section-content/page-section-content.tsx`

3. **`StyledButton`** - Icon button with tooltips and sophisticated styling
   - `packages/yaboujee/src/components/styled-button/styled-button.tsx`

4. **`PagePagesContent`** - Page-level content section (analog to Project Pages)
   - `apps/index-pdf-frontend/src/app/projects/[projectDir]/editor/_components/page-sidebar/components/page-pages-content/page-pages-content.tsx`

5. **`Tooltip`** - Base UI tooltip primitive (via shadcn CLI)
   - `packages/yabasic/src/components/ui/tooltip.tsx`

### Major Component Updates

1. **`MentionDetailsPopover`** - View/Edit mode implementation with state preservation
2. **`PdfAnnotationPopover`** - Auto-focus and click-outside behavior
3. **`Editor`** - Sidebar navigation, scroll behavior, toggle actions, entry/text updates
4. **`SidebarAccordionItem`** - Action buttons in header, chevron standardization, background colors
5. **`DraggableSidebar`** - Accordion toggle state management
6. **`PageSidebar`** - Action buttons integration, section reorganization
7. **Page content components** - Refactored to use `PageSectionContent` abstraction

### Database Schema Changes

- Added `MentionType` enum (`text`, `region`) in `db/gel/dbschema/indexing.gel`
- Added `mention_type` field to `IndexMention` type with default value
- Migration ready but not yet run (pending Phase 5 backend integration)

### Test Coverage

**Documentation Stories:**
- Default mention display
- Short/long text handling
- Region mention display
- Index type selection

**Interaction Tests:**
- View mode verification
- Enter/exit edit mode
- Cancel with state reversion
- Save changes
- Edit region text
- Text type read-only
- Close button behavior
- Delete in edit mode
- Entry selection via Combobox
- Index type multi-select

**Visual Regression Tests:**
- Component states (hover, focus, disabled) with pseudo-states
- Proper viewport selection for disk space optimization

### Files Modified Count

- **New files:** 10+ (components, tests, types)
- **Modified files:** 30+ (core functionality, types, tests, sidebar components)
- **Test files updated:** 10+ (stories, interaction tests, VRT)

See `changed-in-this-task.md` for complete file-by-file change log.

## Next Phase

[Phase 5: Backend Integration](../phase-5-backend-integration/) adds:
- [Task 5A](../phase-5-backend-integration/task-5a-schema-migration.md): Schema migration + IndexType backend
- [Task 5B](../phase-5-backend-integration/task-5b-index-entry-backend.md): IndexEntry CRUD with hierarchy
- [Task 5C](../phase-5-backend-integration/task-5c-index-mention-backend.md): IndexMention CRUD with multi-type support
- [Task 5D](../phase-5-backend-integration/task-5d-optimistic-updates.md): Optimistic updates + error handling

See [Phase 5 Overview](../phase-5-backend-integration/README.md) for full details.
