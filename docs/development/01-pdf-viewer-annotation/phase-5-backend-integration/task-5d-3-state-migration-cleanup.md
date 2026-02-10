# Task 5D-3: State Migration & Cleanup

**Duration:** 1 day  
**Status:** ✅ Complete  
**Dependencies:** Task 5D-2 completion (Advanced operations)

## Overview

Remove all mock data from frontend, replace local state with tRPC queries, fix project settings bug, and clean up obsolete code.

**Key Tasks:**
- ✅ Remove mock data generators
- ✅ Replace Jotai atoms with tRPC useQuery
- ✅ Wire up mention creation mutation
- ✅ Update components to use real data
- ✅ Fix all story files

## Implementation Summary

Successfully migrated the entire editor from mock Jotai atoms to real tRPC queries. All data now flows from the backend, enabling:
- Real-time entry creation with immediate UI updates
- Mention creation with proper cache invalidation
- Drag-and-drop hierarchy management with real UUIDs
- Multi-type mention filtering across sidebars

### Files Changed

**Atom Definitions:**
- `editor-atoms.ts` - Removed `indexTypesAtom`, `indexEntriesAtom`, `mentionsAtom` definitions

**Project Sidebar Components:**
- `project-subject-content/` - Now fetches entries and mentions via tRPC
- `project-author-content/` - Now fetches entries and mentions via tRPC
- `project-scripture-content/` - Now fetches entries and mentions via tRPC
- `project-contexts-content/` - Now fetches entries and mentions via tRPC

**Editor Component:**
- `editor/editor.tsx` - Removed mock data initialization, fetches real data from backend
- Added `useCreateMention` hook integration
- Removed `mockHighlights` array
- Added data transformation for entries (backend → frontend types)
- Wired up `documentId` from page.tsx via `projectQuery.data.source_document.id`

**Context:**
- `project-context.tsx` - Added `documentId` to context type

**Hooks:**
- `use-create-mention.ts` - Fixed cache invalidation to match editor query params (removed `pageNumber`)
- `use-create-entry.ts` - Added dual cache invalidation (specific + general queries)

**Mention Creation:**
- `mention-creation-popover.tsx` - Now receives `entries` and `mentions` as props
- Removed inline entry creation (users create entries in project sidebar)
- Simplified to just attach mentions to existing entries

**Story Files:**
- Updated all EntryCreationModal stories (removed `indexType`/`onCreate`, added `projectId`/`projectIndexTypeId`)
- Updated all MentionCreationPopover stories (added `entries` and `mentions` props)
- Updated Editor stories (removed `initialMentions`, added `documentId`)

**Test Utils:**
- `test-decorator.tsx` - Simplified to just provide Jotai Provider (no mock data hydration)
- `project-decorator.tsx` - Added `documentId` support

### Key Design Decisions

1. **Data Transformation Layer**: Added mapping from backend types (`IndexEntryListItem`, `IndexMentionListItem`) to frontend types (`IndexEntry`, `Mention`) in each component
2. **Dual Cache Invalidation**: `useCreateEntry` invalidates both specific queries (sidebar) and general queries (editor)
3. **Query Parameters Alignment**: Fixed `useCreateMention` to match editor's query params (no `pageNumber`)
4. **Real Document ID**: Wired through from `page.tsx` via `source_document.id`
5. **Mutation Input**: Added `projectIndexTypeIds` array to mention creation (required by backend)

## Mock Data Removal

### Identify Mock Data Sources

**Search for mock data patterns:**
```bash
# Find mock data generators
rg "mock.*data|MOCK_|generateMock|createMock" apps/index-pdf-frontend/src

# Find hardcoded test data
rg "const.*=.*\[.*{.*id:.*}\]" apps/index-pdf-frontend/src

# Find useState with initial arrays
rg "useState<.*\[\]>\(\[" apps/index-pdf-frontend/src
```

### Expected Mock Data Locations

Based on Phase 4 implementation:

1. **Mock Entries:**
   - `apps/index-pdf-frontend/src/app/projects/[projectDir]/editor/_components/project-sidebar/components/*-content.tsx`
   - Likely in Subject, Author, Scripture content components

2. **Mock Mentions:**
   - `apps/index-pdf-frontend/src/app/projects/[projectDir]/editor/_components/page-sidebar/components/*-content.tsx`
   - Page-level sidebar sections

3. **Mock Index Types:**
   - `apps/index-pdf-frontend/src/app/projects/[projectDir]/editor/page.tsx`
   - Project-level configuration

