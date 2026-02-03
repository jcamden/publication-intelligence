# Task 4C: Highlight CRUD Operations

**Duration:** 1-2 days  
**Status:** 🟡 Mostly Complete (Sidebar navigation pending)  
**Dependencies:** Task 4B completion

## Requirements

### View Mode Interactions
- [x] Click highlight → Show mention details popover
- [x] Details popover shows:
  - Text snippet
  - Linked IndexEntry label
  - Page number
  - [Edit] [Delete] buttons

### Sidebar Navigation
- [ ] Click mention in page sidebar → Show popover anchored to highlight on PDF
- [ ] Scroll highlight into view if off-screen
- [ ] Popover appears next to the highlight (same as direct click)
- Note: Page sidebar only shows mentions for current page, so no page navigation needed

### Edit Operation
- [x] Click "Edit" → Placeholder handler (full implementation in Task 4D)
- [ ] Can't edit bbox (post-MVP: drag corners to adjust)
- [ ] Can edit text snippet (manual correction)

### Delete Operation
- [x] Click "Delete" → Confirmation dialog
- [x] Confirmation: "Delete this highlight?" [Cancel] [Delete]
- [x] Keyboard: Select highlight + `Delete` key

### Multi-select (Post-MVP)
- [ ] Shift+Click to select multiple highlights
- [ ] Bulk delete
- [ ] Bulk re-assign to different entry

## UI Flow

```
View Mode (Option 1 - Click highlight on PDF):
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

View Mode (Option 2 - Click mention in sidebar):
  Page Sidebar → Subject Index → Click mention
    ↓
  Scroll highlight into view (if off-screen)
    ↓
  ┌─────────────────────────────────┐
  │ "Critique of Pure Reason"       │ ← Popover anchored to highlight
  │                                 │
  │ Text: "...the pure concepts..." │
  │ Entry: Kant → CPR               │
  │ Page: 42                        │
  │                                 │
  │ [Edit Entry] [Delete]           │
  └─────────────────────────────────┘
  
  Note: Sidebar only shows mentions on current page
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

### Sidebar Navigation Implementation

When user clicks a mention in the page sidebar:

```tsx
const handleMentionClickFromSidebar = useCallback(
  ({ mentionId }: { mentionId: string }) => {
    const mention = mentions.find((m) => m.id === mentionId);
    if (!mention) return;

    // Find the highlight element
    const highlightEl = document.querySelector(
      `[data-highlight-id="${mentionId}"]`,
    );
    
    if (highlightEl instanceof HTMLElement) {
      // Scroll into view if off-screen
      highlightEl.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'nearest'
      });
      
      // Show popover (same as direct click)
      setDetailsAnchor(highlightEl);
      setSelectedMention(mention);
    }
  },
  [mentions],
);
```

**Key behaviors:**
- Page sidebar only shows mentions on current page (no navigation needed)
- Scroll highlight into view if off-screen (smooth animation)
- Show same popover as direct highlight click
- Use `block: 'center'` to ensure highlight is vertically centered
- Use `inline: 'nearest'` to avoid horizontal scrolling unless necessary

## Index Type Tracking

### Completed
- [x] Mentions include `indexTypes: string[]` field
- [x] Index type captured when creating mention (from sidebar section)
- [x] Each sidebar section filters mentions by their index type
- [x] Details popover displays which index types mention belongs to
- [x] Only mentions from relevant type shown in each sidebar section

### Multi-Type Management (Future Enhancement)
See [task-4c-multi-type-enhancement.md](./task-4c-multi-type-enhancement.md) for:
- [ ] UI for adding/removing index types after creation
- [ ] Diagonal stripe visualization for multi-type mentions
- [ ] Bulk operations for index types

## Testing

- [x] Click highlight shows details
- [x] Edit button triggers handler (full implementation in Task 4D)
- [x] Delete confirmation works
- [x] Delete key shortcut works
- [x] Popover closes on outside click (handled by PdfAnnotationPopover)
- [x] Only persistent mentions can be clicked (draft highlights don't trigger details)
- [x] Mentions created from different sidebar sections have correct index type
- [x] Sidebar sections only show mentions of their index type
- [x] Details popover displays index types correctly

### Test Coverage

**Components Created:**
- `MentionDetailsPopover` - Content component for showing mention details (includes index type display)
- `DeleteMentionDialog` - Confirmation dialog for deletion

**Storybook Stories:**
- Documentation stories for both components (with various index types)
- Interaction tests for button clicks and content verification
- Visual regression tests for light/dark themes and hover states

**Integration:**
- Editor updated to handle highlight clicks
- State management for selected mention and delete confirmation
- Keyboard handler for Delete key when mention is selected
- Index type captured from `activeAction.indexType`
- Sidebar filtering by index type

## Next Task

[Task 4D: IndexEntry Connection UI](./task-4d-entry-connection.md)
