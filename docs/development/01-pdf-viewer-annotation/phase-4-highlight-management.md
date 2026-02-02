# Phase 4: Highlight Management UI

## Overview

Transform draft highlights into persistent, manageable mentions linked to IndexEntries. Provide UI for creating, editing, and organizing highlights.

## Sub-Phases

### 4A: Toolbar UI + Mode Indicators
**Duration:** 1-2 days

### 4B: Mention Creation Flow
**Duration:** 2-3 days

### 4C: Highlight CRUD Operations
**Duration:** 1-2 days

### 4D: IndexEntry Connection UI
**Duration:** 2 days

---

## Phase 4A: Toolbar UI + Mode Indicators

### Requirements

**Toolbar Component:**
- [ ] Create `PdfViewerToolbar` component in yaboujee
- [ ] Position: Fixed top of viewer container (not floating)
- [ ] Mode toggle buttons (View, Add Highlight, future: Add Region)
- [ ] Visual active state for current mode
- [ ] Keyboard shortcuts display (tooltips)

**Mode Indicators:**
- [ ] Active button styling (e.g., blue background)
- [ ] Cursor changes per mode (default, text, crosshair)
- [ ] Status text: "Viewing" / "Select text to highlight" / "Draw region"
- [ ] Escape key hint when in annotation mode

**Keyboard Shortcuts:**
- [ ] `V` → View mode
- [ ] `T` → Add Text Highlight mode
- [ ] `R` → Add Region mode (future)
- [ ] `Escape` → Exit to View mode + clear draft
- [ ] `?` → Show keyboard shortcuts help overlay

### UI Mockup

```
┌────────────────────────────────────────────────┐
│ [View] [Add Highlight] [Add Region]  [?]      │ ← Toolbar
│ Status: Viewing                       Zoom: 1x │
└────────────────────────────────────────────────┘
┌────────────────────────────────────────────────┐
│                                                │
│           PDF Content Here                     │
│                                                │
└────────────────────────────────────────────────┘
```

### Implementation

**New Component:**
```tsx
// packages/yaboujee/src/components/pdf/components/pdf-viewer-toolbar/
export type PdfViewerToolbarProps = {
  annotationMode: AnnotationMode;
  onModeChange: (mode: AnnotationMode) => void;
  currentPage: number;
  totalPages: number;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  showKeyboardHints?: boolean;
};
```

**Integration:**
```tsx
// In PdfViewer
<div className="pdf-viewer-container">
  <PdfViewerToolbar
    annotationMode={annotationMode}
    onModeChange={setAnnotationMode}
    currentPage={currentPage}
    totalPages={numPages}
    zoom={zoom}
    onZoomChange={setZoom}
  />
  <div className="pdf-content">
    {/* Canvas, highlights, text layer */}
  </div>
</div>
```

**Keyboard Shortcuts:**
```tsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) return; // Don't override browser shortcuts
    
    switch (e.key.toLowerCase()) {
      case 'v':
        setAnnotationMode('view');
        break;
      case 't':
        setAnnotationMode('add-text-highlight');
        break;
      case 'r':
        setAnnotationMode('add-region');
        break;
      case 'escape':
        setAnnotationMode('view');
        setDraftHighlight(null);
        break;
      case '?':
        setShowKeyboardHelp(true);
        break;
    }
  };
  
  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, []);
```

### Testing

- [ ] Keyboard shortcuts work in all modes
- [ ] Mode indicator updates correctly
- [ ] Cursor changes per mode
- [ ] Toolbar doesn't block PDF content
- [ ] Responsive layout (minimum width handling)

---

## Phase 4B: Mention Creation Flow

### Problem Statement

Currently `onCreateDraftHighlight` fires with draft data, but there's no UI to:
1. Attach the highlight to an IndexEntry
2. Persist it to the database
3. Transform draft → persistent highlight

### Requirements

