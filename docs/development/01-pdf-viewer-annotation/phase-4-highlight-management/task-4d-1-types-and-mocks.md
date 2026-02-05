# Task 4D-1: Types and Mock Data

**Duration:** 30 minutes  
**Status:** ✅ Complete (Feb 3, 2026)  
**Dependencies:** Task 4C completion

## Goal

Define IndexEntry and IndexType types, create comprehensive mock data for testing the UI components.

## Type Definitions

### IndexEntry Type

```typescript
// apps/index-pdf-frontend/src/app/projects/[projectDir]/editor/_types/index-entry.ts

type IndexEntry = {
  id: string;
  indexType: string; // 'subject' | 'author' | 'scripture' | 'context'
  label: string; // "Kant, Immanuel"
  parentId: string | null; // For hierarchy within same index type
  metadata?: {
    aliases?: string[]; // ["Kant, I.", "Emmanuel Kant"]
    sortKey?: string; // For alphabetization
  };
};
```

**Key Points:**
- Each entry belongs to exactly ONE index type
- `parentId` references another entry in the SAME index type only
- Hierarchy is per-index-type (Subject hierarchy separate from Author hierarchy)

### IndexType Type

```typescript
// apps/index-pdf-frontend/src/app/projects/[projectDir]/editor/_types/index-type.ts

type IndexType = {
  id: string;
  name: string; // 'subject', 'author', 'scripture', 'context'
  label: string; // 'Subject Index', 'Author Index', etc.
  color: string; // Hex color, user-customizable
  ordinal: number; // For default color assignment and display order
  visible: boolean; // Can be hidden by user
};
```

**Default Color Assignment:**
```typescript
const DEFAULT_COLORS = ['#FCD34D', '#93C5FD', '#86EFAC', '#FCA5A5']; // Yellow, Blue, Green, Red

const assignDefaultColor = ({ ordinal }: { ordinal: number }): string => {
  if (ordinal < DEFAULT_COLORS.length) {
    return DEFAULT_COLORS[ordinal];
  }
  // Generate color for additional index types using golden angle
  const hue = (ordinal * 137) % 360;
  return `hsl(${hue}, 70%, 50%)`;
};
```

## Mock Data Structure

### Mock IndexTypes

```typescript
const mockIndexTypes: IndexType[] = [
  {
    id: 'idx-type-subject',
    name: 'subject',
    label: 'Subject Index',
    color: '#FCD34D', // Yellow
    ordinal: 0,
    visible: true,
  },
  {
    id: 'idx-type-author',
    name: 'author',
    label: 'Author Index',
    color: '#93C5FD', // Blue
    ordinal: 1,
    visible: true,
  },
  {
    id: 'idx-type-scripture',
    name: 'scripture',
    label: 'Scripture Index',
    color: '#86EFAC', // Green
    ordinal: 2,
    visible: true,
  },
  {
    id: 'idx-type-context',
    name: 'context',
    label: 'Contexts',
    color: '#FCA5A5', // Red
    ordinal: 3,
    visible: true,
  },
];
```

### Mock IndexEntries

**Subject Index Entries (with hierarchy):**
```typescript
const mockSubjectEntries: IndexEntry[] = [
  // Top-level categories
  {
    id: 'entry-subject-1',
    indexType: 'subject',
    label: 'Philosophy',
    parentId: null,
  },
  {
    id: 'entry-subject-2',
    indexType: 'subject',
    label: 'Science',
    parentId: null,
  },
  
  // Philosophy children
  {
    id: 'entry-subject-3',
    indexType: 'subject',
    label: 'Kant, Immanuel',
    parentId: 'entry-subject-1',
    metadata: {
      aliases: ['Kant, I.', 'Emmanuel Kant'],
    },
  },
  {
    id: 'entry-subject-4',
    indexType: 'subject',
    label: 'Hegel, G.W.F.',
    parentId: 'entry-subject-1',
    metadata: {
      aliases: ['Hegel', 'Georg Wilhelm Friedrich Hegel'],
    },
  },
  {
    id: 'entry-subject-5',
    indexType: 'subject',
    label: 'Ancient Philosophy',
    parentId: 'entry-subject-1',
  },
  
  // Ancient Philosophy children (grandchildren of Philosophy)
  {
    id: 'entry-subject-6',
    indexType: 'subject',
    label: 'Plato',
    parentId: 'entry-subject-5',
  },
  {
    id: 'entry-subject-7',
    indexType: 'subject',
    label: 'Aristotle',
    parentId: 'entry-subject-5',
  },
  
  // Science children
  {
    id: 'entry-subject-8',
    indexType: 'subject',
    label: 'Physics',
    parentId: 'entry-subject-2',
  },
  {
    id: 'entry-subject-9',
    indexType: 'subject',
    label: 'Biology',
    parentId: 'entry-subject-2',
  },
];
```

