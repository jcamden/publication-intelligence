# Task 4B: Mention Creation Flow

**Duration:** 2-3 days  
**Status:** ✅ Complete  
**Completed:** 2026-02-02  
**Dependencies:** Task 4A completion

## Problem Statement

Currently `onCreateDraftHighlight` fires with draft data, but there's no UI to:
1. Attach the highlight to an IndexEntry
2. Persist it to the database
3. Transform draft → persistent highlight

## Requirements

### Mention Creation Popover
- [x] Appears immediately after text selection (near selection)
- [x] Small, focused UI (not full modal)
- [x] Supports both text selection and region drawing
- [ ] "Advanced" option (deferred)

### Quick Create Path
- [x] Input: Entry label (autocomplete from existing entries)
- [x] Button: "Create & Attach" (or "Attach" if existing)
- [x] Keyboard: `Enter` to confirm, `Escape` to cancel
- [x] Auto-returns to view mode after save
- [x] Region name input for region drafts

### Advanced Option (Deferred)
- [ ] Button: "More Options" → opens side panel
- [ ] Entry creation form (if entry doesn't exist)
- [ ] Entry hierarchy selection (parent entry)
- [ ] Custom colors/metadata

### IndexEntry Autocomplete
- [x] Search existing entries by label
- [x] Show entry hierarchy in results (e.g., "Philosophy → Kant")
- [x] "Create new entry" option if no match
- [x] Keyboard navigation (arrow keys, enter)
- [x] Input value persists when blurring in region mode

## UI Flow

```
1. User selects text
   ↓
2. Draft highlight appears (blue dashed)
   ↓
3. Popover appears near selection:
   ┌─────────────────────────────────┐
   │ Attach to Index Entry           │
   │ ┌─────────────────────────────┐ │
   │ │ Search or create...      ▼  │ │ ← Autocomplete input
   │ └─────────────────────────────┘ │
   │                                 │
   │ [Cancel]    [Create & Attach]   │
   └─────────────────────────────────┘
   ↓
4. User types entry label (autocomplete suggests)
   ↓
5. User presses Enter or clicks "Create & Attach"
   ↓
6. Draft → persistent (blue dashed → yellow solid)
   ↓
7. Returns to view mode
```

## State Management

**Local State (before API):**

```tsx
type MentionDraft = {
  pageNumber: number;
  text: string;
  bbox: BoundingBox;
  type: 'text' | 'region'; // New: distinguish text selection vs region drawing
};

type Mention = {
  id: string; // UUID
  pageNumber: number;
  text: string;
  bbox: BoundingBox;
  entryId: string;
  entryLabel: string;
  createdAt: Date;
};

const [mentions, setMentions] = useState<Mention[]>([]);
```

**Phase 4B stores in React state only.** Phase 5 adds backend persistence.

## Implementation

### Architecture

The implementation uses a **two-component architecture**:

1. **`PdfAnnotationPopover`** (in `@pubint/yaboujee`)
   - Generic popover wrapper handling positioning logic
   - Auto-positions next to anchor element (draft highlight)
   - Handles viewport bounds checking
   - Manages Escape key handling
   - Reusable for any PDF annotation UI

2. **`MentionCreationPopover`** (in `@apps/index-pdf-frontend`)
   - Application-specific content (autocomplete, form inputs)
   - No positioning logic (pure content component)
   - Uses `FormInput` for standardized form fields
   - Supports both text and region drafts

### Component Signatures

```tsx
// Generic popover in yaboujee
export type PdfAnnotationPopoverProps = {
  anchorElement: HTMLElement | null; // Draft highlight element
  isOpen: boolean;
  onCancel: () => void;
  children: React.ReactNode;
};

// Application-specific content
export type MentionCreationPopoverProps = {
  draft: MentionDraft; // Includes type: 'text' | 'region'
  existingEntries: IndexEntry[];
  onAttach: ({ entryId, entryLabel }) => void;
  onCancel: () => void;
  // No position prop - handled by PdfAnnotationPopover
};
```

### Integration with PdfViewer

`PdfViewer` now manages the popover via **render props**:

```tsx
// In editor.tsx
const handleDraftConfirmed = useCallback(
  ({ draft, entry }: { 
    draft: { pageNumber: number; text: string; bbox: BoundingBox };
    entry: { entryId: string; entryLabel: string };
  }) => {
    const mention: Mention = {
      id: crypto.randomUUID(),
      ...draft,
      entryId: entry.entryId,
      entryLabel: entry.entryLabel,
      createdAt: new Date(),
    };
    
    setMentions(prev => [...prev, mention]);
    setAnnotationMode('view');
  },
  []
);

// PdfViewer integration
<PdfViewer
  renderDraftPopover={({ pageNumber, text, bbox, onConfirm, onCancel }) => (
    <MentionCreationPopover
      draft={{ pageNumber, text, bbox, type: text ? 'text' : 'region' }}
      existingEntries={mockIndexEntries}
      onAttach={onConfirm}
      onCancel={onCancel}
    />
  )}
  onDraftConfirmed={handleDraftConfirmed}
  // ... other props
/>
```

### Autocomplete Data

```tsx
// Mock data for Phase 4B (Phase 5 fetches from API)
const mockIndexEntries: IndexEntry[] = [
  { id: '1', label: 'Kant, Immanuel', parentId: null },
  { id: '2', label: 'Critique of Pure Reason', parentId: '1' },
  { id: '3', label: 'Philosophy', parentId: null },
  // ...
];
```

## Edge Cases

### Empty state - no text selected
- Popover shouldn't appear if selection is empty
- Clear draft highlight if user clicks outside

### Cancellation
- `Escape` key closes popover + clears draft
- Click outside popover → closes + clears draft
- "Cancel" button → closes + clears draft

### Multi-line selections
- Union bbox (from Phase 3) covers all lines
- Popover positioned at top-left of union bbox

### Collision with existing highlight
- Allow overlapping highlights (MVP - no collision detection)
- Post-MVP: Warn if overlap > 50%

## Testing

- [x] Popover appears after text selection
- [x] Autocomplete suggests existing entries
- [x] "Create new entry" works when no match
- [x] Enter key submits form
- [x] Escape cancels and clears draft
- [x] Draft → persistent transition works
- [x] Returns to view mode after attach

## Completion Summary

### Implemented Features

1. **PdfAnnotationPopover Component** (`@pubint/yaboujee`)
   - Generic positioning wrapper for PDF annotation popovers
   - Auto-positions next to anchor element with smart bounds checking
   - Prevents flash by hiding until position calculated
   - Smooth fade-in transition via opacity
   - Click-outside detection via `data-pdf-annotation-popover` attribute
   - Reusable for any PDF annotation UI (mentions, comments, etc.)

2. **FormInput Component** (`@pubint/yaboujee`)
   - Standardized form input wrapper for TanStack Form fields
   - Integrates with yabasic Field, FieldLabel, FieldError
   - Automatic validation state (`data-invalid`, `aria-invalid`)
   - Supports `hideLabel` prop for accessible hidden labels
   - Uses structural typing for field prop (no complex generics)

3. **MentionCreationPopover Component** (`mention-creation-popover.tsx`)
   - Autocomplete input using Combobox from yabasic
   - Search filtering for existing index entries
   - Create new entry when no match found
   - Hierarchical display for nested entries (Parent → Child)
   - Keyboard support (Enter to submit, Escape to cancel)
   - Conditional auto-focus (region name for regions, combobox for text)
   - Smart input value preservation (prevents blur from clearing in region mode)

4. **Editor State Management** (`editor.tsx`)
   - `mentions` state for persistent highlights
   - Draft state managed internally by `PdfViewer`
   - No separate popover visibility state (managed by PdfViewer)
   - No position state (handled by PdfAnnotationPopover)
   - Mock IndexEntry data for autocomplete

5. **Handlers** (`editor.tsx`)
   - `handleDraftConfirmed` - Receives both draft and entry data, creates mention
   - `handleDraftCancelled` - Clears action state
   - Auto-revert to view mode after attach/cancel
   - Simplified from previous approach (3 handlers → 2 handlers)

6. **Mention Rendering**
   - Mentions converted to PdfHighlight format
   - Combined with mock highlights for display
   - Rendered in PdfViewer with yellow solid color

7. **Storybook Stories**
   - `PdfAnnotationPopover` stories (generic positioning tests)
   - `MentionCreationPopover` documentation stories
   - Interaction tests for text selection, region drawing, entry selection
   - Visual regression tests for UI states
   - Shared fixtures for consistency
   - Updated `PdfViewer` tests to cover `renderDraftPopover` callback

### Technical Decisions

- **Two-component architecture** - Separates positioning (`PdfAnnotationPopover`) from content (`MentionCreationPopover`) for reusability
- **Render props pattern** - `PdfViewer` uses `renderDraftPopover` to inject custom content into generic popover
- **Combobox from yabasic** - Reused existing UI component for consistency
- **FormInput component** - New standardized form wrapper in yaboujee that integrates TanStack Form with yabasic Field components
- **Auto-focus on mount** - Conditionally focuses region name input (region mode) or combobox (text mode)
- **Create new entry inline** - No need for separate "create" flow
- **Hierarchical display** - Shows parent → child for nested entries
- **Smart blur handling** - Prevents popover from closing when clicking inside it; preserves custom input values in region mode
- **Structural typing for FormInput** - Uses interface-based field prop instead of complex FieldApi generics

### Key Fixes and Edge Cases

1. **Popover Flash Prevention**
   - Position initialized as `null`, not `{ x: 0, y: 0 }`
   - Opacity starts at 0, transitions to 1 when position calculated
   - Guard prevents rendering until anchor element available

2. **Blur Handling**
   - Text mode: Check if click is inside popover before clearing draft
   - Region mode: Preserve custom input value when combobox blurs
   - Uses `data-pdf-annotation-popover` attribute for click detection

3. **Input Clearing Logic**
   - Combobox clears input when existing entry selected
   - Backspace works normally when dropdown open
   - Custom values preserved when dropdown closed (region mode)
   - Ref-based flag (`allowClearInputRef`) controls when clearing allowed

4. **Focus Management**
   - Region mode: Auto-focus region name input
   - Text mode: Auto-focus combobox
   - Conditional based on `draft.type`

5. **Accessibility**
   - FormInput supports `hideLabel` prop for visually hidden labels
   - Adds `aria-label` when label hidden
   - Maintains screen reader compatibility

6. **Storybook Layout**
   - All stories use `layout: "padded"` instead of `"centered"`
   - No decorator needed (component is pure content, not positioned)
   - Prevents overflow issues since `MentionCreationPopover` has no positioning logic

### Deferred Items

- Backend persistence (Phase 5)
- Advanced options side panel
- Custom colors/metadata
- Entry hierarchy selection UI
- Collision detection for overlapping highlights

## Next Task

[Task 4C: Highlight CRUD Operations](./task-4c-crud-operations.md)
