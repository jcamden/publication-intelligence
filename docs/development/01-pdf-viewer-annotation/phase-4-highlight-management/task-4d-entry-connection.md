# Task 4D: IndexEntry Connection UI

**Duration:** 2 days  
**Status:** ✅ COMPLETE (Implemented Feb 3, 2026)  
**Dependencies:** Task 4C completion

> **✅ COMPLETED:** See [TASK-4D-COMPLETION.md](./TASK-4D-COMPLETION.md) for full implementation summary.

> **Implementation Plan:** See [task-4d-implementation-plan.md](./task-4d-implementation-plan.md) for detailed breakdown into 6 subtasks (4D-1 through 4D-6).

## Problem Statement

Currently mentions reference IndexEntries by ID, but we need UI to:
1. Create new IndexEntries from mention flow
2. Browse/search existing entries
3. Show entry hierarchy (parent/child)
4. Visualize entry→mention relationships

## Key Data Model Decisions

### Separate Entries Per Index Type
**Decision:** Each IndexEntry belongs to exactly ONE index type. If "Kant" appears in both Subject and Author indexes, create two separate entries.

**Rationale:**
- Enables different hierarchies per index (Kant under "Philosophy" in Subject vs "German Authors" in Author)
- Simplifies queries and data model
- Each entry has clear ownership and context

### Colors From Index Types, Not Entries
**Decision:** Highlight colors derived from `mention.index_types` array (which references IndexType configurations), not from individual entries.

**Rationale:**
- Users configure colors at index type level (yellow for Subject, blue for Author)
- All Subject highlights are yellow, regardless of which specific entry
- Multi-type mentions use diagonal stripes with multiple index type colors
- Simpler mental model and more consistent UI

### Entry Creation in Two Locations
**Decision:** Primary location is project sidebar (per index type section). Secondary location is during mention creation (quick create).

**Rationale:**
- Project sidebar: Full featured entry management with hierarchy
- Mention creation: Quick workflow without leaving context
- Both maintain clear index type context

### Autocomplete Exact Match Only
**Decision:** Only auto-populate entry field when highlighted text EXACTLY matches entry label or alias (case-insensitive).

**Rationale:**
- Prevents incorrect assumptions (partial matches could be wrong)
- User maintains control over entry selection
- Clear, predictable behavior

## Requirements

### IndexEntry Data Structure (Frontend)

```tsx
type IndexEntry = {
  id: string;
  indexType: string; // 'subject' | 'author' | 'scripture' - Entry belongs to ONE index type
  label: string; // "Kant, Immanuel"
  parentId: string | null; // For hierarchy within same index type
  metadata?: {
    aliases?: string[]; // "Kant, I."
    sortKey?: string; // For alphabetization
  };
};
```

**Design Decision: Separate Entries Per Index Type**

If the same concept appears in multiple indexes (e.g., "Kant, Immanuel" in both Subject and Author), create separate IndexEntry records:
- One Subject entry: `{ id: 'uuid-1', indexType: 'subject', label: 'Kant, Immanuel' }`
- One Author entry: `{ id: 'uuid-2', indexType: 'author', label: 'Kant, Immanuel' }`

**Rationale:**
- Allows different hierarchies per index type (Kant under "Philosophy" in Subject, under "German Authors" in Author)
- Simplifies queries (filter entries by index type)
- Clearer data model (each entry belongs to exactly one index)
- Mentions link to entries via `mention.index_types` array

### Entry Creation Form

**Primary Location:** Project sidebar, within each index type section (Subject, Author, Scripture, Regions)

**Secondary Location:** During mention creation (quick create from autocomplete)

- [ ] Triggered from:
  - Project sidebar: "Create Entry" button in index type section
  - Mention creation: Autocomplete "Create new entry" option
- [ ] Fields:
  - Index Type (pre-filled based on context)
  - Label (required)
  - Parent entry (optional, for hierarchy within same index type)
  - Aliases (optional, comma-separated)
- [ ] Validation: Label must be unique within index type
- [ ] Auto-generate ID

### Entry Picker

**Context-Aware:** Only shows entries for the current index type (determined by active sidebar section or mention context)

- [ ] Search/filter entries by label
- [ ] Filtered to current index type only
- [ ] Show hierarchy (indent child entries within same index type)
- [ ] Show mention count per entry
- [ ] Create new entry inline
- [ ] Hierarchy managed in project sidebar (drag-drop, parent selection)

### Visual Highlight Colors

**Colors derived from index types, not entries**

- [ ] Highlight colors determined by `mention.index_types` array
- [ ] Each index type has configurable color (defaults: yellow=Subject, blue=Author, green=Scripture, custom colors for additional types)
- [ ] Single-type mentions: Use solid color from that index type
- [ ] Multi-type mentions: Display with diagonal stripes (multiple colors) - see [task-4c-multi-type-enhancement.md](./task-4c-multi-type-enhancement.md)
- [ ] Consistent colors across pages (tied to index type configuration)
- [ ] User can customize index type colors in project settings
- [ ] Default color assignment: First 4 index types get red, yellow, green, blue; additional types get generated colors