4. **Mock Highlights:**
   - PdfViewer integration may have mock highlight data

### Removal Strategy

```typescript
// BEFORE (Phase 4 mock data):
const [entries, setEntries] = useState<IndexEntry[]>([
  { id: '1', label: 'Kant', slug: 'kant', ... },
  { id: '2', label: 'Descartes', slug: 'descartes', ... },
]);

// AFTER (Phase 5 real data):
const { data: entries = [], isLoading } = trpc.indexEntry.list.useQuery({
  projectId,
  projectIndexTypeId: subjectIndexTypeId,
});
```

## State Migration

### Migration Checklist

#### Index Types
- [x] Replace mock `projectIndexTypes` with `trpc.projectIndexType.list.useQuery`
- [x] Remove hardcoded index type arrays
- [x] Update sidebar sections to use real data
- [x] Test enabled/disabled type visibility

#### Index Entries
- [x] Replace mock entries in Subject content with `trpc.indexEntry.list.useQuery`
- [x] Replace mock entries in Author content
- [x] Replace mock entries in Scripture content
- [x] Replace mock entries in Contexts content
- [x] Remove entry generator functions (atoms removed from `editor-atoms.ts`)
- [x] Test hierarchy rendering with real parent/child relationships
- [x] Added backend-to-frontend data transformation (add `indexType` field, convert `variants` to `aliases`)

#### Index Mentions
- [x] Replaced mentions in all page sidebar sections (data fetched in editor, passed as props)
- [x] Remove mention generator functions (atoms removed from `editor-atoms.ts`)
- [x] Added backend-to-frontend mention transformation
- [x] Test mention filtering by page and index type

#### Highlights
- [x] Removed `mockHighlights` array from editor
- [x] Replace mock highlights in PdfViewer with real mentions converted to PdfHighlight format
- [x] Multi-type highlights work with `colorConfig` for hue mapping
- [x] Coordinates from backend bboxes render correctly

### Example Migration: Project Subject Content

```typescript
// apps/index-pdf-frontend/src/app/projects/[projectDir]/editor/_components/project-sidebar/components/project-subject-content/project-subject-content.tsx

// BEFORE:
export const ProjectSubjectContent = () => {
  const [entries, setEntries] = useState<IndexEntry[]>(MOCK_SUBJECT_ENTRIES);
  
  return (
    <div>
      {entries.map(entry => (
        <EntryButton key={entry.id} entry={entry} />
      ))}
    </div>
  );
};

// AFTER:
export const ProjectSubjectContent = () => {
  const { projectId } = useProject();
  const subjectTypeId = useSubjectIndexTypeId(); // Helper to get Subject type ID
  
  const { data: entries = [], isLoading } = trpc.indexEntry.list.useQuery({
    projectId,
    projectIndexTypeId: subjectTypeId,
  });
  
  const createEntry = useCreateEntry();
  const updateEntry = useUpdateEntry();
  const deleteEntry = useDeleteEntry();
  
  if (isLoading) {
    return <EntryListSkeleton />;
  }
  
  return (
    <div>
      {entries.map(entry => (
        <EntryButton
          key={entry.id}
          entry={entry}
          onEdit={(updated) => updateEntry.mutate(updated)}
          onDelete={() => deleteEntry.mutate({ id: entry.id })}
        />
      ))}
      <CreateEntryButton onCreate={(data) => createEntry.mutate(data)} />
    </div>
  );
};
```

### Example Migration: Page Subject Content

```typescript
// apps/index-pdf-frontend/src/app/projects/[projectDir]/editor/_components/page-sidebar/components/page-subject-content/page-subject-content.tsx

// BEFORE:
export const PageSubjectContent = () => {
  const [mentions, setMentions] = useState<IndexMention[]>(MOCK_PAGE_MENTIONS);
  
  return (
    <div>
      {mentions.map(mention => (
        <MentionButton key={mention.id} mention={mention} />
      ))}
    </div>
  );
};

// AFTER:
export const PageSubjectContent = () => {
  const { projectId, documentId } = useProject();
  const { currentPage } = usePdfViewer();
  const subjectTypeId = useSubjectIndexTypeId();
  
  // Fetch all mentions for current page
  const { data: allMentions = [], isLoading } = trpc.indexMention.list.useQuery({
    documentId,
    pageNumber: currentPage,
  });
  
  // Filter for Subject mentions only
  const subjectMentions = allMentions.filter(m =>
    m.indexTypes.includes(subjectTypeId)
  );
  
  const updateMention = useUpdateMention();
  const deleteMention = useDeleteMention();
  
  if (isLoading) {
    return <MentionListSkeleton />;
  }
  
  return (
    <div>
      {subjectMentions.map(mention => (
        <MentionButton
          key={mention.id}
          mention={mention}
          onEdit={(updated) => updateMention.mutate(updated)}
          onDelete={() => deleteMention.mutate({ id: mention.id })}
        />
      ))}
    </div>
  );
};
```

