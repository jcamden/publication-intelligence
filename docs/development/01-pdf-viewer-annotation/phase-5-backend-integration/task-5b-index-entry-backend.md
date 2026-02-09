# Task 5B: IndexEntry Backend

**Duration:** 2 days  
**Status:** ✅ Complete  
**Dependencies:** Task 5A completion (schema migration)

## Overview

Implemented IndexEntry CRUD operations with index_type filtering, hierarchy management, search/autocomplete, and exact match detection for smart mention creation.

**Key Features Delivered:**
- ✅ Entry CRUD filtered by index_type (projectIndexTypeId)
- ✅ Parent/child hierarchy within same index type
- ✅ Search and autocomplete with variant (alias) support
- ✅ Exact match detection for auto-population
- ✅ Cycle prevention and depth limiting (5 levels max)
- ✅ Soft delete with optional cascade to children
- ✅ Row-level security via Drizzle transactions
- ✅ Comprehensive integration tests (25 tests passing)

**Implementation Notes:**
- Uses **Drizzle ORM with PostgreSQL** (not EdgeDB as originally planned)
- Variants stored in separate **`indexVariants`** table (not JSON metadata)
- Reorder endpoint **skipped** (no `sort_key` field in schema - client-side sorting)
- All queries enforce RLS via `withUserContext` transaction wrapper

## Implementation Files

### Module Structure

```
apps/index-pdf-backend/src/modules/index-entry/
├── index-entry.types.ts              # TypeScript types & Zod schemas
├── index-entry.utils.ts              # Hierarchy utilities (cycle detection, depth)
├── index-entry.repo.ts               # Database operations (Drizzle ORM)
├── index-entry.service.ts            # Business logic & validation
├── index-entry.router.ts             # tRPC endpoints
└── index-entry.integration.test.ts   # Integration tests (25 tests)
```

### Router Registration

```typescript
// apps/index-pdf-backend/src/routers/index.ts
export const appRouter = router({
  auth: authRouter,
  indexEntry: indexEntryRouter,        // ← Registered here
  project: projectRouter,
  projectIndexType: projectIndexTypeRouter,
  sourceDocument: sourceDocumentRouter,
  user: userRouter,
});
```

## tRPC Endpoints

### Router: `indexEntry`

**Location:** `apps/index-pdf-backend/src/modules/index-entry/index-entry.router.ts`

All endpoints enforce RLS via `withUserContext` and log events.

#### `list` - List entries with filtering

```typescript
input: {
  projectId: string;              // Required
  projectIndexTypeId?: string;    // Optional filter by index type
  includeDeleted?: boolean;       // Default: false
}

output: IndexEntryListItem[] {
  id, slug, label, description, status, parentId,
  parent: { id, label } | null,
  projectIndexType: { id, indexType, colorHue },
  mentionCount: number,           // Count of mentions
  childCount: number,             // Count of children
  variants: IndexVariant[],       // Aliases from indexVariants table
  createdAt, updatedAt
}
```

**Features:**
- Filters by `projectIndexTypeId` if provided
- Includes `mentionCount` and `childCount` aggregations
- Excludes soft-deleted entries by default
- Orders by parent ID then label
- Returns variants from `indexVariants` table

#### `create` - Create new entry

```typescript
input: {
  projectId: string;
  projectIndexTypeId: string;
  label: string;                  // 1-200 chars
  slug: string;                   // 1-200 chars, immutable after creation
  parentId?: string;              // Optional parent entry ID
  variants?: string[];            // Aliases (stored in indexVariants table)
  description?: string;
}

output: IndexEntry
```

**Validation:**
- Parent must have same `projectIndexTypeId`
- Parent depth must be < 5 (enforces 5-level max hierarchy)
- Creates variants in separate `indexVariants` table

#### `update` - Update entry details

```typescript
input: {
  id: string;
  label?: string;                 // 1-200 chars
  description?: string | null;
  variants?: string[];            // Replaces all variants
}

output: IndexEntry
```

**Features:**
- Slug is immutable (not updatable)
- Increments `revision` field
- Variants are replaced (delete old, insert new)

