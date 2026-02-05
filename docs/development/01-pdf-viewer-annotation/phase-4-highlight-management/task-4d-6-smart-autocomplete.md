# Task 4D-6: Smart Autocomplete Integration

**Duration:** 2 hours  
**Status:** ✅ Complete (Feb 3, 2026)  
**Dependencies:** Task 4D-1, 4D-2, 4D-3, 4D-5 completion

## Goal

Replace the current entry selection in `MentionCreationPopover` with the new `EntryPicker` component, implement exact-match autocomplete logic, and integrate entry creation flow.

## Current State

**MentionCreationPopover** currently uses:
- `Combobox` from yabasic directly
- Local state for entry selection (`selectedValue`, `inputValue`)
- No exact-match autocomplete
- No integration with entry creation

## Smart Autocomplete Logic

### Exact Match Detection

```typescript
const findExactMatch = ({
  text,
  entries,
}: {
  text: string;
  entries: IndexEntry[];
}): IndexEntry | null => {
  const normalized = text.trim().toLowerCase();
  
  return entries.find(entry => {
    // Check label
    if (entry.label.toLowerCase() === normalized) return true;
    
    // Check aliases
    const aliases = entry.metadata?.aliases || [];
    return aliases.some(alias => alias.toLowerCase() === normalized);
  }) || null;
};
```

**Behavior:**
- Only auto-populate on EXACT match (case-insensitive)
- Check both label and aliases
- No partial matches (too error-prone)

### Auto-Population Flow

```
1. User selects text → Draft created with draft.text
2. Check exact match against entries for current index type
3. If exact match found:
   - Set selectedEntryId to match.id
   - Set inputValue to match.label
   - User can still change selection
4. If no exact match:
   - Leave selection empty
   - Show all entries in picker
   - User searches/selects manually
```

## Update MentionCreationPopover

### Add Props for IndexEntry System

```typescript
type MentionCreationPopoverProps = {
  draft: MentionDraft;
  indexType: string; // NEW: Current index type context
  indexEntries: IndexEntry[]; // NEW: All entries
  indexTypes: IndexType[]; // NEW: For color mapping (future use)
  mentions: Mention[]; // NEW: For mention counts in picker
  onAttach: (data: {
    entryId: string;
    entryLabel: string;
    regionName?: string;
  }) => void;
  onCancel: () => void;
  onCreateEntry: (data: { // NEW: Entry creation callback
    indexType: string;
    label: string;
  }) => void;
};
```

### Replace Combobox with EntryPicker

**Remove:**
```typescript
// ❌ OLD - Direct Combobox usage
const [selectedValue, setSelectedValue] = useState<IndexEntry | null>(null);
const [inputValue, setInputValue] = useState("");

<Combobox
  items={existingEntries.map(e => e.label)}
  value={selectedValue?.label ?? null}
  onValueChange={(label) => {
    const entry = existingEntries.find(e => e.label === label);
    setSelectedValue(entry ?? null);
  }}
  // ... more props
>
  <ComboboxInput ref={comboboxInputRef} />
  <ComboboxContent>
    {/* ... */}
  </ComboboxContent>
</Combobox>
```

**Add:**
```typescript
// ✅ NEW - EntryPicker component
import { EntryPicker } from '../entry-picker';

const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
const [selectedEntryLabel, setSelectedEntryLabel] = useState<string | null>(null);
const [inputValue, setInputValue] = useState("");

// Smart autocomplete: Check for exact match on mount
useEffect(() => {
  if (!draft.text) return;
  
  const entriesForType = indexEntries.filter(e => e.indexType === indexType);
  const exactMatch = findExactMatch({ text: draft.text, entries: entriesForType });
  
  if (exactMatch) {
    setSelectedEntryId(exactMatch.id);
    setSelectedEntryLabel(exactMatch.label);
    setInputValue(exactMatch.label);
  }
}, [draft.text, indexEntries, indexType]);

<EntryPicker
  indexType={indexType}
  entries={indexEntries}
  mentions={mentions}
  value={selectedEntryId}
  onValueChange={(id, label) => {
    setSelectedEntryId(id);
    setSelectedEntryLabel(label);
    setEntryError(null); // Clear error on selection
  }}
  onCreateNew={(label) => {
    onCreateEntry({ indexType, label });
  }}
  inputValue={inputValue}
  onInputValueChange={setInputValue}
  placeholder="Search or create entry..."
  autoFocus={draft.type === "text"}
/>
```

