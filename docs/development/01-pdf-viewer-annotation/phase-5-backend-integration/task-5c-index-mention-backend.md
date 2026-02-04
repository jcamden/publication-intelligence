# Task 5C: IndexMention Backend

**Duration:** 2-3 days  
**Status:** ⚪ Not Started  
**Dependencies:** Task 5B completion (IndexEntry backend)

## Overview

Implement IndexMention CRUD operations with multi-type support, page filtering, bulk operations for "Index As" feature, and adapter logic to convert between database and PDF viewer formats.

**Key Features:**
- Mention CRUD with multi-type tagging (`index_types` array)
- Page and index type filtering
- Bulk updateIndexTypes for multi-select operations
- Adapter: IndexMention → PdfHighlight with multi-color support
- Draft → IndexMention with proper coordinate preservation

## tRPC Endpoints

### Router: `indexMention`

```typescript
// apps/index-pdf-backend/src/routers/index-mention.router.ts

export const indexMentionRouter = router({
  // List mentions (filter by document, page, index types)
  list: protectedProcedure
    .input(z.object({
      projectId: z.string().uuid(),
      documentId: z.string().uuid().optional(),
      pageNumber: z.number().int().optional(),
      indexTypes: z.array(z.string()).optional(), // Filter by type
      includeDeleted: z.boolean().optional(),
    }))
    .query(async ({ input, ctx }) => {
      return await ctx.db.query(e.select(e.IndexMention, (mention) => ({
        ...e.IndexMention['*'],
        entry: {
          id: true,
          label: true,
          index_type: { id: true, name: true, color: true },
        },
        document: { id: true, title: true },
        page: { id: true, page_number: true },
        filter: e.op(
          e.op(mention.document.project.id, '=', e.uuid(input.projectId)),
          'and',
          input.documentId
            ? e.op(mention.document.id, '=', e.uuid(input.documentId))
            : e.bool(true),
          'and',
          input.pageNumber
            ? e.op(mention.page_number, '=', input.pageNumber)
            : e.bool(true),
          'and',
          input.indexTypes && input.indexTypes.length > 0
            ? e.op(
                // Check if any of the mention's index_types match input
                // EdgeQL array overlap operator
                e.op(mention.index_types, 'overlaps', e.array_unpack(input.indexTypes))
              )
            : e.bool(true),
          'and',
          input.includeDeleted
            ? e.bool(true)
            : e.op('not', e.op('exists', mention.deleted_at))
        ),
        order_by: [
          { expression: mention.page_number, direction: e.ASC },
          { expression: mention.created_at, direction: e.ASC },
        ],
      })));
    }),
  
  // Create new mention
  create: protectedProcedure
    .input(z.object({
      documentId: z.string().uuid(),
      entryId: z.string().uuid(),
      pageNumber: z.number().int().min(1),
      textSpan: z.string().min(1),
      bboxesPdf: z.array(z.object({
        x: z.number(),
        y: z.number(),
        width: z.number(),
        height: z.number(),
        rotation: z.number().optional(),
      })),
      indexTypes: z.array(z.string()).min(1), // At least one type
      mentionType: z.enum(['text', 'region']).optional().default('text'),
    }))
    .mutation(async ({ input, ctx }) => {
      // Validate entry belongs to at least one of the index types
      // Create mention with bboxes stored as PDF user space coords
      // Return created mention with full entry info
    }),
  
  // Update mention (change entry, text, or index types)
  update: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      entryId: z.string().uuid().optional(),
      textSpan: z.string().optional(), // For region mentions
      indexTypes: z.array(z.string()).min(1).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Validate ownership
      // Update fields
      // Return updated mention
    }),
  
  // Update index types (bulk operation for "Index As" feature)
  updateIndexTypes: protectedProcedure
    .input(z.object({
      mentionIds: z.array(z.string().uuid()).min(1),
      indexTypes: z.array(z.string()).min(1), // New set of types
      operation: z.enum(['replace', 'add', 'remove']),
    }))
    .mutation(async ({ input, ctx }) => {
      // Validate ownership for all mentions
      // Bulk update based on operation:
      // - replace: Set index_types = input.indexTypes
      // - add: Append to existing index_types (union)
      // - remove: Remove from existing index_types (difference)
      // Return updated mentions
    }),
  
  // Bulk create (for imports or batch operations)
  bulkCreate: protectedProcedure
    .input(z.object({
      mentions: z.array(z.object({
        documentId: z.string().uuid(),
        entryId: z.string().uuid(),
        pageNumber: z.number().int(),
        textSpan: z.string(),
        bboxesPdf: z.array(z.object({
          x: z.number(),
          y: z.number(),
          width: z.number(),
          height: z.number(),
        })),
        indexTypes: z.array(z.string()),
      })).min(1).max(100), // Limit batch size
    }))
    .mutation(async ({ input, ctx }) => {
      // Validate all entries exist
      // Bulk insert mentions
      // Return created mentions
    }),
  
  // Delete mention (soft delete)
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      // Validate ownership
      // Set deleted_at timestamp
      // Return success
    }),
});
```

