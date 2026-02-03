# Phase 5: Backend Integration

**Status:** Not Started  
**Dependencies:** Phase 4 completion

## Overview

Persist highlights to Gel database with CRUD operations and optimistic updates.

## Frontend Architecture (Established in Phase 4)

**The following patterns are already implemented and should be maintained:**

1. **Two-Component Popover Pattern**
   - Generic: `PdfAnnotationPopover` (yaboujee) - handles positioning, bounds checking, escape key
   - Specific: Content components (e.g., `MentionCreationPopover`) - pure content, no positioning logic
   - Integration: Use render props pattern with `PdfViewer` where applicable

2. **Standardized Form Components**
   - `FormInput` (yaboujee) - integrates TanStack Form with yabasic Field components
   - `FieldError` (yabasic) - consistent error display
   - All forms should use TanStack Form for state management

3. **PdfViewer Integration**
   - Draft state managed internally by `PdfViewer`
   - Callbacks: `onDraftConfirmed`, `onDraftCancelled`
   - Render props: `renderDraftPopover` for custom content
   - No external draft state or popover visibility state needed

4. **Type Considerations**
   - `MentionDraft` includes `type: 'text' | 'region'`
   - Structural typing preferred for reusable components (avoid complex generics)
   - Use interface-based props for field components

## Schema Design

### IndexType (Project Configuration)
```tsx
type IndexType {
  required id: uuid;
  required project: Project;
  required name: str; // 'subject', 'author', 'scripture', etc.
  required ordinal: int16; // For default color assignment
  required color: str; // Hex color
  required visible: bool; // Toggle in UI
  created_at: datetime;
}
```

### IndexMention (Multi-Type Support)
```tsx
type IndexMention {
  required id: uuid;
  required project: Project;
  required document: SourceDocument;
  required page_number: int16;
  required bbox_pdf: json; // BoundingBox in PDF user space
  required text_span: str;
  required index_types: array<str>; // ['subject', 'author']
  entry: IndexEntry; // Optional - can create before linking
  created_at: datetime;
  updated_at: datetime;
  deleted_at: datetime; // Soft delete
}
```

### IndexEntry (Typed)
```tsx
type IndexEntry {
  required id: uuid;
  required project: Project;
  required index_type: str; // 'subject', 'author', etc.
  required label: str;
  parent: IndexEntry; // For hierarchy
  sort_key: str; // Custom alphabetization
  aliases: array<str>; // Alternative names
  metadata: json;
  created_at: datetime;
}
```

### Context
```tsx
type Context {
  required id: uuid;
  required project: Project;
  required type: str; // 'ignore' | 'page-number'
  required bbox_pdf: json; // BoundingBox in PDF user space
  required page_config: json; // { mode, pages?, everyOther?, startPage? }
  extracted_page_number: str; // For page-number contexts
  extraction_confidence: str; // 'high' | 'medium' | 'low'
  required color: str; // Hex color
  required visible: bool;
  created_at: datetime;
  updated_at: datetime;
}
```

**page_config JSON structure:**
```typescript
{
  mode: 'this-page' | 'all-pages' | 'range' | 'custom';
  pages?: string; // "1-50" or "1-2,5-6,8,10-12"
  everyOther?: boolean;
  startPage?: number; // For "every other"
}
```

### DocumentPage (Multi-Layer Page Numbering)
```tsx
type DocumentPage {
  required id: uuid;
  required document: SourceDocument;
  required document_page_number: int16; // Always present
  context_page_number: str; // From page number context
  context_extraction_confidence: str; // 'high' | 'medium' | 'low'
  project_override_page_number: str; // Project-level override
  page_override_page_number: str; // Single-page override
  canonical_page_number: str; // Computed
  required is_indexable: bool; // False if [bracketed]
  extracted_text: str; // Full page text
  text_atoms: json; // Word-level bboxes from PyMuPDF
  created_at: datetime;
  updated_at: datetime;
}
```

### Project (Page Number Override)
```tsx
type Project {
  // ... existing fields
  page_number_override_string: str; // Full override string
  page_number_validation_errors: array<str>; // From last validation
}
```

## tRPC Endpoints

### Mentions
- `mention.list` - Get mentions for document/page (filter by index type)
- `mention.create` - Create new mention (with index_types array)
- `mention.update` - Update mention (change entry, text, index types)
- `mention.updateIndexTypes` - Change which index types a mention belongs to
- `mention.delete` - Soft delete mention
- `mention.bulkCreate` - Create multiple mentions
- `mention.bulkUpdateIndexTypes` - Bulk "Index As" operations

### Entries
- `entry.list` - Get all entries for project (filter by index type)
- `entry.create` - Create new entry (with index_type)
- `entry.update` - Update entry label/hierarchy
- `entry.delete` - Delete entry (cascade mentions?)
- `entry.search` - Search/autocomplete entries (filter by index type)

### Contexts
- `context.list` - Get all contexts for project
- `context.listForPage` - Get contexts applying to specific page
- `context.create` - Create new context
- `context.update` - Update context (bbox, page config, color, visibility)
- `context.delete` - Delete context
- `context.removeFromPage` - Remove page from context's page config
- `context.extractPageNumbers` - Trigger page number extraction for page-number contexts

### Index Types
- `indexType.list` - Get all index types for project
- `indexType.create` - Create custom index type
- `indexType.update` - Update index type (name, color, visibility)
- `indexType.delete` - Delete index type (cascade entries/mentions?)
- `indexType.reorder` - Change ordinal order

### Pages
- `page.list` - Get all pages for document (with page numbering)
- `page.updatePageNumber` - Set page-level override
- `page.clearPageNumber` - Clear page-level override
- `page.computeCanonical` - Recompute canonical page numbers for all pages

### Project
- `project.updatePageNumberString` - Set project-level page number override
- `project.validatePageNumberString` - Validate override string (returns errors)

## Application Adapter

**IndexMention → PdfHighlight (with multi-type):**
```tsx
const highlights: PdfHighlight[] = indexMentions.map(mention => {
  // Get colors for all index types this mention belongs to
  const colors = mention.index_types.map(typeName => {
    const indexType = projectIndexTypes.find(t => t.name === typeName);
    return indexType?.color || '#FCD34D';
  });
  
  return {
    id: mention.id,
    pageNumber: mention.page_number,
    bbox: mention.bbox_pdf, // Keep PDF coordinates
    label: mention.entry?.label || 'Unlabeled',
    text: mention.text_span,
    metadata: {
      entryId: mention.entry_id,
      indexTypes: mention.index_types,
      colors: colors, // Array of colors for multi-type stripes
      createdAt: mention.created_at,
    },
  };
});
```

**Context → PdfHighlight (for rendering):**
```tsx
const contextHighlights: PdfHighlight[] = contexts
  .filter(ctx => ctx.visible && appliesToCurrentPage(ctx))
  .map(ctx => ({
    id: ctx.id,
    pageNumber: currentPage,
    bbox: ctx.bbox_pdf,
    label: ctx.type === 'ignore' ? 'Ignore Context' : 'Page Number Context',
    text: ctx.extracted_page_number || '',
    metadata: {
      contextType: ctx.type,
      color: ctx.color,
      isContext: true, // Flag to render differently
    },
  }));
```

**Draft → IndexMention (with index types):**
```tsx
const createMentionInput = {
  projectId: project.id,
  documentId: document.id,
  pageNumber: draft.pageNumber,
  bboxPdf: draft.bbox, // Already in PDF user space
  textSpan: draft.text,
  entryId: selectedEntry.id,
  indexTypes: selectedIndexTypes, // ['subject', 'author']
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