**Mention Creation Popover:**
- [ ] Appears immediately after text selection (near selection)
- [ ] Small, focused UI (not full modal)
- [ ] "Quick create" path + "Advanced" option

**Quick Create Path:**
- [ ] Input: Entry label (autocomplete from existing entries)
- [ ] Button: "Create & Attach"
- [ ] Keyboard: `Enter` to confirm, `Escape` to cancel
- [ ] Auto-returns to view mode after save

**Advanced Option:**
- [ ] Button: "More Options" → opens side panel
- [ ] Entry creation form (if entry doesn't exist)
- [ ] Entry hierarchy selection (parent entry)
- [ ] Custom colors/metadata

**IndexEntry Autocomplete:**
- [ ] Search existing entries by label
- [ ] Show entry hierarchy in results (e.g., "Philosophy → Kant")
- [ ] "Create new entry" option if no match
- [ ] Keyboard navigation (arrow keys, enter)

### UI Flow

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

### State Management

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

### Implementation

**New Component:**
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

**Integration:**
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

**Autocomplete Data:**
```tsx
// Mock data for Phase 4B (Phase 5 fetches from API)
const mockIndexEntries: IndexEntry[] = [
  { id: '1', label: 'Kant, Immanuel', parentId: null },
  { id: '2', label: 'Critique of Pure Reason', parentId: '1' },
  { id: '3', label: 'Philosophy', parentId: null },
  // ...
];
```

### Edge Cases

**Empty state - no text selected:**
- Popover shouldn't appear if selection is empty
- Clear draft highlight if user clicks outside

**Cancellation:**
- `Escape` key closes popover + clears draft
- Click outside popover → closes + clears draft
- "Cancel" button → closes + clears draft

**Multi-line selections:**
- Union bbox (from Phase 3) covers all lines
- Popover positioned at top-left of union bbox

**Collision with existing highlight:**
- Allow overlapping highlights (MVP - no collision detection)
- Post-MVP: Warn if overlap > 50%

### Testing

- [ ] Popover appears after text selection
- [ ] Autocomplete suggests existing entries
- [ ] "Create new entry" works when no match
- [ ] Enter key submits form
- [ ] Escape cancels and clears draft
- [ ] Draft → persistent transition works
- [ ] Returns to view mode after attach

---

## Phase 4C: Highlight CRUD Operations

### Requirements

**View Mode Interactions:**
- [ ] Click highlight → Show mention details popover
- [ ] Details popover shows:
  - Text snippet
  - Linked IndexEntry label
  - Page number
  - [Edit] [Delete] buttons

**Edit Operation:**
- [ ] Click "Edit" → Opens entry picker (can change linked entry)
- [ ] Can't edit bbox (post-MVP: drag corners to adjust)
- [ ] Can edit text snippet (manual correction)

**Delete Operation:**
- [ ] Click "Delete" → Confirmation dialog
- [ ] Confirmation: "Delete this highlight?" [Cancel] [Delete]
- [ ] Keyboard: Select highlight + `Delete` key

**Multi-select (Post-MVP):**
- [ ] Shift+Click to select multiple highlights
- [ ] Bulk delete
- [ ] Bulk re-assign to different entry

### UI Flow

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

### State Management

**Update:**
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

**Delete:**
```tsx
const handleDeleteMention = useCallback(
  (mentionId: string) => {
    setMentions(prev => prev.filter(m => m.id !== mentionId));
  },
  []
);
```

### Implementation

**Mention Details Popover:**
```tsx
// apps/index-pdf-frontend/src/app/projects/[projectDir]/editor/_components/mention-details-popover/
export type MentionDetailsPopoverProps = {
  mention: Mention;
  onEdit: (mentionId: string) => void;
  onDelete: (mentionId: string) => void;
  onClose: () => void;
};
```

**Integration:**
```tsx
// In editor.tsx
const handleHighlightClick = useCallback(
  (highlight: PdfHighlight) => {
    const mention = mentions.find(m => m.id === highlight.id);
    if (mention) {
      setSelectedMention(mention);
      setShowDetailsPopover(true);
    }
  },
  [mentions]
);
```

**Delete Confirmation:**
```tsx
// Reuse existing modal/dialog component
const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
const [mentionToDelete, setMentionToDelete] = useState<string | null>(null);
```

### Testing

- [ ] Click highlight shows details
- [ ] Edit opens entry picker with current entry selected
- [ ] Delete confirmation works
- [ ] Delete key shortcut works
- [ ] Popover closes on outside click
- [ ] Can't edit/delete draft highlights (only persistent)

---

## Phase 4D: IndexEntry Connection UI

### Problem Statement

Currently mentions reference IndexEntries by ID, but we need UI to:
1. Create new IndexEntries from mention flow
2. Browse/search existing entries
3. Show entry hierarchy (parent/child)
4. Visualize entry→mention relationships

### Requirements

**IndexEntry Data Structure (Frontend):**
```tsx
type IndexEntry = {
  id: string;
  label: string; // "Kant, Immanuel"
  parentId: string | null; // For hierarchy
  color?: string; // For visual grouping
  metadata?: {
    aliases?: string[]; // "Kant, I."
    sortKey?: string; // For alphabetization
  };
};
```

**Entry Creation Form:**
- [ ] Triggered from mention creation autocomplete ("Create new entry")
- [ ] Fields:
  - Label (required)
  - Parent entry (optional, for hierarchy)
  - Aliases (optional, comma-separated)
- [ ] Validation: Label must be unique
- [ ] Auto-generate ID and color

**Entry Picker:**
- [ ] Search/filter entries by label
- [ ] Show hierarchy (indent child entries)
- [ ] Show mention count per entry
- [ ] Create new entry inline

**Visual Entry Grouping:**
- [ ] Highlights colored by IndexEntry (not all yellow)
- [ ] Color generated from entry.id hash
- [ ] Consistent colors across pages
- [ ] Optional: User can customize color

### UI Mockup

**Entry Creation:**
```
┌─────────────────────────────────────┐
│ Create Index Entry                  │
│                                     │
│ Label *                             │
│ ┌─────────────────────────────────┐ │
│ │ Kant, Immanuel                  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Parent Entry (optional)             │
│ ┌─────────────────────────────────┐ │
│ │ Philosophy                   ▼  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Aliases (optional)                  │
│ ┌─────────────────────────────────┐ │
│ │ Kant, I.; Emmanuel Kant         │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Cancel]                  [Create]  │
└─────────────────────────────────────┘
```

**Entry Picker:**
```
┌─────────────────────────────────────┐
│ Select Index Entry                  │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Search entries...               │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Philosophy (3 mentions)             │ ← Parent
│   └─ Kant, Immanuel (7 mentions)   │ ← Child
│   └─ Hegel, G.W.F. (2 mentions)    │
│ Science (5 mentions)                │
│                                     │
│ [+ Create New Entry]                │
└─────────────────────────────────────┘
```

### State Management

**IndexEntry State:**
```tsx
const [indexEntries, setIndexEntries] = useState<IndexEntry[]>([]);

const handleCreateEntry = useCallback(
  (entry: Omit<IndexEntry, 'id'>) => {
    const newEntry: IndexEntry = {
      ...entry,
      id: crypto.randomUUID(),
      color: generateColorFromId(entry.label),
    };
    setIndexEntries(prev => [...prev, newEntry]);
    return newEntry;
  },
  []
);
```

**Color Generation:**
```tsx
const generateColorFromId = (id: string): string => {
  // Hash string to hue (0-360)
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 50%)`; // Saturated colors
};
```

### Implementation

**Entry Creation Modal:**
```tsx
// apps/index-pdf-frontend/src/app/projects/[projectDir]/editor/_components/entry-creation-modal/
export type EntryCreationModalProps = {
  existingEntries: IndexEntry[];
  onCreate: (entry: Omit<IndexEntry, 'id'>) => IndexEntry;
  onCancel: () => void;
};
```

**Entry Picker with Hierarchy:**
```tsx
// apps/index-pdf-frontend/src/app/projects/[projectDir]/editor/_components/entry-picker/
export type EntryPickerProps = {
  entries: IndexEntry[];
  mentions: Mention[]; // To show counts
  selectedId?: string;
  onSelect: (entryId: string, entryLabel: string) => void;
  onCreateNew: () => void;
};
```

**Highlight Color by Entry:**
```tsx
// Map mentions to highlights with entry colors
const highlights: PdfHighlight[] = mentions.map(mention => {
  const entry = indexEntries.find(e => e.id === mention.entryId);
  return {
    id: mention.id,
    pageNumber: mention.pageNumber,
    bbox: mention.bbox,
    label: entry?.label || 'Unlabeled',
    text: mention.text,
    metadata: {
      entryId: mention.entryId,
      color: entry?.color || '#FCD34D', // Default yellow
    },
  };
});