## Application Adapters

### IndexMention → PdfHighlight (with multi-type colors)

```typescript
// apps/index-pdf-frontend/src/adapters/mention-to-highlight.adapter.ts

export const mentionToPdfHighlight = ({
  mention,
  projectIndexTypes,
}: {
  mention: IndexMention;
  projectIndexTypes: IndexType[];
}): PdfHighlight => {
  // Get colors for all index types this mention belongs to
  const colors = mention.index_types.map(typeName => {
    const indexType = projectIndexTypes.find(t => t.name === typeName);
    return indexType?.color || '#FCD34D'; // Fallback to yellow
  });
  
  return {
    id: mention.id,
    pageNumber: mention.page_number,
    bboxes: mention.bboxes, // Already in PDF user space
    label: mention.entry?.label || 'Unlabeled',
    text: mention.text_span,
    metadata: {
      entryId: mention.entry?.id,
      indexTypes: mention.index_types,
      colors: colors, // Array of colors
      // If single type: use colors[0] for solid background
      // If multi-type: use colors array for diagonal stripes
      mentionType: mention.mention_type,
      createdAt: mention.created_at,
    },
  };
};

// Usage in component:
const highlights = mentions.map(mention =>
  mentionToPdfHighlight({ mention, projectIndexTypes })
);
```

### Draft → IndexMention Input

```typescript
// apps/index-pdf-frontend/src/adapters/draft-to-mention.adapter.ts

export const draftToMentionInput = ({
  draft,
  entryId,
  indexTypes,
}: {
  draft: MentionDraft;
  entryId: string;
  indexTypes: string[];
}): CreateMentionInput => {
  return {
    documentId: draft.documentId,
    entryId,
    pageNumber: draft.pageNumber,
    textSpan: draft.text,
    bboxesPdf: draft.bboxes, // Already in PDF user space from Phase 3
    indexTypes,
    mentionType: draft.type, // 'text' or 'region'
  };
};

// Usage in mention creation:
const input = draftToMentionInput({
  draft,
  entryId: selectedEntry.id,
  indexTypes: [currentIndexType.name],
});

await createMention.mutateAsync(input);
```

## Multi-Type Mention Rendering

### Highlight Color Logic

```typescript
// packages/yaboujee/src/components/pdf/components/pdf-highlight-box/pdf-highlight-box.tsx

export const PdfHighlightBox = ({ highlight }: Props) => {
  const { colors = [] } = highlight.metadata || {};
  
  // Single-type: Solid color
  if (colors.length === 1) {
    return (
      <div
        style={{
          backgroundColor: `${colors[0]}40`, // 25% opacity
          // ... other styles
        }}
      />
    );
  }
  
  // Multi-type: Diagonal stripes
  if (colors.length > 1) {
    const stripeWidth = 100 / colors.length; // Equal width per color
    const gradient = colors
      .map((color, i) => {
        const start = i * stripeWidth;
        const end = (i + 1) * stripeWidth;
        return `${color}40 ${start}%, ${color}40 ${end}%`;
      })
      .join(', ');
    
    return (
      <div
        style={{
          background: `repeating-linear-gradient(
            45deg,
            ${gradient}
          )`,
          // ... other styles
        }}
      />
    );
  }
  
  // Fallback: Default yellow
  return <div style={{ backgroundColor: '#FCD34D40' }} />;
};
```

## Frontend Integration

### Mention List with Multi-Type Filtering

