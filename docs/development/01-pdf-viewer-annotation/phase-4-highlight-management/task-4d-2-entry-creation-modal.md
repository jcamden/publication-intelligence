# Task 4D-2: Entry Creation Modal

**Duration:** 2 hours  
**Status:** ⚪ Not Started  
**Dependencies:** Task 4D-1 completion

## Goal

Build a modal form for creating IndexEntries with hierarchy support, using TanStack Form and standardized form components.

## Component Structure

```
entry-creation-modal/
├── index.ts
├── entry-creation-modal.tsx
└── stories/
    ├── entry-creation-modal.stories.tsx
    └── tests/
        ├── interaction-tests.stories.tsx
        └── visual-regression-tests.stories.tsx
```

## Component API

```typescript
type EntryCreationModalProps = {
  open: boolean;
  onClose: () => void;
  indexType: string; // Current index type context
  existingEntries: IndexEntry[]; // For parent selection and validation
  onCreate: (entry: Omit<IndexEntry, 'id'>) => IndexEntry;
};
```

**Usage:**
```typescript
const [modalOpen, setModalOpen] = useState(false);

<EntryCreationModal
  open={modalOpen}
  onClose={() => setModalOpen(false)}
  indexType="subject"
  existingEntries={subjectEntries}
  onCreate={({ label, parentId, metadata }) => {
    const newEntry = {
      id: crypto.randomUUID(),
      indexType,
      label,
      parentId,
      metadata,
    };
    setIndexEntries(prev => [...prev, newEntry]);
    return newEntry;
  }}
/>
```

## Form Structure

### Form State

```typescript
import { useForm } from '@tanstack/react-form';

const form = useForm({
  defaultValues: {
    label: '',
    parentId: null as string | null,
    aliases: '', // Comma-separated string
  },
  onSubmit: async ({ value }) => {
    // Validate unique label within index type
    const exists = existingEntries.some(
      e => e.indexType === indexType && e.label.toLowerCase() === value.label.trim().toLowerCase()
    );
    
    if (exists) {
      form.setFieldMeta('label', meta => ({
        ...meta,
        errors: ['An entry with this label already exists in this index'],
      }));
      return;
    }
    
    // Create entry
    const entry = onCreate({
      indexType,
      label: value.label.trim(),
      parentId: value.parentId,
      metadata: {
        aliases: value.aliases
          .split(',')
          .map(s => s.trim())
          .filter(Boolean),
      },
    });
    
    onClose();
  },
});
```

### Form Fields

**Label Field (required):**
```typescript
<form.Field
  name="label"
  validators={{
    onSubmit: ({ value }) => {
      if (!value || !value.trim()) {
        return 'Label is required';
      }
      return undefined;
    },
  }}
>
  {(field) => (
    <FormInput
      field={field}
      label="Label"
      placeholder="Entry name"
    />
  )}
</form.Field>
```

**Parent Entry Field (optional):**
```typescript
<form.Field name="parentId">
  {(field) => (
    <Field>
      <FieldLabel htmlFor="parentId">Parent Entry (optional)</FieldLabel>
      <Select
        value={field.state.value ?? ''}
        onValueChange={(value) => {
          field.handleChange(value === '' ? null : value);
        }}
      >
        <SelectTrigger id="parentId" className="w-full">
          <SelectValue placeholder="None (top-level)" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">None (top-level)</SelectItem>
          {availableParents.map(entry => (
            <SelectItem key={entry.id} value={entry.id}>
              {getEntryDisplayLabel(entry, existingEntries)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  )}
</form.Field>
```

**Aliases Field (optional):**
```typescript
<form.Field name="aliases">
  {(field) => (
    <FormInput
      field={field}
      label="Aliases (optional)"
      placeholder="Kant, I.; Emmanuel Kant"
    />
  )}
</form.Field>
```

## Parent Entry Logic

**Filter available parents:**
- Only show entries from same index type
- Exclude entries that would create circular references
- Show hierarchy in dropdown (indent children)

```typescript
const getAvailableParents = ({
  entries,
  indexType,
  excludeId,
}: {
  entries: IndexEntry[];
  indexType: string;
  excludeId?: string;
}): IndexEntry[] => {
  // Filter to same index type
  let filtered = entries.filter(e => e.indexType === indexType);
  
  // Exclude self (when editing)
  if (excludeId) {
    filtered = filtered.filter(e => e.id !== excludeId);
    
    // Exclude descendants to prevent circular references
    const descendants = getDescendants({ entries, parentId: excludeId });
    const descendantIds = new Set(descendants.map(d => d.id));
    filtered = filtered.filter(e => !descendantIds.has(e.id));
  }
  
  return filtered;
};

const getDescendants = ({
  entries,
  parentId,
}: {
  entries: IndexEntry[];
  parentId: string;
}): IndexEntry[] => {
  const children = entries.filter(e => e.parentId === parentId);
  const grandchildren = children.flatMap(child =>
    getDescendants({ entries, parentId: child.id })
  );
  return [...children, ...grandchildren];
};
```