### Entry Creation Integration

**Flow:**
1. User types non-existent entry name in picker
2. Presses Enter or clicks "Create new"
3. `onCreateNew` callback invoked with label
4. Parent opens `EntryCreationModal` with pre-filled label
5. User completes entry creation
6. New entry auto-selected in picker

**Implementation in editor.tsx:**
```typescript
const [entryCreationModal, setEntryCreationModal] = useState<{
  open: boolean;
  indexType: string;
  prefillLabel?: string;
}>({ open: false, indexType: 'subject' });

<MentionCreationPopover
  draft={draft}
  indexType={activeAction?.type ?? 'subject'} // From active sidebar action
  indexEntries={indexEntries}
  indexTypes={indexTypes}
  mentions={mentions}
  onAttach={handleDraftConfirmed}
  onCancel={() => setDraft(null)}
  onCreateEntry={({ indexType, label }) => {
    setEntryCreationModal({ open: true, indexType, prefillLabel: label });
  }}
/>

<EntryCreationModal
  open={entryCreationModal.open}
  onClose={() => setEntryCreationModal({ open: false, indexType: 'subject' })}
  indexType={entryCreationModal.indexType}
  existingEntries={indexEntries.filter(e => e.indexType === entryCreationModal.indexType)}
  onCreate={(entry) => {
    const newEntry = {
      ...entry,
      id: crypto.randomUUID(),
    };
    setIndexEntries(prev => [...prev, newEntry]);
    
    // Auto-select new entry in picker (if popover still open)
    // This will be handled by EntryPicker's value prop
    
    return newEntry;
  }}
/>
```

### Update Validation

```typescript
const handleSubmit = useCallback(() => {
  let hasError = false;
  
  // Validate entry selection
  if (!selectedEntryId) {
    if (inputValue.trim()) {
      // User typed something but didn't select - prompt to create or select
      setEntryError('Please select an entry or press Enter to create a new one');
    } else {
      setEntryError('Please select or create an entry');
    }
    hasError = true;
  }
  
  // Validate region name for region types
  if (draft.type === "region") {
    const regionName = form.state.values.regionName;
    if (!regionName || !regionName.trim()) {
      form.setFieldMeta('regionName', meta => ({
        ...meta,
        errors: ['Region name is required'],
      }));
      hasError = true;
    }
  }
  
  if (hasError) return;
  
  // Submit
  onAttach({
    entryId: selectedEntryId!,
    entryLabel: selectedEntryLabel!,
    regionName: draft.type === "region" ? form.state.values.regionName : undefined,
  });
}, [selectedEntryId, selectedEntryLabel, inputValue, draft.type, form, onAttach]);
```

## Pass Index Type Context

**Update editor.tsx:**

When creating draft, capture current index type from active sidebar action:

```typescript
const handleTextSelection = useCallback(({ pageNumber, text, bboxes }) => {
  setDraft({
    pageNumber,
    text,
    bboxes,
    type: "text",
  });
  
  // Capture active index type (from activeAction state)
  // This determines which entries to show in picker
}, []);
```

**Active action state:**
```typescript
const [activeAction, setActiveAction] = useState<{
  type: string; // 'subject' | 'author' | 'scripture'
  mode: 'text' | 'region';
} | null>(null);
```

## Storybook Updates

### Update MentionCreationPopover Stories