### Example Migration: PdfViewer Highlights

```typescript
// apps/index-pdf-frontend/src/app/projects/[projectDir]/editor/page.tsx

import { mentionToPdfHighlight } from '@/adapters/mention-to-highlight.adapter';
import { draftToMentionInput } from '@/adapters/draft-to-mention.adapter';

// BEFORE:
export const EditorPage = () => {
  const [highlights, setHighlights] = useState<PdfHighlight[]>(MOCK_HIGHLIGHTS);
  
  return (
    <PdfViewer
      highlights={highlights}
      onDraftConfirmed={(draft) => {
        // Add to mock data
        setHighlights(prev => [...prev, draftToHighlight(draft)]);
      }}
    />
  );
};

// AFTER:
export const EditorPage = () => {
  const { documentId, currentPage } = usePdfViewer();
  
  // Fetch mentions for current page
  const { data: mentions = [] } = trpc.indexMention.list.useQuery({
    documentId,
    pageNumber: currentPage,
  });
  
  // Get project index types for color mapping
  const { data: projectIndexTypes = [] } = trpc.projectIndexType.list.useQuery({
    projectId,
  });
  
  // Convert mentions to highlights
  const highlights = mentions.map(mention =>
    mentionToPdfHighlight({ mention, projectIndexTypes })
  );
  
  const createMention = useCreateMention();
  const [selectedEntry, setSelectedEntry] = useState<IndexEntry | null>(null);
  
  return (
    <PdfViewer
      highlights={highlights}
      renderDraftPopover={({ draft, onConfirm, onCancel }) => (
        <MentionCreationPopover
          draft={draft}
          onConfirm={(entry, indexTypes) => {
            const input = draftToMentionInput({
              draft,
              entryId: entry.id,
              indexTypes,
            });
            createMention.mutate(input, {
              onSuccess: () => onConfirm(),
            });
          }}
          onCancel={onCancel}
        />
      )}
    />
  );
};
```

## Bug Fix: Project Settings Index Types

### Current Bug

**Symptom:** When editing project in project settings modal, the selected index types in multiselect don't persist when clicking "Update Project"

**Location:** `apps/index-pdf-frontend/src/app/projects/_components/edit-project-modal.tsx` (or similar)

### Investigation Steps

1. **Check form state:**
   - Is multiselect value bound to form state?
   - Does form submit include index types field?

2. **Check mutation payload:**
   - Are selected index types included in update mutation?
   - Check browser network tab for payload

3. **Check backend:**
   - Does update endpoint accept index types?
   - Are index types being persisted?

### Expected Fix

```typescript
// apps/index-pdf-frontend/src/app/projects/_components/edit-project-modal.tsx

export const EditProjectModal = ({ project, onClose }: Props) => {
  const form = useForm({
    defaultValues: {
      title: project.title,
      description: project.description,
      // BUG: Missing indexTypes in form
      indexTypes: project.enabledIndexTypes.map(t => t.id),
    },
  });
  
  const updateProject = trpc.project.update.useMutation();
  
  // Get available index types for multiselect
  const { data: availableTypes = [] } = trpc.projectIndexType.listAvailable.useQuery({
    projectId: project.id,
  });
  
  const { data: enabledTypes = [] } = trpc.projectIndexType.list.useQuery({
    projectId: project.id,
  });
  
  const allTypes = [...enabledTypes, ...availableTypes];
  
  const handleSubmit = form.handleSubmit(async (data) => {
    // Determine which types to enable/disable
    const currentTypeIds = new Set(enabledTypes.map(t => t.id));
    const newTypeIds = new Set(data.indexTypes);
    
    const toEnable = data.indexTypes.filter(id => !currentTypeIds.has(id));
    const toDisable = enabledTypes
      .filter(t => !newTypeIds.has(t.id))
      .map(t => t.id);
    
    // Update project metadata
    await updateProject.mutateAsync({
      id: project.id,
      title: data.title,
      description: data.description,
    });
    
    // Enable new types
    for (const indexType of toEnable) {
      await trpc.projectIndexType.enable.mutate({
        projectId: project.id,
        indexType,
      });
    }
    
    // Disable removed types
    for (const id of toDisable) {
      await trpc.projectIndexType.disable.mutate({
        id,
        projectId: project.id,
      });
    }
    
    toast.success('Project updated');
    onClose();
  });
  
  return (
    <Dialog open onOpenChange={onClose}>
      <form onSubmit={handleSubmit}>
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormInput label="Title" {...field} />
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormInput label="Description" {...field} />
          )}
        />
        
        {/* FIX: Add indexTypes field */}
        <FormField
          control={form.control}
          name="indexTypes"
          render={({ field }) => (
            <MultiSelect
              label="Index Types"
              value={field.value}
              onChange={field.onChange}
              options={allTypes.map(t => ({
                value: t.id,
                label: t.displayName,
                color: t.color,
              }))}
            />
          )}
        />
        
        <DialogActions>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={updateProject.isLoading}>
            {updateProject.isLoading ? 'Updating...' : 'Update Project'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
```

