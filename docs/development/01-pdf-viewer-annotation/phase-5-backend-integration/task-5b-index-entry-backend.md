# Task 5B: IndexEntry Backend

**Duration:** 2 days  
**Status:** ⚪ Not Started  
**Dependencies:** Task 5A completion (schema migration)

## Overview

Implement IndexEntry CRUD operations with index_type filtering, hierarchy management, search/autocomplete, and exact match detection for smart mention creation.

**Key Features:**
- Entry CRUD filtered by index_type
- Parent/child hierarchy within same index type
- Search and autocomplete with alias support
- Exact match detection for auto-population
- Bulk operations for reordering

## tRPC Endpoints

### Router: `indexEntry`

```typescript
// apps/index-pdf-backend/src/routers/index-entry.router.ts

export const indexEntryRouter = router({
  // List entries for project (filtered by index type)
  list: protectedProcedure
    .input(z.object({
      projectId: z.string().uuid(),
      indexTypeId: z.string().uuid().optional(), // Filter by type
      includeDeleted: z.boolean().optional(),
    }))
    .query(async ({ input, ctx }) => {
      return await ctx.db.query(e.select(e.IndexEntry, (entry) => ({
        ...e.IndexEntry['*'],
        index_type: { id: true, name: true, color: true },
        parent: { id: true, label: true },
        mention_count: true,
        child_count: true,
        filter: e.op(
          e.op(entry.project.id, '=', e.uuid(input.projectId)),
          'and',
          input.indexTypeId 
            ? e.op(entry.index_type.id, '=', e.uuid(input.indexTypeId))
            : e.bool(true),
          'and',
          input.includeDeleted
            ? e.bool(true)
            : e.op('not', e.op('exists', entry.deleted_at))
        ),
        order_by: [
          { expression: entry.parent.id, direction: e.ASC, empty: e.FIRST },
          { expression: entry.label, direction: e.ASC },
        ],
      })));
    }),
  
  // Create new entry
  create: protectedProcedure
    .input(z.object({
      projectId: z.string().uuid(),
      indexTypeId: z.string().uuid(),
      label: z.string().min(1).max(200),
      slug: z.string().min(1).max(200),
      parentId: z.string().uuid().optional(),
      aliases: z.array(z.string()).optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Validate unique slug per project + index_type
      // Validate parent has same index_type
      // Prevent cycles in hierarchy
      // Create entry with metadata.aliases
      // Return created entry
    }),
  
  // Update entry (label, description, aliases)
  update: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      label: z.string().min(1).max(200).optional(),
      description: z.string().optional(),
      aliases: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Validate ownership
      // Update fields (slug immutable)
      // Increment revision
      // Return updated entry
    }),
  
  // Update parent (move in hierarchy)
  updateParent: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      parentId: z.string().uuid().optional(), // null = top level
    }))
    .mutation(async ({ input, ctx }) => {
      // Validate ownership
      // Validate parent has same index_type
      // Prevent cycles (traverse ancestors)
      // Update parent link
      // Return updated entry
    }),
  
  // Reorder entries (within same parent)
  reorder: protectedProcedure
    .input(z.object({
      indexTypeId: z.string().uuid(),
      parentId: z.string().uuid().optional(),
      order: z.array(z.string().uuid()), // Entry IDs in new order
    }))
    .mutation(async ({ input, ctx }) => {
      // Update sort_key fields based on order
      // Used for drag-drop reordering in UI
    }),
  
  // Search/autocomplete entries
  search: protectedProcedure
    .input(z.object({
      projectId: z.string().uuid(),
      indexTypeId: z.string().uuid(),
      query: z.string().min(1),
      limit: z.number().int().min(1).max(100).optional().default(20),
    }))
    .query(async ({ input, ctx }) => {
      // Full-text search on label
      // Search aliases (in metadata.aliases array)
      // Return ranked results with match info
    }),
  
  // Check exact match (for auto-population during mention creation)
  checkExactMatch: protectedProcedure
    .input(z.object({
      projectId: z.string().uuid(),
      indexTypeId: z.string().uuid(),
      text: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      const normalized = input.text.trim().toLowerCase();
      
      // Find entry where:
      // - label matches (case-insensitive)
      // - OR any alias matches (case-insensitive)
      
      return await ctx.db.query(e.select(e.IndexEntry, (entry) => ({
        ...e.IndexEntry['*'],
        filter: e.op(
          e.op(entry.project.id, '=', e.uuid(input.projectId)),
          'and',
          e.op(entry.index_type.id, '=', e.uuid(input.indexTypeId)),
          'and',
          // Exact match logic (label or aliases)
          // Note: EdgeQL syntax for case-insensitive match
          e.op(
            e.op(e.str_lower(entry.label), '=', normalized),
            'or',
            // Check if any alias matches
            // (Requires JSON query on metadata.aliases)
          ),
        ),
        limit: 1,
      })));
    }),
  
  // Delete entry (soft delete)
  delete: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      cascadeToChildren: z.boolean().optional().default(false),
    }))
    .mutation(async ({ input, ctx }) => {
      // Validate ownership
      // If has children and !cascadeToChildren, reject or move to parent
      // If mentions exist, confirm with user
      // Set deleted_at timestamp
      // If cascade, delete children recursively
    }),
});
```