**Add new props to stories:**
```typescript
export const Default: Story = {
  args: {
    draft: {
      pageNumber: 1,
      text: 'Kant, Immanuel',
      bboxes: [{ x: 100, y: 100, width: 200, height: 20 }],
      type: 'text',
    },
    indexType: 'subject',
    indexEntries: mockIndexEntries,
    indexTypes: mockIndexTypes,
    mentions: mockMentions,
    onAttach: (data) => console.log('Attach:', data),
    onCancel: () => console.log('Cancel'),
    onCreateEntry: ({ indexType, label }) => console.log('Create:', indexType, label),
  },
};
```

### Add Autocomplete Test

```typescript
export const ExactMatchAutocomplete: Story = {
  args: {
    ...Default.args,
    draft: {
      pageNumber: 1,
      text: 'Kant, Immanuel', // Exact match in mock data
      bboxes: [{ x: 100, y: 100, width: 200, height: 20 }],
      type: 'text',
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    
    await step('Verify exact match auto-populated', async () => {
      await waitFor(() => {
        const input = canvas.getByPlaceholderText(/Search or create/i);
        expect((input as HTMLInputElement).value).toBe('Kant, Immanuel');
      });
    });
  },
};

export const NoMatchAutocomplete: Story = {
  args: {
    ...Default.args,
    draft: {
      pageNumber: 1,
      text: 'Unknown Author', // No match
      bboxes: [{ x: 100, y: 100, width: 200, height: 20 }],
      type: 'text',
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    
    await step('Verify input empty (no auto-population)', async () => {
      await waitFor(() => {
        const input = canvas.getByPlaceholderText(/Search or create/i);
        expect((input as HTMLInputElement).value).toBe('');
      });
    });
  },
};
```

### Add Entry Creation Flow Test

```typescript
export const CreateNewEntryFlow: Story = {
  args: Default.args,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    
    await step('Type new entry name', async () => {
      const input = canvas.getByPlaceholderText(/Search or create/i);
      await userEvent.type(input, 'New Entry Name');
    });
    
    await step('Press Enter to create', async () => {
      const input = canvas.getByPlaceholderText(/Search or create/i);
      await userEvent.type(input, '{Enter}');
      // onCreateEntry should be called
    });
  },
};
```

## Files to Update

- `apps/index-pdf-frontend/src/app/projects/[projectDir]/editor/_components/mention-creation-popover/mention-creation-popover.tsx`
- `apps/index-pdf-frontend/src/app/projects/[projectDir]/editor/_components/mention-creation-popover/stories/mention-creation-popover.stories.tsx`
- `apps/index-pdf-frontend/src/app/projects/[projectDir]/editor/_components/mention-creation-popover/stories/tests/interaction-tests.stories.tsx`
- `apps/index-pdf-frontend/src/app/projects/[projectDir]/editor/editor.tsx`

## Success Criteria

- ✅ EntryPicker replaces direct Combobox usage
- ✅ Exact-match autocomplete auto-populates entry field
- ✅ Partial matches do NOT auto-populate
- ✅ Entry creation integrated with picker
- ✅ New entries auto-selected after creation
- ✅ Validation works with new picker
- ✅ All existing tests updated and passing
- ✅ New autocomplete tests added

## Phase 4 Completion

After Task 4D-6, Phase 4 is complete! All frontend components for mention and entry management are implemented:

- ✅ Mention creation with region support
- ✅ Multi-type mentions with diagonal stripes
- ✅ IndexEntry hierarchy management
- ✅ Entry picker with search and creation
- ✅ Configurable index type colors
- ✅ Smart autocomplete

## Next Phase

[Phase 5: Backend Integration](../phase-5-backend-integration/)

Schema changes required:
- `IndexType` table
- `IndexEntry` table with `index_type` field
- `IndexMention.index_types` array field
- Migration strategy

See `docs/development/01-pdf-viewer-annotation/phase-5-schema-changes.md`
