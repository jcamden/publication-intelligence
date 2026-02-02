# Phase 5: Backend Integration

**Status:** Not Started  
**Dependencies:** Phase 4 completion

## Overview

Persist highlights to Gel database with CRUD operations and optimistic updates.

## Schema Design

### IndexMention
```tsx
type IndexMention {
  required id: uuid;
  required project: Project;
  required document: SourceDocument;
  required page_number: int16;
  required bbox_pdf: json; // BoundingBox in PDF user space
  required text_span: str;
  entry: IndexEntry; // Optional - can create mention before linking to entry
  created_at: datetime;
  updated_at: datetime;
  deleted_at: datetime; // Soft delete
}
```

### IndexEntry
```tsx
type IndexEntry {
  required id: uuid;
  required project: Project;
  required label: str;
  parent: IndexEntry; // For hierarchy
  sort_key: str; // Custom alphabetization
  aliases: array<str>; // Alternative names
  color: str; // Hex color for visual grouping
  metadata: json;
  created_at: datetime;
}
```

## tRPC Endpoints

### Mentions
- `mention.list` - Get mentions for document/page
- `mention.create` - Create new mention
- `mention.update` - Update mention (change entry, text)
- `mention.delete` - Soft delete mention
- `mention.bulkCreate` - Create multiple mentions

### Entries
- `entry.list` - Get all entries for project
- `entry.create` - Create new entry
- `entry.update` - Update entry label/hierarchy
- `entry.delete` - Delete entry (cascade mentions?)
- `entry.search` - Search/autocomplete entries

## Application Adapter

**IndexMention → PdfHighlight:**
```tsx
const highlights: PdfHighlight[] = indexMentions.map(mention => ({
  id: mention.id,
  pageNumber: mention.page_number,
  bbox: mention.bbox_pdf, // Keep PDF coordinates
  label: mention.entry?.label || 'Unlabeled',
  text: mention.text_span,
  metadata: {
    entryId: mention.entry_id,
    color: mention.entry?.color,
    createdAt: mention.created_at,
  },
}));
```

**Draft → IndexMention:**
```tsx
const createMentionInput = {
  projectId: project.id,
  documentId: document.id,
  pageNumber: draft.pageNumber,
  bboxPdf: draft.bbox, // Already in PDF user space
  textSpan: draft.text,
  entryId: selectedEntry.id, // From Phase 4 UI
};

await createMention.mutateAsync(createMentionInput);
```

## Optimistic Updates

**Pattern:**
```tsx
const createMention = trpc.mention.create.useMutation({
  onMutate: async (newMention) => {
    // Cancel outgoing queries
    await utils.mention.list.cancel();
    
    // Snapshot current state
    const previous = utils.mention.list.getData();
    
    // Optimistically update
    utils.mention.list.setData(undefined, (old) => [
      ...(old || []),
      { id: 'temp-' + Date.now(), ...newMention },
    ]);
    
    return { previous };
  },
  onError: (err, newMention, context) => {
    // Rollback on error
    utils.mention.list.setData(undefined, context?.previous);
  },
  onSettled: () => {
    // Refetch to sync
    utils.mention.list.invalidate();
  },
});
```

## State Migration

**Phase 4 (local state):**
```tsx
const [mentions, setMentions] = useState<Mention[]>([]);
```

**Phase 5 (API state):**
```tsx
// Replace with tRPC queries
const { data: mentions, isLoading } = trpc.mention.list.useQuery({
  documentId: document.id,
  pageNumber: currentPage, // Optional: fetch per-page
});

const createMention = trpc.mention.create.useMutation();
const updateMention = trpc.mention.update.useMutation();
const deleteMention = trpc.mention.delete.useMutation();
```

## Error Handling

**Scenarios:**
- Network timeout → Show retry button
- Validation error → Show field-specific errors
- Conflict (concurrent edit) → Show diff, let user merge
- Unauthorized → Redirect to login
- Rate limit → Queue requests, show progress

## Testing Requirements

- [ ] CRUD operations work via API
- [ ] Optimistic updates smooth (no flicker)
- [ ] Error handling graceful
- [ ] Network offline → queue requests
- [ ] Concurrent edits don't corrupt data
- [ ] Soft deletes work (not permanent)

## Performance Optimizations

- Lazy load mentions (per-page or viewport)
- Cache entry list (rarely changes)
- Debounce search/autocomplete (300ms)
- Batch creates (bulk import)
- Use React Query for caching

## Migration Path

1. Keep Phase 4 local state working
2. Add API endpoints (no UI changes)
3. Replace useState with useQuery (one at a time)
4. Add optimistic updates
5. Add error handling
6. Remove local state

## Success Criteria

- ✅ Mentions persist to database
- ✅ CRUD operations functional
- ✅ Optimistic updates working
- ✅ Error handling graceful
- ✅ Performance acceptable (< 200ms for operations)
- ✅ Data integrity maintained