**Color Customization UI:**
- Project settings: Edit index type colors
- Context settings: Custom colors per region (independent of index type colors)

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

## Entry Hierarchy Management

**Location:** Project sidebar, within each index type section

**Features:**
- [ ] Drag-and-drop to reorder entries
- [ ] Drag-and-drop to change parent (indent/outdent)
- [ ] Parent selection dropdown in entry edit form
- [ ] Visual indentation shows hierarchy
- [ ] Collapse/expand parent entries
- [ ] Hierarchy is per-index-type (Subject hierarchy separate from Author hierarchy)

**UI Pattern:**
```
Subject Index
  └─ Philosophy (parent)
      ├─ Kant, Immanuel (child)
      ├─ Hegel, G.W.F. (child)
      └─ Ancient Philosophy (child/parent)
          ├─ Plato (grandchild)
          └─ Aristotle (grandchild)
  └─ Science (parent)
      └─ Physics (child)
```

**Implementation:**
- Tree structure maintained per index type
- `parentId` references another entry in same index type only
- No cross-index-type parents (Subject entry cannot be parent of Author entry)

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

### Index Type Color Configuration

```tsx
type IndexType = {
  id: string;
  name: string; // 'subject', 'author', 'scripture'
  color: string; // Hex color, user-customizable
  ordinal: number; // For default color assignment
  visible: boolean;
};

// Default color assignment based on ordinal
const DEFAULT_COLORS = ['#FCD34D', '#93C5FD', '#86EFAC', '#FCA5A5']; // Yellow, Blue, Green, Red

const assignDefaultColor = (ordinal: number): string => {
  if (ordinal < DEFAULT_COLORS.length) {
    return DEFAULT_COLORS[ordinal];
  }
  // Generate color for additional index types
  const hue = (ordinal * 137) % 360; // Golden angle distribution
  return `hsl(${hue}, 70%, 50%)`;
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

### Highlight Color by Index Type

```tsx
// Map mentions to highlights with index type colors
const highlights: PdfHighlight[] = mentions.map(mention => {
  const entry = indexEntries.find(e => e.id === mention.entryId);
  
  // Get colors for all index types this mention belongs to
  const colors = mention.indexTypes.map(typeName => {
    const indexType = projectIndexTypes.find(t => t.name === typeName);
    return indexType?.color || '#FCD34D'; // Fallback to yellow
  });
  
  return {
    id: mention.id,
    pageNumber: mention.pageNumber,
    bbox: mention.bbox,
    label: entry?.label || 'Unlabeled',
    text: mention.text,
    metadata: {
      entryId: mention.entryId,
      indexTypes: mention.indexTypes,
      colors: colors, // Array of colors for multi-type rendering
      // If single type: colors[0] for solid background
      // If multi-type: colors array for diagonal stripes
    },
  };
});

// In PdfHighlightBox:
// - Single type: Use solid background with colors[0]
// - Multi-type: Use CSS gradient for diagonal stripes with colors array
```

## Integration with Mention Flow

**Updated flow:**
1. User selects text → draft highlight
2. **Smart autocomplete:**
   - Check if highlighted text exactly matches an entry label or alias (case-insensitive)
   - If exact match found: Auto-populate entry field (user can still change)
   - If no exact match: Leave entry field empty, show all entries for current index type
3. User searches/selects entry from autocomplete dropdown
4. If no suitable entry exists → "Create new entry" option
5. If "Create new entry" → Opens entry creation modal
6. After entry created → Auto-attaches to mention
7. Mention now colored by index type (from mention.indexTypes)

**Autocomplete Behavior:**
```tsx
const checkExactMatch = (highlightedText: string, entries: IndexEntry[]): IndexEntry | null => {
  const normalized = highlightedText.trim().toLowerCase();
  
  return entries.find(entry => {
    // Check label
    if (entry.label.toLowerCase() === normalized) return true;
    
    // Check aliases
    const aliases = entry.metadata?.aliases || [];
    return aliases.some(alias => alias.toLowerCase() === normalized);
  }) || null;
};

// On draft creation:
const exactMatch = checkExactMatch(draft.text, entriesForCurrentIndexType);
if (exactMatch) {
  setSelectedEntry(exactMatch);
  setInputValue(exactMatch.label);
}
```

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

[Phase 5: Backend Integration](../phase-5-backend-integration/)

**Important:** The design decisions documented here require schema changes. See [Task 5A: Schema Migration](../phase-5-backend-integration/task-5a-schema-migration.md) for:
- New IndexType table
- IndexEntry.index_type field (breaking change)
- IndexMention.index_types array
- Region table for ignore/page-number regions
- Migration strategy and testing requirements