## Hierarchy Management

### Preventing Cycles

```typescript
// Utility function to check for cycles before setting parent
async function wouldCreateCycle({
  entryId,
  newParentId,
  db,
}: {
  entryId: string;
  newParentId: string;
  db: EdgeDBClient;
}): Promise<boolean> {
  // Traverse up from newParentId to root
  // If we encounter entryId in the path, it would create a cycle
  
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
    
    // Get parent of current
    const entry = await db.querySingle(
      e.select(e.IndexEntry, () => ({
        filter_single: { id: currentId },
        parent: { id: true },
      }))
    );
    
    currentId = entry?.parent?.id || null;
  }
  
  return false; // No cycle
}
```

### Depth Limiting

```typescript
// Optionally enforce maximum depth (e.g., 5 levels)
async function getDepth({
  entryId,
  db,
}: {
  entryId: string;
  db: EdgeDBClient;
}): Promise<number> {
  let depth = 0;
  let currentId: string | null = entryId;
  
  while (currentId && depth < 10) { // Safety limit
    const entry = await db.querySingle(
      e.select(e.IndexEntry, () => ({
        filter_single: { id: currentId },
        parent: { id: true },
      }))
    );
    
    if (!entry?.parent) break;
    
    currentId = entry.parent.id;
    depth++;
  }
  
  return depth;
}

// In updateParent mutation:
const newDepth = await getDepth({ entryId: input.parentId, db });
if (newDepth >= 5) {
  throw new TRPCError({
    code: 'BAD_REQUEST',
    message: 'Maximum hierarchy depth (5 levels) exceeded',
  });
}
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

## Testing Requirements

- [ ] Entry CRUD operations work
- [ ] Index type filtering works correctly
- [ ] Parent must have same index_type (enforced)
- [ ] Cycle detection prevents invalid hierarchy
- [ ] Depth limit prevents overly deep trees
- [ ] Search finds entries by label and aliases
- [ ] Exact match detects case-insensitive matches
- [ ] Drag-drop reordering persists correctly
- [ ] Soft delete preserves history
- [ ] Cascade delete works when requested
- [ ] Performance acceptable with 1000+ entries

## Implementation Checklist

### Backend
- [ ] Create `indexEntry` tRPC router
- [ ] Implement `list` with index_type filtering
- [ ] Implement `create` with validation
- [ ] Implement `update` (label, aliases)
- [ ] Implement `updateParent` with cycle detection
- [ ] Implement `reorder` for drag-drop
- [ ] Implement `search` with alias support
- [ ] Implement `checkExactMatch` for autocomplete
- [ ] Implement `delete` with cascade option
- [ ] Add access control checks
- [ ] Write unit tests

### Frontend
- [ ] Create entry list components per index type
- [ ] Add tree rendering with indentation
- [ ] Implement drag-drop for hierarchy
- [ ] Add create entry modal
- [ ] Add edit entry modal
- [ ] Connect exact match to mention creation
- [ ] Add loading and error states
- [ ] Add confirmation dialogs for delete

### Validation
- [ ] Test hierarchy operations thoroughly
- [ ] Test cycle prevention
- [ ] Test exact match with various cases
- [ ] Test search with aliases
- [ ] Test performance with many entries
- [ ] Test concurrent edits

---

## Next Task

[Task 5C: IndexMention Backend](./task-5c-index-mention-backend.md) - Build mention CRUD with multi-type support and bulk operations.