// In PdfHighlightBox, use metadata.color for background
```

### Integration with Mention Flow

**Updated flow:**
1. User selects text → draft highlight
2. Autocomplete suggests existing entries
3. If no match → "Create new entry" option
4. If "Create new entry" → Opens entry creation modal
5. After entry created → Auto-attaches to mention
6. Mention now colored by entry

### Testing

- [ ] Entry creation validates unique labels
- [ ] Entry picker shows hierarchy correctly
- [ ] Mention count per entry is accurate
- [ ] Highlights colored by entry
- [ ] Entry colors consistent across pages
- [ ] Search/filter in entry picker works

---

## Phase 4 Completion Criteria

Phase 4 complete when:
- [ ] Toolbar with mode indicators implemented
- [ ] Keyboard shortcuts working (V, T, R, Escape, ?)
- [ ] Mention creation popover functional
- [ ] Draft → persistent transition works
- [ ] Highlight CRUD operations work (view, edit, delete)
- [ ] IndexEntry creation UI implemented
- [ ] Entry picker with hierarchy works
- [ ] Highlights colored by IndexEntry
- [ ] All stored in React state (no backend yet)

## Next Phase Preview

**Phase 5: Backend Integration** will add:
- IndexMention Gel schema
- IndexEntry Gel schema
- tRPC CRUD endpoints
- Optimistic updates (local state → API → confirm)
- Error handling (conflicts, validation)
- Real-time sync (if multi-user in future)

## Technical Notes

### State vs Props

**Phase 4 (local state):**
```tsx
// In editor.tsx
const [mentions, setMentions] = useState<Mention[]>([]);
const [indexEntries, setIndexEntries] = useState<IndexEntry[]>([]);
```

**Phase 5 (API state):**
```tsx
// Replace with tRPC queries/mutations
const { data: mentions } = trpc.mention.list.useQuery({ projectId });
const { data: indexEntries } = trpc.entry.list.useQuery({ projectId });
const createMention = trpc.mention.create.useMutation();
```

### Coordinate Persistence

**Remember:** Store bboxes in PDF user space (PyMuPDF coordinates), not DOM pixels.

```tsx
// ✅ CORRECT - Store PDF coordinates
const mention: Mention = {
  bbox: draftBbox, // Already in PDF user space from Phase 3
};

// ❌ WRONG - Don't store DOM coordinates
const mention: Mention = {
  bbox: convertedDomBbox, // Will break on scale change
};
```

### Performance Considerations

- Lazy load mentions (per-page or viewport)
- Debounce autocomplete search (300ms)
- Virtualize entry picker if > 100 entries
- Optimize color generation (memoize)

### Accessibility

- [ ] Keyboard navigation in all popovers
- [ ] Screen reader labels for toolbar buttons
- [ ] Focus management (trap focus in modals)
- [ ] ARIA labels for mode indicators
