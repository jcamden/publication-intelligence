# Task 4B: Mention Creation Flow

**Duration:** 2-3 days  
**Status:** ⚪ Not Started  
**Dependencies:** Task 4A completion

## Problem Statement

Currently `onCreateDraftHighlight` fires with draft data, but there's no UI to:
1. Attach the highlight to an IndexEntry
2. Persist it to the database
3. Transform draft → persistent highlight

## Requirements

### Mention Creation Popover
- [ ] Appears immediately after text selection (near selection)
- [ ] Small, focused UI (not full modal)
- [ ] "Quick create" path + "Advanced" option

### Quick Create Path
- [ ] Input: Entry label (autocomplete from existing entries)
- [ ] Button: "Create & Attach"
- [ ] Keyboard: `Enter` to confirm, `Escape` to cancel
- [ ] Auto-returns to view mode after save

### Advanced Option
- [ ] Button: "More Options" → opens side panel
- [ ] Entry creation form (if entry doesn't exist)
- [ ] Entry hierarchy selection (parent entry)
- [ ] Custom colors/metadata

### IndexEntry Autocomplete
- [ ] Search existing entries by label
- [ ] Show entry hierarchy in results (e.g., "Philosophy → Kant")
- [ ] "Create new entry" option if no match
- [ ] Keyboard navigation (arrow keys, enter)

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
const [draftMention, setDraftMention] = useState<MentionDraft | null>(null);
```

**Phase 4B stores in React state only.** Phase 5 adds backend persistence.

## Implementation

### New Component

```tsx
// apps/index-pdf-frontend/src/app/projects/[projectDir]/editor/_components/mention-creation-popover/
export type MentionCreationPopoverProps = {
  draft: MentionDraft;
  existingEntries: IndexEntry[]; // For autocomplete
  onAttach: (entryId: string, entryLabel: string) => void;
  onCancel: () => void;
  position: { x: number; y: number }; // Near selection
};
```

### Integration

```tsx
// In editor.tsx
const handleCreateDraftHighlight = useCallback(
  (draft: { pageNumber: number; text: string; bbox: BoundingBox }) => {
    setDraftMention(draft);
    setShowMentionPopover(true);
    // Don't auto-return to view mode - let user complete flow
  },
  []
);

const handleAttachMention = useCallback(
  (entryId: string, entryLabel: string) => {
    const mention: Mention = {
      id: crypto.randomUUID(),
      ...draftMention!,
      entryId,
      entryLabel,
      createdAt: new Date(),
    };
    
    setMentions(prev => [...prev, mention]);
    setDraftMention(null);
    setShowMentionPopover(false);
    setAnnotationMode('view'); // Return to view mode
  },
  [draftMention]
);
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

- [ ] Popover appears after text selection
- [ ] Autocomplete suggests existing entries
- [ ] "Create new entry" works when no match
- [ ] Enter key submits form
- [ ] Escape cancels and clears draft
- [ ] Draft → persistent transition works
- [ ] Returns to view mode after attach

## Next Task

[Task 4C: Highlight CRUD Operations](./task-4c-crud-operations.md)