```tsx
// apps/index-pdf-frontend/src/app/projects/[projectDir]/editor/_components/page-sidebar/page-sidebar.tsx

export const PageSidebar = () => {
  const { projectId, documentId } = useProject();
  const currentPage = useCurrentPage();
  
  // Query mentions for current page
  const { data: allMentions, isLoading } = trpc.indexMention.list.useQuery({
    projectId,
    documentId,
    pageNumber: currentPage,
  });
  
  // Filter mentions by index type for each section
  const subjectMentions = allMentions?.filter(m => 
    m.index_types.includes('subject')
  ) || [];
  
  const authorMentions = allMentions?.filter(m =>
    m.index_types.includes('author')
  ) || [];
  
  const scriptureMentions = allMentions?.filter(m =>
    m.index_types.includes('scripture')
  ) || [];
  
  return (
    <DraggableSidebar sections={[
      {
        id: 'page-subject',
        title: 'Subject',
        content: <PageSubjectContent mentions={subjectMentions} />,
      },
      {
        id: 'page-author',
        title: 'Author',
        content: <PageAuthorContent mentions={authorMentions} />,
      },
      // ... other sections
    ]} />
  );
};
```

### Bulk "Index As" Operation

```tsx
// apps/index-pdf-frontend/src/app/projects/[projectDir]/editor/_components/bulk-index-as-modal.tsx

export const BulkIndexAsModal = ({ selectedMentionIds }: Props) => {
  const [selectedIndexTypes, setSelectedIndexTypes] = useState<string[]>([]);
  const [operation, setOperation] = useState<'add' | 'replace' | 'remove'>('add');
  
  const updateIndexTypes = trpc.indexMention.updateIndexTypes.useMutation({
    onSuccess: () => {
      utils.indexMention.list.invalidate();
      toast.success('Index types updated');
    },
  });
  
  const handleSubmit = () => {
    updateIndexTypes.mutate({
      mentionIds: selectedMentionIds,
      indexTypes: selectedIndexTypes,
      operation,
    });
  };
  
  return (
    <Dialog>
      <h2>Update Index Types</h2>
      <p>{selectedMentionIds.length} mentions selected</p>
      
      <RadioGroup value={operation} onChange={setOperation}>
        <Radio value="add">Add to existing types</Radio>
        <Radio value="replace">Replace all types</Radio>
        <Radio value="remove">Remove types</Radio>
      </RadioGroup>
      
      <MultiSelect
        value={selectedIndexTypes}
        onChange={setSelectedIndexTypes}
        options={projectIndexTypes.map(t => ({
          value: t.name,
          label: t.name,
        }))}
      />
      
      <Button onClick={handleSubmit}>Update</Button>
    </Dialog>
  );
};
```

## Testing Requirements

- [ ] Mention CRUD operations work
- [ ] Multi-type tagging persists correctly
- [ ] Bulk updateIndexTypes works (add, replace, remove)
- [ ] Page filtering returns correct mentions
- [ ] Index type filtering works
- [ ] Multi-type highlights render with stripes
- [ ] Single-type highlights render solid color
- [ ] Coordinates preserved in PDF user space
- [ ] Region vs text mentions handled correctly
- [ ] Performance acceptable with 1000+ mentions per page
- [ ] Adapter functions handle edge cases

## Implementation Checklist

### Backend
- [ ] Create `indexMention` tRPC router
- [ ] Implement `list` with filtering
- [ ] Implement `create` with validation
- [ ] Implement `update` for entry/text/types
- [ ] Implement `updateIndexTypes` bulk operation
- [ ] Implement `bulkCreate` for imports
- [ ] Implement `delete` (soft delete)
- [ ] Add access control checks
- [ ] Write unit tests

### Adapters
- [ ] Create `mentionToPdfHighlight` adapter
- [ ] Create `draftToMentionInput` adapter
- [ ] Handle multi-color generation
- [ ] Test coordinate preservation

### Frontend
- [ ] Update mention creation to use API
- [ ] Update mention editing to use API
- [ ] Add multi-type highlight rendering
- [ ] Add bulk "Index As" modal
- [ ] Replace local state with tRPC queries
- [ ] Add loading and error states

### Validation
- [ ] Test all CRUD operations
- [ ] Test multi-type filtering
- [ ] Test bulk operations with many mentions
- [ ] Test coordinate accuracy at different zoom levels
- [ ] Test performance with many highlights
- [ ] Test concurrent edits

---

## Next Task

[Task 5D: Optimistic Updates & Error Handling](./task-5d-optimistic-updates.md) - Polish UX with instant feedback and graceful degradation.
