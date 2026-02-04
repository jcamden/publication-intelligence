# Task 4D-3: Entry Picker Component

**Duration:** 2 hours  
**Status:** ⚪ Not Started  
**Dependencies:** Task 4D-1, 4D-2 completion

## Goal

Build a searchable entry picker component that displays hierarchy, mention counts, and supports creating new entries inline.

## Component Structure

```
entry-picker/
├── index.ts
├── entry-picker.tsx
├── components/
│   ├── entry-label.tsx
│   └── mention-count-badge.tsx
└── stories/
    ├── entry-picker.stories.tsx
    └── tests/
        ├── interaction-tests.stories.tsx
        └── visual-regression-tests.stories.tsx
```

## Component API

```typescript
type EntryPickerProps = {
  indexType: string; // Current index type context
  entries: IndexEntry[]; // All entries (will be filtered to indexType)
  mentions: Mention[]; // For showing counts
  value: string | null; // Selected entry ID
  onValueChange: (entryId: string | null, entryLabel: string | null) => void;
  onCreateNew: (label: string) => void; // Trigger entry creation modal
  inputValue?: string; // Controlled input for external state
  onInputValueChange?: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
};
```

**Usage:**
```typescript
const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
const [inputValue, setInputValue] = useState('');

<EntryPicker
  indexType="subject"
  entries={indexEntries}
  mentions={mentions}
  value={selectedEntryId}
  onValueChange={(id, label) => {
    setSelectedEntryId(id);
    console.log('Selected:', id, label);
  }}
  onCreateNew={(label) => {
    // Open entry creation modal with pre-filled label
    openEntryCreationModal({ prefillLabel: label });
  }}
  inputValue={inputValue}
  onInputValueChange={setInputValue}
  placeholder="Search entries..."
  autoFocus={true}
/>
```

## Implementation

### Entry Filtering

```typescript
const getFilteredEntries = ({
  entries,
  indexType,
  searchTerm,
}: {
  entries: IndexEntry[];
  indexType: string;
  searchTerm: string;
}): IndexEntry[] => {
  // Filter to index type
  let filtered = entries.filter(e => e.indexType === indexType);
  
  // Filter by search term
  if (searchTerm) {
    const normalized = searchTerm.toLowerCase();
    filtered = filtered.filter(entry => {
      // Check label
      if (entry.label.toLowerCase().includes(normalized)) return true;
      
      // Check aliases
      const aliases = entry.metadata?.aliases || [];
      return aliases.some(alias => alias.toLowerCase().includes(normalized));
    });
  }
  
  return filtered;
};
```

### Mention Counting

```typescript
const getMentionCount = ({
  entryId,
  mentions,
}: {
  entryId: string;
  mentions: Mention[];
}): number => {
  return mentions.filter(m => m.entryId === entryId).length;
};
```

### Main Component

```typescript
export const EntryPicker = ({
  indexType,
  entries,
  mentions,
  value,
  onValueChange,
  onCreateNew,
  inputValue: externalInputValue,
  onInputValueChange: externalOnInputValueChange,
  placeholder = 'Search entries...',
  autoFocus = false,
}: EntryPickerProps) => {
  const [internalInputValue, setInternalInputValue] = useState('');
  const inputValue = externalInputValue ?? internalInputValue;
  const setInputValue = externalOnInputValueChange ?? setInternalInputValue;
  
  const filteredEntries = useMemo(
    () => getFilteredEntries({ entries, indexType, searchTerm: inputValue }),
    [entries, indexType, inputValue]
  );
  
  const handleValueChange = useCallback((entryId: string) => {
    const entry = entries.find(e => e.id === entryId);
    onValueChange(entryId, entry?.label ?? null);
  }, [entries, onValueChange]);
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue && filteredEntries.length === 0) {
      e.preventDefault();
      onCreateNew(inputValue);
    }
  }, [inputValue, filteredEntries, onCreateNew]);
  
  return (
    <Combobox
      items={filteredEntries.map(e => e.id)}
      value={value}
      onValueChange={handleValueChange}
      inputValue={inputValue}
      onInputValueChange={setInputValue}
    >
      <ComboboxInput
        placeholder={placeholder}
        autoFocus={autoFocus}
        onKeyDown={handleKeyDown}
      />
      <ComboboxContent>
        <ComboboxEmpty>
          {inputValue ? (
            <div className="text-center text-sm text-gray-500">
              <p>No matching entries</p>
              <p className="mt-1">Press Enter to create "{inputValue}"</p>
            </div>
          ) : (
            <p className="text-center text-sm text-gray-500">
              Type to search entries
            </p>
          )}
        </ComboboxEmpty>
        <ComboboxList>
          {(entryId) => {
            const entry = entries.find(e => e.id === entryId)!;
            const mentionCount = getMentionCount({ entryId, mentions });
            
            return (
              <ComboboxItem key={entryId} value={entryId}>
                <EntryLabel entry={entry} entries={entries} />
                <MentionCountBadge count={mentionCount} />
              </ComboboxItem>
            );
          }}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
};
```

## EntryLabel Component

Displays entry with hierarchy indentation and parent context.