#### `updateParent` - Move entry in hierarchy

```typescript
input: {
  id: string;
  parentId?: string | null;       // null = move to top level
}

output: IndexEntry
```

**Validation:**
- Prevents cycles (traverses ancestry)
- Parent must have same `projectIndexTypeId`
- New parent depth must be < 5

#### `search` - Full-text search

```typescript
input: {
  projectId: string;
  projectIndexTypeId: string;
  query: string;                  // Min 1 char
  limit?: number;                 // Default: 20, max: 100
}

output: IndexEntrySearchResult[] {
  id, label, slug, description, parentId,
  parent: { id, label } | null,
  variants: IndexVariant[],
  matchType: "label" | "variant",
  matchedText?: string            // For variant matches
}
```

**Features:**
- Case-insensitive ILIKE search on label
- Searches variants via LEFT JOIN
- Returns match type and matched text
- Label matches ranked before variant matches

#### `checkExactMatch` - Autocomplete helper

```typescript
input: {
  projectId: string;
  projectIndexTypeId: string;
  text: string;                   // Trimmed & lowercased
}

output: IndexEntry | null
```

**Features:**
- Case-insensitive exact match on label OR any variant
- Trims whitespace automatically
- Returns null if no exact match found
- Used for smart mention auto-population

#### `delete` - Soft delete entry

```typescript
input: {
  id: string;
  cascadeToChildren?: boolean;    // Default: false
}

output: IndexEntry                // With deletedAt timestamp
```

**Validation:**
- Rejects if entry has children (unless `cascadeToChildren=true`)
- Recursively soft-deletes all descendants when cascading
- Sets `deletedAt` timestamp (preserves history)

#### `reorder` - ❌ NOT IMPLEMENTED

The reorder endpoint was skipped because:
- Schema has no `sort_key` field
- Client-side sorting is sufficient for MVP
- Can be added later if drag-drop persistence is needed

## Hierarchy Management

**Location:** `apps/index-pdf-backend/src/modules/index-entry/index-entry.utils.ts`

### Preventing Cycles

```typescript
/**
 * Check if setting a new parent would create a cycle in the hierarchy.
 * Traverses up from the new parent to root, checking if we encounter the entry itself.
 */
export const wouldCreateCycle = async ({
  entryId,
  newParentId,
  tx,
}: {
  entryId: string;
  newParentId: string;
  tx: DbTransaction;
}): Promise<boolean> => {
  let currentId: string | null = newParentId;
  const visited = new Set<string>();

  while (currentId) {
    if (currentId === entryId) {
      return true; // Cycle detected
    }

    if (visited.has(currentId)) {
      throw new Error('Existing cycle detected in hierarchy');
    }

    visited.add(currentId);

    // Get parent of current entry using Drizzle
    const entry = await tx
      .select({ parentId: indexEntries.parentId })
      .from(indexEntries)
      .where(eq(indexEntries.id, currentId))
      .limit(1);

    currentId = entry.length > 0 ? entry[0].parentId : null;
  }

  return false; // No cycle
};
```

**Usage in `updateParent`:**
```typescript
if (input.parentId) {
  await db.transaction(async (tx) => {
    const cycle = await wouldCreateCycle({
      entryId: input.id,
      newParentId: input.parentId,
      tx,
    });

    if (cycle) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Setting this parent would create a cycle in the hierarchy',
      });
    }
    // ... continue with update
  });
}
```

### Depth Limiting

```typescript
/**
 * Get the depth of an entry in the hierarchy (how many ancestors it has).
 * Top-level entries have depth 0.
 */
export const getDepth = async ({
  entryId,
  tx,
}: {
  entryId: string;
  tx: DbTransaction;
}): Promise<number> => {
  let depth = 0;
  let currentId: string | null = entryId;
  const maxDepth = 10; // Safety limit

  while (currentId && depth < maxDepth) {
    const entry = await tx
      .select({ parentId: indexEntries.parentId })
      .from(indexEntries)
      .where(eq(indexEntries.id, currentId))
      .limit(1);

    if (entry.length === 0 || !entry[0].parentId) {
      break;
    }

    currentId = entry[0].parentId;
    depth++;
  }

  return depth;
};
```