**Author Index Entries:**
```typescript
const mockAuthorEntries: IndexEntry[] = [
  // Different hierarchy than Subject index
  {
    id: 'entry-author-1',
    indexType: 'author',
    label: 'German Authors',
    parentId: null,
  },
  {
    id: 'entry-author-2',
    indexType: 'author',
    label: 'Greek Authors',
    parentId: null,
  },
  
  // German Authors children
  {
    id: 'entry-author-3',
    indexType: 'author',
    label: 'Kant, Immanuel', // Same name as Subject entry, but different hierarchy
    parentId: 'entry-author-1',
    metadata: {
      aliases: ['Kant, I.'],
    },
  },
  {
    id: 'entry-author-4',
    indexType: 'author',
    label: 'Hegel, G.W.F.',
    parentId: 'entry-author-1',
  },
  
  // Greek Authors children
  {
    id: 'entry-author-5',
    indexType: 'author',
    label: 'Plato',
    parentId: 'entry-author-2',
  },
  {
    id: 'entry-author-6',
    indexType: 'author',
    label: 'Aristotle',
    parentId: 'entry-author-2',
  },
];
```

**Scripture Index Entries:**
```typescript
const mockScriptureEntries: IndexEntry[] = [
  {
    id: 'entry-scripture-1',
    indexType: 'scripture',
    label: 'Old Testament',
    parentId: null,
  },
  {
    id: 'entry-scripture-2',
    indexType: 'scripture',
    label: 'New Testament',
    parentId: null,
  },
  {
    id: 'entry-scripture-3',
    indexType: 'scripture',
    label: 'Genesis',
    parentId: 'entry-scripture-1',
  },
  {
    id: 'entry-scripture-4',
    indexType: 'scripture',
    label: 'Exodus',
    parentId: 'entry-scripture-1',
  },
  {
    id: 'entry-scripture-5',
    indexType: 'scripture',
    label: 'Matthew',
    parentId: 'entry-scripture-2',
  },
  {
    id: 'entry-scripture-6',
    indexType: 'scripture',
    label: 'John',
    parentId: 'entry-scripture-2',
  },
];
```

## Implementation Steps

1. **Create type files:**
   - `_types/index-entry.ts`
   - `_types/index-type.ts`

2. **Add mock data to editor:**
   - Create `_mocks/index-entries.ts` with all mock entries
   - Create `_mocks/index-types.ts` with mock configurations
   - Import in `editor.tsx`

3. **Add state management:**
   ```typescript
   const [indexTypes, setIndexTypes] = useState<IndexType[]>(mockIndexTypes);
   const [indexEntries, setIndexEntries] = useState<IndexEntry[]>([
     ...mockSubjectEntries,
     ...mockAuthorEntries,
     ...mockScriptureEntries,
   ]);
   ```

4. **Update existing Mention type:**
   - Add `indexTypes: string[]` if not present
   - Ensure mentions reference entries by `entryId`

5. **Utility functions:**
   ```typescript
   // Get entries for specific index type
   const getEntriesForType = ({ entries, indexType }: { 
     entries: IndexEntry[];
     indexType: string;
   }): IndexEntry[] => {
     return entries.filter(e => e.indexType === indexType);
   };
   
   // Get children of a parent entry
   const getChildEntries = ({ entries, parentId }: {
     entries: IndexEntry[];
     parentId: string | null;
   }): IndexEntry[] => {
     return entries.filter(e => e.parentId === parentId);
   };
   
   // Find entry by exact label or alias match
   const findEntryByText = ({ entries, text }: {
     entries: IndexEntry[];
     text: string;
   }): IndexEntry | null => {
     const normalized = text.trim().toLowerCase();
     
     return entries.find(entry => {
       if (entry.label.toLowerCase() === normalized) return true;
       const aliases = entry.metadata?.aliases || [];
       return aliases.some(alias => alias.toLowerCase() === normalized);
     }) || null;
   };
   ```

## Files to Create/Update

- `apps/index-pdf-frontend/src/app/projects/[projectDir]/editor/_types/index-entry.ts` (new)
- `apps/index-pdf-frontend/src/app/projects/[projectDir]/editor/_types/index-type.ts` (new)
- `apps/index-pdf-frontend/src/app/projects/[projectDir]/editor/_mocks/index-entries.ts` (new)
- `apps/index-pdf-frontend/src/app/projects/[projectDir]/editor/_mocks/index-types.ts` (new)
- `apps/index-pdf-frontend/src/app/projects/[projectDir]/editor/editor.tsx` (update)

## Success Criteria

- ✅ IndexEntry and IndexType types defined
- ✅ Mock data includes diverse hierarchy examples
- ✅ Same labels appear in different index types (Kant in Subject vs Author)
- ✅ Utility functions for common queries
- ✅ Editor component has access to mock data via state

## Next Task

[Task 4D-2: Entry Creation Modal](./task-4d-2-entry-creation-modal.md)