## Display Logic

**Entry label with hierarchy:**
```typescript
const getEntryDisplayLabel = ({
  entry,
  entries,
}: {
  entry: IndexEntry;
  entries: IndexEntry[];
}): string => {
  if (!entry.parentId) return entry.label;
  
  const parent = entries.find(e => e.id === entry.parentId);
  if (!parent) return entry.label;
  
  const parentLabel = getEntryDisplayLabel({ entry: parent, entries });
  return `${parentLabel} → ${entry.label}`;
};
```

## Modal Layout

```tsx
<Modal
  open={open}
  onClose={onClose}
  title="Create Index Entry"
  size="md"
  footer={
    <>
      <Button variant="outline" onClick={onClose}>
        Cancel
      </Button>
      <Button
        variant="default"
        onClick={() => form.handleSubmit()}
        disabled={form.state.isSubmitting}
      >
        Create
      </Button>
    </>
  }
>
  <form
    onSubmit={(e) => {
      e.preventDefault();
      form.handleSubmit();
    }}
    className="space-y-4"
  >
    {/* Form fields */}
  </form>
</Modal>
```

## Validation Rules

1. **Label:**
   - Required
   - Must be unique within index type (case-insensitive)
   - Trimmed before validation

2. **Parent:**
   - Optional
   - Must be from same index type
   - Cannot create circular references

3. **Aliases:**
   - Optional
   - Comma-separated
   - Trimmed and filtered

## Storybook Tests

### Documentation Story

```typescript
export const Default: Story = {
  args: {
    open: true,
    indexType: 'subject',
    existingEntries: mockSubjectEntries,
    onCreate: (entry) => {
      console.log('Created entry:', entry);
      return { ...entry, id: crypto.randomUUID() };
    },
    onClose: () => console.log('Closed'),
  },
};
```

### Interaction Tests

```typescript
export const CreateTopLevelEntry: Story = {
  args: Default.args,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    
    await step('Fill label field', async () => {
      const labelInput = canvas.getByLabelText('Label');
      await userEvent.type(labelInput, 'New Entry');
    });
    
    await step('Click create button', async () => {
      const createButton = canvas.getByRole('button', { name: 'Create' });
      await userEvent.click(createButton);
    });
  },
};

export const ValidateUniqueLabel: Story = {
  args: Default.args,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    
    await step('Enter existing label', async () => {
      const labelInput = canvas.getByLabelText('Label');
      await userEvent.type(labelInput, 'Philosophy'); // Exists in mock data
    });
    
    await step('Submit form', async () => {
      const createButton = canvas.getByRole('button', { name: 'Create' });
      await userEvent.click(createButton);
    });
    
    await step('Verify error message', async () => {
      await waitFor(() => {
        const error = canvas.getByText(/already exists/i);
        expect(error).toBeInTheDocument();
      });
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
    viewport: { value: 'mobile1', isRotated: true }, // 667x375
  },
};

export const FilledState: Story = {
  args: Default.args,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText('Label'), 'New Entry');
    await userEvent.type(canvas.getByLabelText(/Aliases/i), 'Alias 1, Alias 2');
  },
  globals: {
    ...defaultGlobals,
    viewport: { value: 'mobile1', isRotated: true },
  },
};

export const ErrorState: Story = {
  args: Default.args,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const createButton = canvas.getByRole('button', { name: 'Create' });
    await userEvent.click(createButton); // Submit empty form
  },
  globals: {
    ...defaultGlobals,
    viewport: { value: 'mobile1', isRotated: true },
  },
};
```

## Files to Create

- `apps/index-pdf-frontend/src/app/projects/[projectDir]/editor/_components/entry-creation-modal/index.ts`
- `apps/index-pdf-frontend/src/app/projects/[projectDir]/editor/_components/entry-creation-modal/entry-creation-modal.tsx`
- `apps/index-pdf-frontend/src/app/projects/[projectDir]/editor/_components/entry-creation-modal/stories/entry-creation-modal.stories.tsx`
- `apps/index-pdf-frontend/src/app/projects/[projectDir]/editor/_components/entry-creation-modal/stories/tests/interaction-tests.stories.tsx`
- `apps/index-pdf-frontend/src/app/projects/[projectDir]/editor/_components/entry-creation-modal/stories/tests/visual-regression-tests.stories.tsx`

## Success Criteria

- ✅ Modal opens/closes correctly
- ✅ Label field validates uniqueness within index type
- ✅ Parent selection shows only same-index-type entries
- ✅ Aliases split and trimmed correctly
- ✅ onCreate callback receives correct entry data
- ✅ Comprehensive test coverage

## Next Task

[Task 4D-3: Entry Picker Component](./task-4d-3-entry-picker.md)