```typescript
type EntryLabelProps = {
  entry: IndexEntry;
  entries: IndexEntry[]; // For looking up parent
  showHierarchy?: boolean; // Default: true
};

export const EntryLabel = ({
  entry,
  entries,
  showHierarchy = true,
}: EntryLabelProps) => {
  const depth = useMemo(
    () => getEntryDepth({ entry, entries }),
    [entry, entries]
  );
  
  const parentLabel = useMemo(() => {
    if (!entry.parentId) return null;
    const parent = entries.find(e => e.id === entry.parentId);
    return parent?.label ?? null;
  }, [entry.parentId, entries]);
  
  return (
    <div
      className="flex items-center gap-2"
      style={showHierarchy ? { paddingLeft: `${depth * 12}px` } : undefined}
    >
      <span className="font-medium">{entry.label}</span>
      {parentLabel && (
        <span className="text-xs text-gray-500">→ {parentLabel}</span>
      )}
    </div>
  );
};

const getEntryDepth = ({
  entry,
  entries,
}: {
  entry: IndexEntry;
  entries: IndexEntry[];
}): number => {
  let depth = 0;
  let current = entry;
  
  while (current.parentId) {
    const parent = entries.find(e => e.id === current.parentId);
    if (!parent) break;
    depth++;
    current = parent;
  }
  
  return depth;
};
```

## MentionCountBadge Component

```typescript
type MentionCountBadgeProps = {
  count: number;
};

export const MentionCountBadge = ({ count }: MentionCountBadgeProps) => {
  if (count === 0) return null;
  
  return (
    <span className="ml-auto rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
      {count}
    </span>
  );
};
```

## Hierarchy Display Behavior

**Options:**

1. **Flat list with indentation** (recommended for simplicity):
   - All entries shown in flat list
   - Indentation shows depth (12px per level)
   - Parent label shown in gray after entry label

2. **Tree structure with expand/collapse** (more complex, defer to 4D-4):
   - Only show top-level entries initially
   - Expand/collapse to reveal children
   - More complex state management

**For Task 4D-3, use flat list with indentation.**

## Storybook Tests

### Documentation Story

```typescript
export const Default: Story = {
  args: {
    indexType: 'subject',
    entries: mockSubjectEntries,
    mentions: mockMentions,
    value: null,
    onValueChange: (id, label) => console.log('Selected:', id, label),
    onCreateNew: (label) => console.log('Create new:', label),
  },
};

export const WithSelection: Story = {
  args: {
    ...Default.args,
    value: 'entry-subject-3', // Kant, Immanuel
  },
};
```

### Interaction Tests

```typescript
export const SearchEntries: Story = {
  args: Default.args,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    
    await step('Type search term', async () => {
      const input = canvas.getByPlaceholderText('Search entries...');
      await userEvent.type(input, 'Kant');
    });
    
    await step('Verify filtered results', async () => {
      await waitFor(() => {
        const kantEntry = canvas.getByText('Kant, Immanuel');
        expect(kantEntry).toBeInTheDocument();
      });
    });
    
    await step('Select entry', async () => {
      const kantEntry = canvas.getByText('Kant, Immanuel');
      await userEvent.click(kantEntry);
    });
  },
};

export const CreateNewEntry: Story = {
  args: Default.args,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    
    await step('Type non-existent entry', async () => {
      const input = canvas.getByPlaceholderText('Search entries...');
      await userEvent.type(input, 'New Entry Name');
    });
    
    await step('Verify empty state message', async () => {
      await waitFor(() => {
        const message = canvas.getByText(/No matching entries/i);
        expect(message).toBeInTheDocument();
      });
    });
    
    await step('Press Enter to create', async () => {
      const input = canvas.getByPlaceholderText('Search entries...');
      await userEvent.type(input, '{Enter}');
      // onCreateNew should be called
    });
  },
};
```

### Visual Regression Tests

```typescript
export const EmptyState: Story = {
  args: Default.args,
  globals: {
    ...defaultGlobals,
    viewport: { value: 'mobile1' }, // 375x667
  },
};

export const PopulatedList: Story = {
  args: Default.args,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByPlaceholderText('Search entries...');
    await userEvent.click(input); // Open dropdown
  },
  globals: {
    ...defaultGlobals,
    viewport: { value: 'mobile1' },
  },
};

export const WithHierarchy: Story = {
  args: Default.args,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByPlaceholderText('Search entries...');
    await userEvent.click(input); // Open dropdown
  },
  globals: {
    ...defaultGlobals,
    viewport: { value: 'mobile1' },
  },
};
```

## Files to Create

- `apps/index-pdf-frontend/src/app/projects/[projectDir]/editor/_components/entry-picker/index.ts`
- `apps/index-pdf-frontend/src/app/projects/[projectDir]/editor/_components/entry-picker/entry-picker.tsx`
- `apps/index-pdf-frontend/src/app/projects/[projectDir]/editor/_components/entry-picker/components/entry-label.tsx`
- `apps/index-pdf-frontend/src/app/projects/[projectDir]/editor/_components/entry-picker/components/mention-count-badge.tsx`
- `apps/index-pdf-frontend/src/app/projects/[projectDir]/editor/_components/entry-picker/stories/entry-picker.stories.tsx`
- `apps/index-pdf-frontend/src/app/projects/[projectDir]/editor/_components/entry-picker/stories/tests/interaction-tests.stories.tsx`
- `apps/index-pdf-frontend/src/app/projects/[projectDir]/editor/_components/entry-picker/stories/tests/visual-regression-tests.stories.tsx`

## Success Criteria

- ✅ Filters entries to current index type
- ✅ Search filters by label and aliases
- ✅ Displays hierarchy with indentation
- ✅ Shows mention count per entry
- ✅ Empty state prompts entry creation
- ✅ Enter key triggers onCreateNew
- ✅ Comprehensive test coverage

## Next Task

[Task 4D-4: Project Sidebar Entry Tree](./task-4d-4-project-sidebar-entry-tree.md)