**Usage in `create` and `updateParent`:**
```typescript
const depth = await getDepth({ entryId: parentId, tx });
if (depth >= 4) {  // Parent is at depth 4, child would be at depth 5
  throw new TRPCError({
    code: 'BAD_REQUEST',
    message: 'Maximum hierarchy depth (5 levels) exceeded',
  });
}
```

**Note:** Depth check validates parent is at depth < 5, so child will be at depth ≤ 5.

### Parent Type Validation

```typescript
/**
 * Validate that a parent has the specified projectIndexTypeId.
 * Ensures parent and child belong to the same index type.
 */
export const validateParentIndexType = async ({
  projectIndexTypeId,
  parentId,
  tx,
}: {
  projectIndexTypeId: string;
  parentId: string;
  tx: DbTransaction;
}): Promise<boolean> => {
  const parent = await tx
    .select({ projectIndexTypeId: indexEntries.projectIndexTypeId })
    .from(indexEntries)
    .where(eq(indexEntries.id, parentId))
    .limit(1);

  if (parent.length === 0) {
    return false; // Parent doesn't exist
  }

  return parent[0].projectIndexTypeId === projectIndexTypeId;
};
```

## Frontend Integration

### Entry List with Hierarchy

```tsx
// apps/index-pdf-frontend/src/app/projects/[projectDir]/editor/_components/project-sidebar/components/project-subject-content.tsx

export const ProjectSubjectContent = () => {
  const { projectId } = useProject();
  const subjectTypeId = useSubjectIndexTypeId();
  
  // Query entries for Subject index
  const { data: entries, isLoading } = trpc.indexEntry.list.useQuery({
    projectId,
    indexTypeId: subjectTypeId,
  });
  
  // Mutations
  const createEntry = trpc.indexEntry.create.useMutation({
    onSuccess: () => {
      utils.indexEntry.list.invalidate({ projectId, indexTypeId: subjectTypeId });
    },
  });
  
  const updateParent = trpc.indexEntry.updateParent.useMutation({
    onSuccess: () => {
      utils.indexEntry.list.invalidate({ projectId, indexTypeId: subjectTypeId });
    },
  });
  
  // Render tree structure
  const renderTree = (entries: IndexEntry[], parentId: string | null = null, depth = 0) => {
    const children = entries.filter(e => e.parent?.id === parentId);
    
    return children.map(entry => (
      <div key={entry.id} style={{ paddingLeft: `${depth * 20}px` }}>
        <EntryItem
          entry={entry}
          onDragEnd={(droppedOn) => {
            updateParent.mutate({
              id: entry.id,
              parentId: droppedOn.id,
            });
          }}
        />
        {renderTree(entries, entry.id, depth + 1)}
      </div>
    ));
  };
  
  return (
    <div>
      <button onClick={() => setCreateModalOpen(true)}>
        Create Entry
      </button>
      {renderTree(entries || [])}
    </div>
  );
};
```

### Exact Match Autocomplete

```tsx
// apps/index-pdf-frontend/src/app/projects/[projectDir]/editor/_components/mention-creation-popover/mention-creation-popover.tsx

export const MentionCreationPopover = ({ draft }: Props) => {
  const { projectId } = useProject();
  const currentIndexType = useCurrentIndexType(); // From active sidebar section
  
  const [selectedEntry, setSelectedEntry] = useState<IndexEntry | null>(null);
  
  // Check for exact match on mount
  const { data: exactMatch } = trpc.indexEntry.checkExactMatch.useQuery({
    projectId,
    indexTypeId: currentIndexType.id,
    text: draft.text,
  }, {
    enabled: !!draft.text,
  });
  
  // Auto-populate if exact match found
  useEffect(() => {
    if (exactMatch && !selectedEntry) {
      setSelectedEntry(exactMatch);
      setInputValue(exactMatch.label);
    }
  }, [exactMatch]);
  
  // ... rest of component
};
```

