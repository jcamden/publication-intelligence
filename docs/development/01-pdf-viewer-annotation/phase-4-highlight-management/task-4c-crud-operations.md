# Task 4C: Highlight CRUD Operations

**Duration:** 1-2 days  
**Status:** ⚪ Not Started  
**Dependencies:** Task 4B completion

## Requirements

### View Mode Interactions
- [ ] Click highlight → Show mention details popover
- [ ] Details popover shows:
  - Text snippet
  - Linked IndexEntry label
  - Page number
  - [Edit] [Delete] buttons

### Edit Operation
- [ ] Click "Edit" → Opens entry picker (can change linked entry)
- [ ] Can't edit bbox (post-MVP: drag corners to adjust)
- [ ] Can edit text snippet (manual correction)

### Delete Operation
- [ ] Click "Delete" → Confirmation dialog
- [ ] Confirmation: "Delete this highlight?" [Cancel] [Delete]
- [ ] Keyboard: Select highlight + `Delete` key

### Multi-select (Post-MVP)
- [ ] Shift+Click to select multiple highlights
- [ ] Bulk delete
- [ ] Bulk re-assign to different entry

## UI Flow

```
View Mode:
  Click highlight
    ↓
  ┌─────────────────────────────────┐
  │ "Critique of Pure Reason"       │ ← Mention details popover
  │                                 │
  │ Text: "...the pure concepts..." │
  │ Entry: Kant → CPR               │
  │ Page: 42                        │
  │                                 │
  │ [Edit Entry] [Delete]           │
  └─────────────────────────────────┘
    ↓
  Edit Entry:
    ┌─────────────────────────────────┐
    │ Change Index Entry              │
    │ ┌─────────────────────────────┐ │
    │ │ Kant → CPR               ▼  │ │
    │ └─────────────────────────────┘ │
    │ [Cancel] [Save]                 │
    └─────────────────────────────────┘
    
  Delete:
    ┌─────────────────────────────────┐
    │ Delete this highlight?          │
    │                                 │
    │ This will remove the mention    │
    │ but keep the IndexEntry.        │
    │                                 │
    │ [Cancel] [Delete]               │
    └─────────────────────────────────┘
```

## State Management

### Update

```tsx
const handleUpdateMention = useCallback(
  (mentionId: string, updates: Partial<Mention>) => {
    setMentions(prev =>
      prev.map(m => (m.id === mentionId ? { ...m, ...updates } : m))
    );
  },
  []
);
```

### Delete

```tsx
const handleDeleteMention = useCallback(
  (mentionId: string) => {
    setMentions(prev => prev.filter(m => m.id !== mentionId));
  },
  []
);
```

## Implementation

### Architecture Note

**Follow the two-component pattern established in Task 4B:**

1. **Reuse `PdfAnnotationPopover`** from yaboujee for positioning
2. **Create `MentionDetailsPopover`** as pure content component
3. **No positioning props** - `PdfAnnotationPopover` handles all positioning logic

This ensures consistency across all PDF annotation popovers.

### Mention Details Popover

```tsx
// apps/index-pdf-frontend/src/app/projects/[projectDir]/editor/_components/mention-details-popover/
export type MentionDetailsPopoverProps = {
  mention: Mention;
  onEdit: (mentionId: string) => void;
  onDelete: (mentionId: string) => void;
  onClose: () => void;
  // No position prop - handled by PdfAnnotationPopover wrapper
};
```

### Integration

```tsx
// In editor.tsx
const [selectedMention, setSelectedMention] = useState<Mention | null>(null);
const [detailsAnchor, setDetailsAnchor] = useState<HTMLElement | null>(null);

const handleHighlightClick = useCallback(
  (highlight: PdfHighlight) => {
    const mention = mentions.find(m => m.id === highlight.id);
    if (mention) {
      // Find the highlight element to use as anchor
      const highlightEl = document.querySelector(`[data-highlight-id="${highlight.id}"]`);
      if (highlightEl instanceof HTMLElement) {
        setDetailsAnchor(highlightEl);
        setSelectedMention(mention);
      }
    }
  },
  [mentions]
);

// Render with PdfAnnotationPopover wrapper
{selectedMention && (
  <PdfAnnotationPopover
    anchorElement={detailsAnchor}
    isOpen={!!detailsAnchor}
    onCancel={() => {
      setSelectedMention(null);
      setDetailsAnchor(null);
    }}
  >
    <MentionDetailsPopover
      mention={selectedMention}
      onEdit={handleEditMention}
      onDelete={handleDeleteMention}
      onClose={() => {
        setSelectedMention(null);
        setDetailsAnchor(null);
      }}
    />
  </PdfAnnotationPopover>
)}
```

### Delete Confirmation

```tsx
// Reuse existing modal/dialog component
const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
const [mentionToDelete, setMentionToDelete] = useState<string | null>(null);
```

## Testing

- [ ] Click highlight shows details
- [ ] Edit opens entry picker with current entry selected
- [ ] Delete confirmation works
- [ ] Delete key shortcut works
- [ ] Popover closes on outside click
- [ ] Can't edit/delete draft highlights (only persistent)

## Next Task

[Task 4D: IndexEntry Connection UI](./task-4d-entry-connection.md)