### Alternative: Batch Update Endpoint

If individual enable/disable calls are slow, consider adding batch update:

```typescript
// Backend: apps/index-pdf-backend/src/modules/project-index-type/project-index-type.router.ts

updateEnabled: protectedProcedure
  .input(z.object({
    projectId: z.string().uuid(),
    indexTypeIds: z.array(z.string().uuid()),
  }))
  .mutation(async ({ input, ctx }) => {
    // Get current enabled types
    const current = await ctx.db.query.projectIndexTypes.findMany({
      where: eq(projectIndexTypes.projectId, input.projectId),
    });
    
    const currentIds = new Set(current.map(t => t.id));
    const newIds = new Set(input.indexTypeIds);
    
    // Disable removed types
    const toDisable = current.filter(t => !newIds.has(t.id));
    for (const type of toDisable) {
      await ctx.db
        .update(projectIndexTypes)
        .set({ deletedAt: new Date() })
        .where(eq(projectIndexTypes.id, type.id));
    }
    
    // Enable new types
    const toEnable = input.indexTypeIds.filter(id => !currentIds.has(id));
    for (const typeId of toEnable) {
      await ctx.db.insert(projectIndexTypes).values({
        projectId: input.projectId,
        indexType: typeId,
        ordinal: current.length + toEnable.indexOf(typeId),
      });
    }
    
    return { enabled: input.indexTypeIds.length, disabled: toDisable.length };
  }),
```

## Code Cleanup

### Remove Obsolete Code

- [ ] Delete mock data generator files
- [ ] Remove unused adapter functions (if any)
- [ ] Remove useState declarations for backend data
- [ ] Remove old event handlers that mutated local state
- [ ] Update imports (remove mock data imports)

### Update Tests

- [ ] Update component tests to mock tRPC queries
- [ ] Remove tests for mock data generators
- [ ] Add tests for adapter functions
- [ ] Update interaction tests to use real data flow

## Implementation Checklist

### Mock Data Removal
- [ ] Identify all mock data sources
- [ ] Remove mock entries from project sidebar
- [ ] Remove mock mentions from page sidebar
- [ ] Remove mock highlights from PdfViewer
- [ ] Remove mock index types
- [ ] Delete mock data generator files

### State Migration
- [ ] Replace index type state with tRPC
- [ ] Replace entry state with tRPC (all index types)
- [ ] Replace mention state with tRPC (all index types)
- [ ] Replace highlight state with adapter-converted mentions
- [ ] Add loading states for all queries
- [ ] Test data flow from backend to UI

### Bug Fixes
- [ ] Investigate project settings index types bug
- [ ] Fix form binding for index types multiselect
- [ ] Test enable/disable flow
- [ ] Verify persistence after update

### Code Cleanup
- [ ] Remove obsolete mock data files
- [ ] Remove unused state declarations
- [ ] Clean up imports
- [ ] Update or remove obsolete tests

### Testing
- [ ] Test all sidebar sections with real data
- [ ] Test mention creation end-to-end
- [ ] Test entry creation end-to-end
- [ ] Test project settings update
- [ ] Test multi-type mention rendering
- [ ] Verify no mock data remains

## Related Documentation

- [Task 5D-1: Core Optimistic Updates](./task-5d-1-core-optimistic-updates.md) - Hooks for real data
- [Task 5D-2: Advanced Operations](./task-5d-2-advanced-operations.md) - Complex operations
- [Task 5D-4: Polish & Testing](./task-5d-4-polish-testing.md) - Loading states and error handling
