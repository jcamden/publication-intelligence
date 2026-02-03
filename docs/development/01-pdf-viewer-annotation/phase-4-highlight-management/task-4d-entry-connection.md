# Task 4D: IndexEntry Connection UI

**Duration:** 2 days  
**Status:** ⚪ Not Started  
**Dependencies:** Task 4C completion

## Problem Statement

Currently mentions reference IndexEntries by ID, but we need UI to:
1. Create new IndexEntries from mention flow
2. Browse/search existing entries
3. Show entry hierarchy (parent/child)
4. Visualize entry→mention relationships

## Requirements

### IndexEntry Data Structure (Frontend)

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

### Entry Creation Form
- [ ] Triggered from mention creation autocomplete ("Create new entry")
- [ ] Fields:
  - Label (required)
  - Parent entry (optional, for hierarchy)
  - Aliases (optional, comma-separated)
- [ ] Validation: Label must be unique
- [ ] Auto-generate ID and color

### Entry Picker
- [ ] Search/filter entries by label
- [ ] Show hierarchy (indent child entries)
- [ ] Show mention count per entry
- [ ] Create new entry inline

### Visual Entry Grouping
- [ ] Highlights colored by IndexEntry (not all yellow)
- [ ] Color generated from entry.id hash
- [ ] Consistent colors across pages
- [ ] Optional: User can customize color

## UI Mockup

### Entry Creation

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

### Entry Picker

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

## State Management

### IndexEntry State

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

### Color Generation

```tsx
const generateColorFromId = (id: string): string => {
  // Hash string to hue (0-360)
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 50%)`; // Saturated colors
};
```

## Implementation

### Architecture Notes

**Use standardized form components from Task 4B:**

1. **Use `FormInput`** from yaboujee for all form fields (label, aliases)
2. **Use TanStack Form** for form state management
3. **Use `FieldError`** from yabasic for error display
4. **Follow existing patterns** from `MentionCreationPopover`

This ensures consistent form UX across the application.

### Entry Creation Modal

```tsx
// apps/index-pdf-frontend/src/app/projects/[projectDir]/editor/_components/entry-creation-modal/
export type EntryCreationModalProps = {
  existingEntries: IndexEntry[];
  onCreate: (entry: Omit<IndexEntry, 'id'>) => IndexEntry;
  onCancel: () => void;
};

// Example form structure using FormInput:
const form = useForm({
  defaultValues: {
    label: '',
    parentId: null,
    aliases: '',
  },
  onSubmit: async ({ value }) => {
    const entry = onCreate({
      label: value.label,
      parentId: value.parentId,
      metadata: {
        aliases: value.aliases.split(',').map(s => s.trim()).filter(Boolean),
      },
    });
    // ... handle success
  },
});

// Use FormInput for each field:
<form.Field name="label" validators={{ onSubmit: validateNonEmpty }}>
  {(field) => (
    <FormInput
      field={field}
      label="Label"
      placeholder="Entry name"
    />
  )}
</form.Field>
```

### Entry Picker with Hierarchy

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

### Highlight Color by Entry

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

## Integration with Mention Flow

**Updated flow:**
1. User selects text → draft highlight
2. Autocomplete suggests existing entries
3. If no match → "Create new entry" option
4. If "Create new entry" → Opens entry creation modal
5. After entry created → Auto-attaches to mention
6. Mention now colored by entry

## Testing

- [ ] Entry creation validates unique labels
- [ ] Entry picker shows hierarchy correctly
- [ ] Mention count per entry is accurate
- [ ] Highlights colored by entry
- [ ] Entry colors consistent across pages
- [ ] Search/filter in entry picker works

## Phase 4 Completion

After this task, Phase 4 is complete. See [Phase 4 README](./README.md) for completion criteria.

## Next Phase

[Phase 5: Backend Integration](../phase-5-backend-integration.md)