## Testing

**Location:** `apps/index-pdf-backend/src/modules/index-entry/index-entry.integration.test.ts`

**Status:** ✅ All 25 tests passing

### Test Coverage

#### CREATE Operations
- ✅ Create entry with basic fields
- ✅ Create entry with variants (aliases)
- ✅ Create entry with parent
- ✅ Reject parent from different index type
- ✅ Require authentication

#### LIST Operations
- ✅ List all entries for project
- ✅ Filter by index type
- ✅ Exclude deleted entries by default
- ✅ Include deleted entries when requested

#### UPDATE Operations
- ✅ Update entry label
- ✅ Update variants
- ✅ Slug immutability (not changed)
- ✅ Update entry parent
- ✅ Detect cycles in hierarchy
- ✅ Enforce max depth (5 levels)

#### SEARCH Operations
- ✅ Search by label (partial match)
- ✅ Search by variant (partial match)
- ✅ Respect limit parameter

#### EXACT MATCH Operations
- ✅ Match exact label (case-insensitive)
- ✅ Match exact variant (case-insensitive)
- ✅ Return null for partial match
- ✅ Trim whitespace

#### DELETE Operations
- ✅ Soft delete entry
- ✅ Reject delete if entry has children
- ✅ Cascade delete children when requested

### Test Helpers

**Factory Functions Added:**
```typescript
// apps/index-pdf-backend/src/test/factories.ts
export const createTestProjectIndexType = async ({ ... });
export const createTestIndexEntry = async ({ ... });
```

## Implementation Status

### Backend ✅ Complete
- ✅ Create `indexEntry` tRPC router
- ✅ Implement `list` with index_type filtering
- ✅ Implement `create` with validation
- ✅ Implement `update` (label, variants)
- ✅ Implement `updateParent` with cycle detection
- ❌ Implement `reorder` for drag-drop (skipped - no schema support)
- ✅ Implement `search` with variant support
- ✅ Implement `checkExactMatch` for autocomplete
- ✅ Implement `delete` with cascade option
- ✅ Add access control checks (RLS via `withUserContext`)
- ✅ Write integration tests (25 tests passing)
- ✅ Register router in app router

### Frontend ⏳ Pending (Task 5D)
- [ ] Create entry list components per index type
- [ ] Add tree rendering with indentation
- [ ] Implement drag-drop for hierarchy
- [ ] Add create entry modal
- [ ] Add edit entry modal
- [ ] Connect exact match to mention creation
- [ ] Add loading and error states
- [ ] Add confirmation dialogs for delete

### Validation ✅ Complete
- ✅ Test hierarchy operations thoroughly
- ✅ Test cycle prevention
- ✅ Test exact match with various cases
- ✅ Test search with variants
- [ ] Test performance with many entries (deferred)
- [ ] Test concurrent edits (deferred)

---

## Architecture Decisions

### Why Drizzle ORM Instead of EdgeDB?

The codebase uses **Drizzle ORM with PostgreSQL**, not EdgeDB. All queries use Drizzle's query builder with type-safe operations.

### Why Separate `indexVariants` Table?

Originally planned to store variants in `metadata.aliases` JSON field. Instead, uses dedicated `indexVariants` table for:
- Better querying (no JSON operations needed)
- Referential integrity
- Individual variant metadata (type, revision)
- Easier full-text search

### Why Skip Reorder Endpoint?

Schema has no `sort_key` field for custom ordering. Client can sort entries by:
- `parentId` (group by parent)
- `label` (alphabetical)
- `createdAt` (chronological)

Drag-drop reordering can be added later if needed by adding `sort_key` field.

### Row-Level Security Pattern

All mutations use `withUserContext` to:
1. Set PostgreSQL session config: `request.jwt.claim.sub = userId`
2. Set role: `authenticated`
3. Execute queries (RLS policies enforce ownership)
4. Reset config and role

This ensures users can only access/modify their own project data.

---

## Next Task

[Task 5C: IndexMention Backend](./task-5c-index-mention-backend.md) - Build mention CRUD with multi-type support and bulk operations.
