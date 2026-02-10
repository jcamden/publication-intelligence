# Task 5D-2: Advanced Operations

**Duration:** 1-2 days  
**Status:** ✅ Complete  
**Dependencies:** Task 5D-1 completion (Core optimistic updates)

## Overview

Implement optimistic updates for advanced operations: multi-type mentions, bulk updateIndexTypes, hierarchy management (updateParent), and ProjectIndexType operations.

**Key Features:**
- Multi-type mention cache invalidation
- Bulk index type updates with three modes (add/replace/remove)
- Drag-drop hierarchy with cycle detection UX
- ProjectIndexType enable/disable operations

## Implementation Notes

### Completed Components

**Hooks Created:**
1. `use-bulk-update-index-types.ts` - Bulk mention type updates with wrapper params (`projectId`, `documentId`)
2. `use-update-entry-parent.ts` - Hierarchy drag-drop with wrapper param (`projectId`)
3. `use-enable-index-type.ts` - Enable index types with addon error handling
4. `use-disable-index-type.ts` - Disable index types with wrapper param (`projectId`)

**UI Components:**
1. `bulk-index-as-modal/` - Modal for bulk updating mention index types
2. Updated `entry-tree/` components with drag-drop support
3. Wired `entry-creation-modal/` to backend (integrated with `useCreateEntry` hook)

**Key Design Decisions:**
- Hooks use wrapper parameters (`projectId`, `documentId`) instead of extending mutation input types for better cache management
- `useReorderIndexTypes` not implemented - backend removed reorder endpoint (ordinal is client-side)
- `useUpdateMentionIndexTypes` not needed - `useBulkUpdateIndexTypes` handles single and multiple mentions
- `EntryTree.projectId` is optional with default value to comply with React Rules of Hooks
- All hooks properly handle `pageNumber: number | null` → `number | undefined` conversion
- Complete type safety with `IndexMentionListItem.indexTypes` including `colorHue` field
- Entry creation modal wired to real backend with `projectId` and `projectIndexTypeId` (replaced mock `onCreate` callback)

## Multi-Type Mention Operations

### Cache Invalidation Strategy

When a mention's index types change, multiple sidebar sections may need to update:

```typescript
// apps/index-pdf-frontend/src/hooks/use-update-mention-index-types.ts

export const useUpdateMentionIndexTypes = () => {
  const utils = trpc.useContext();
  
  return trpc.indexMention.update.useMutation({
    onMutate: async (update) => {
      // Find mention to get current state
      const mention = await utils.indexMention.list
        .getData({ documentId: update.documentId })
        ?.find(m => m.id === update.id);
      
      if (!mention) return { previous: null, affectedTypes: [] };
      
      // Determine which index types are affected
      const oldTypes = new Set(mention.indexTypes);
      const newTypes = new Set(update.indexTypes || []);
      
      const affectedTypes = new Set([
        ...Array.from(oldTypes),
        ...Array.from(newTypes),
      ]);
      
      // Cancel queries for all affected pages/types
      await utils.indexMention.list.cancel({
        documentId: update.documentId,
        pageNumber: mention.pageNumber,
      });
      
      const previous = utils.indexMention.list.getData({
        documentId: update.documentId,
        pageNumber: mention.pageNumber,
      });
      
      // Optimistically update
      utils.indexMention.list.setData(
        {
          documentId: update.documentId,
          pageNumber: mention.pageNumber,
        },
        (old) =>
          (old || []).map(m =>
            m.id === update.id
              ? { ...m, indexTypes: update.indexTypes || m.indexTypes }
              : m
          )
      );
      
      return {
        previous,
        pageNumber: mention.pageNumber,
        affectedTypes: Array.from(affectedTypes),
      };
    },
    
    onError: (err, update, context) => {
      if (context?.previous && context?.pageNumber) {
        utils.indexMention.list.setData(
          {
            documentId: update.documentId,
            pageNumber: context.pageNumber,
          },
          context.previous
        );
      }
      
      toast.error(`Failed to update mention types: ${err.message}`);
    },
    
    onSuccess: () => {
      toast.success('Mention types updated');
    },
    
    onSettled: (data, err, variables, context) => {
      if (context?.pageNumber) {
        // Invalidate the page query (affects all sidebar sections)
        utils.indexMention.list.invalidate({
          documentId: variables.documentId,
          pageNumber: context.pageNumber,
        });
      }
    },
  });
};
```

### Bulk Update Index Types

```typescript
// apps/index-pdf-frontend/src/hooks/use-bulk-update-index-types.ts

export const useBulkUpdateIndexTypes = () => {
  const utils = trpc.useContext();
  
  return trpc.indexMention.updateIndexTypes.useMutation({
    onMutate: async (bulkUpdate) => {
      // Find all mentions to determine affected pages
      const allMentions = utils.indexMention.list.getData({
        documentId: bulkUpdate.documentId,
      });
      
      const affectedMentions = allMentions?.filter(m =>
        bulkUpdate.mentionIds.includes(m.id)
      );
      
      if (!affectedMentions || affectedMentions.length === 0) {
        return { previous: null, affectedPages: [] };
      }
      
      // Get unique page numbers
      const affectedPages = [...new Set(affectedMentions.map(m => m.pageNumber))];
      
      // Cancel queries for all affected pages
      for (const pageNumber of affectedPages) {
        await utils.indexMention.list.cancel({
          documentId: bulkUpdate.documentId,
          pageNumber,
        });
      }
      
      // Snapshot state for each page
      const previousByPage = new Map();
      for (const pageNumber of affectedPages) {
        previousByPage.set(
          pageNumber,
          utils.indexMention.list.getData({
            documentId: bulkUpdate.documentId,
            pageNumber,
          })
        );
      }
      
      // Optimistically update all affected pages
      for (const pageNumber of affectedPages) {
        utils.indexMention.list.setData(
          {
            documentId: bulkUpdate.documentId,
            pageNumber,
          },
          (old) =>
            (old || []).map(m => {
              if (!bulkUpdate.mentionIds.includes(m.id)) return m;
              
              // Apply operation
              let newTypes: string[];
              if (bulkUpdate.operation === 'replace') {
                newTypes = bulkUpdate.indexTypes;
              } else if (bulkUpdate.operation === 'add') {
                newTypes = [...new Set([...m.indexTypes, ...bulkUpdate.indexTypes])];
              } else {
                // remove
                newTypes = m.indexTypes.filter(t => !bulkUpdate.indexTypes.includes(t));
              }
              
              return { ...m, indexTypes: newTypes };
            })
        );
      }
      
      return {
        previousByPage,
        affectedPages,
        documentId: bulkUpdate.documentId,
      };
    },
    
    onError: (err, bulkUpdate, context) => {
      // Rollback all affected pages
      if (context?.previousByPage && context?.affectedPages) {
        for (const pageNumber of context.affectedPages) {
          const previous = context.previousByPage.get(pageNumber);
          if (previous) {
            utils.indexMention.list.setData(
              {
                documentId: context.documentId,
                pageNumber,
              },
              previous
            );
          }
        }
      }
      
      toast.error(`Failed to update mention types: ${err.message}`);
    },
    
    onSuccess: (data) => {
      toast.success(`Updated ${data.length} mention(s)`);
    },
    
    onSettled: (data, err, variables, context) => {
      // Invalidate all affected pages
      if (context?.affectedPages) {
        for (const pageNumber of context.affectedPages) {
          utils.indexMention.list.invalidate({
            documentId: context.documentId,
            pageNumber,
          });
        }
      }
    },
  });
};
```

## Hierarchy Operations

### Update Parent (Drag-Drop)

**Challenge:** Server validates cycles and depth. Need clear UX for validation failures.

```typescript
// apps/index-pdf-frontend/src/hooks/use-update-entry-parent.ts

export const useUpdateEntryParent = () => {
  const utils = trpc.useContext();
  
  return trpc.indexEntry.updateParent.useMutation({
    onMutate: async (update) => {
      // Find entry to get projectIndexTypeId
      const entry = await utils.indexEntry.list
        .getData({ projectId: update.projectId })
        ?.find(e => e.id === update.id);
      
      if (!entry) return { previous: null };
      
      await utils.indexEntry.list.cancel({
        projectId: update.projectId,
        projectIndexTypeId: entry.projectIndexTypeId,
      });
      
      const previous = utils.indexEntry.list.getData({
        projectId: update.projectId,
        projectIndexTypeId: entry.projectIndexTypeId,
      });
      
      // Optimistically update parent
      utils.indexEntry.list.setData(
        {
          projectId: update.projectId,
          projectIndexTypeId: entry.projectIndexTypeId,
        },
        (old) =>
          (old || []).map(e =>
            e.id === update.id
              ? {
                  ...e,
                  parentId: update.parentId || null,
                  parent: update.parentId
                    ? old?.find(p => p.id === update.parentId) || null
                    : null,
                }
              : e
          )
      );
      
      return { previous, projectIndexTypeId: entry.projectIndexTypeId };
    },
    
    onError: (err, update, context) => {
      // Rollback
      if (context?.previous && context?.projectIndexTypeId) {
        utils.indexEntry.list.setData(
          {
            projectId: update.projectId,
            projectIndexTypeId: context.projectIndexTypeId,
          },
          context.previous
        );
      }
      
      // User-friendly error messages for validation failures
      let errorMessage = 'Failed to move entry';
      
      if (err.message.includes('cycle')) {
        errorMessage = 'Cannot move entry: Would create a circular hierarchy';
      } else if (err.message.includes('depth')) {
        errorMessage = 'Cannot move entry: Maximum hierarchy depth (5 levels) exceeded';
      } else if (err.message.includes('index type')) {
        errorMessage = 'Cannot move entry: Parent must be in the same index type';
      }
      
      toast.error(errorMessage);
    },
    
    onSuccess: () => {
      toast.success('Entry moved');
    },
    
    onSettled: (data, err, variables, context) => {
      if (context?.projectIndexTypeId) {
        utils.indexEntry.list.invalidate({
          projectId: variables.projectId,
          projectIndexTypeId: context.projectIndexTypeId,
        });
      }
    },
  });
};
```

### Tree Rendering with Drag-Drop

```tsx
// apps/index-pdf-frontend/src/app/projects/[projectDir]/editor/_components/project-sidebar/components/entry-tree.tsx

import { useUpdateEntryParent } from '@/hooks/use-update-entry-parent';

export const EntryTree = ({ entries, projectIndexTypeId }: Props) => {
  const updateParent = useUpdateEntryParent();
  
  const handleDrop = ({ draggedId, droppedOnId }: DragEvent) => {
    updateParent.mutate({
      id: draggedId,
      parentId: droppedOnId, // null to move to top level
      projectId: entries[0].projectId,
    });
  };
  
  const renderTree = (parentId: string | null = null, depth = 0) => {
    const children = entries.filter(e => e.parentId === parentId);
    
    return children.map(entry => (
      <div key={entry.id} style={{ paddingLeft: `${depth * 20}px` }}>
        <DraggableEntry
          entry={entry}
          onDrop={(droppedOnId) => handleDrop({ 
            draggedId: entry.id, 
            droppedOnId 
          })}
          disabled={updateParent.isLoading}
        />
        {renderTree(entry.id, depth + 1)}
      </div>
    ));
  };
  
  return <div>{renderTree()}</div>;
};
```

## ProjectIndexType Operations

### Enable Index Type

```typescript
// apps/index-pdf-frontend/src/hooks/use-enable-index-type.ts

export const useEnableIndexType = () => {
  const utils = trpc.useContext();
  
  return trpc.projectIndexType.enable.useMutation({
    onMutate: async (input) => {
      await utils.projectIndexType.list.cancel({ projectId: input.projectId });
      
      const previous = utils.projectIndexType.list.getData({
        projectId: input.projectId,
      });
      
      // Optimistically add to list
      utils.projectIndexType.list.setData(
        { projectId: input.projectId },
        (old) => [
          ...(old || []),
          {
            id: `temp-${Date.now()}`,
            indexType: input.indexType,
            color: input.color || getDefaultColor(input.indexType),
            ordinal: input.ordinal || (old?.length || 0) + 1,
            visible: true,
            entryCount: 0,
          } as any,
        ]
      );
      
      return { previous };
    },
    
    onError: (err, input, context) => {
      if (context?.previous) {
        utils.projectIndexType.list.setData(
          { projectId: input.projectId },
          context.previous
        );
      }
      
      // User-friendly addon error
      let errorMessage = 'Failed to enable index type';
      if (err.message.includes('addon') || err.message.includes('access')) {
        errorMessage = 'You need to purchase this index type addon first';
      }
      
      toast.error(errorMessage);
    },
    
    onSuccess: () => {
      toast.success('Index type enabled');
    },
    
    onSettled: (data, err, variables) => {
      utils.projectIndexType.list.invalidate({ projectId: variables.projectId });
      // Also invalidate available types
      utils.projectIndexType.listAvailable.invalidate({ projectId: variables.projectId });
    },
  });
};
```

### Disable Index Type

```typescript
// apps/index-pdf-frontend/src/hooks/use-disable-index-type.ts

export const useDisableIndexType = () => {
  const utils = trpc.useContext();
  
  return trpc.projectIndexType.disable.useMutation({
    onMutate: async (input) => {
      await utils.projectIndexType.list.cancel({ projectId: input.projectId });
      
      const previous = utils.projectIndexType.list.getData({
        projectId: input.projectId,
      });
      
      // Immediately remove from list (soft delete)
      utils.projectIndexType.list.setData(
        { projectId: input.projectId },
        (old) => (old || []).filter(t => t.id !== input.id)
      );
      
      return { previous };
    },
    
    onError: (err, input, context) => {
      if (context?.previous) {
        utils.projectIndexType.list.setData(
          { projectId: input.projectId },
          context.previous
        );
      }
      
      toast.error(`Failed to disable index type: ${err.message}`);
    },
    
    onSuccess: () => {
      toast.success('Index type disabled');
    },
    
    onSettled: (data, err, variables) => {
      utils.projectIndexType.list.invalidate({ projectId: variables.projectId });
      utils.projectIndexType.listAvailable.invalidate({ projectId: variables.projectId });
    },
  });
};
```

### Reorder Index Types

```typescript
// apps/index-pdf-frontend/src/hooks/use-reorder-index-types.ts

export const useReorderIndexTypes = () => {
  const utils = trpc.useContext();
  
  return trpc.projectIndexType.reorder.useMutation({
    onMutate: async (input) => {
      await utils.projectIndexType.list.cancel({ projectId: input.projectId });
      
      const previous = utils.projectIndexType.list.getData({
        projectId: input.projectId,
      });
      
      // Optimistically reorder
      utils.projectIndexType.list.setData(
        { projectId: input.projectId },
        (old) => {
          if (!old) return old;
          
          // Create a map of id -> new ordinal
          const ordinalMap = new Map(
            input.order.map(o => [o.id, o.ordinal])
          );
          
          // Update ordinals
          return old
            .map(type => ({
              ...type,
              ordinal: ordinalMap.get(type.id) ?? type.ordinal,
            }))
            .sort((a, b) => a.ordinal - b.ordinal);
        }
      );
      
      return { previous };
    },
    
    onError: (err, input, context) => {
      if (context?.previous) {
        utils.projectIndexType.list.setData(
          { projectId: input.projectId },
          context.previous
        );
      }
      
      toast.error(`Failed to reorder index types: ${err.message}`);
    },
    
    onSuccess: () => {
      // Silent success (drag-drop doesn't need toast)
    },
    
    onSettled: (data, err, variables) => {
      utils.projectIndexType.list.invalidate({ projectId: variables.projectId });
    },
  });
};
```

## Bulk Index As Modal

```tsx
// apps/index-pdf-frontend/src/app/projects/[projectDir]/editor/_components/bulk-index-as-modal.tsx

import { useBulkUpdateIndexTypes } from '@/hooks/use-bulk-update-index-types';

export const BulkIndexAsModal = ({ 
  selectedMentionIds, 
  documentId,
  onClose 
}: Props) => {
  const [selectedIndexTypes, setSelectedIndexTypes] = useState<string[]>([]);
  const [operation, setOperation] = useState<'add' | 'replace' | 'remove'>('add');
  
  const { data: projectIndexTypes } = trpc.projectIndexType.list.useQuery({
    projectId,
  });
  
  const updateIndexTypes = useBulkUpdateIndexTypes();
  
  const handleSubmit = () => {
    updateIndexTypes.mutate(
      {
        documentId,
        mentionIds: selectedMentionIds,
        indexTypes: selectedIndexTypes,
        operation,
      },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };
  
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogTitle>Update Index Types</DialogTitle>
      <DialogDescription>
        {selectedMentionIds.length} mention(s) selected
      </DialogDescription>
      
      <RadioGroup value={operation} onValueChange={setOperation}>
        <Radio value="add">
          Add to existing types
          <span className="text-sm text-gray-500">
            Mentions will belong to both old and new types
          </span>
        </Radio>
        <Radio value="replace">
          Replace all types
          <span className="text-sm text-gray-500">
            Mentions will only belong to the selected types
          </span>
        </Radio>
        <Radio value="remove">
          Remove types
          <span className="text-sm text-gray-500">
            Remove selected types from mentions
          </span>
        </Radio>
      </RadioGroup>
      
      <MultiSelect
        label="Index Types"
        value={selectedIndexTypes}
        onChange={setSelectedIndexTypes}
        options={projectIndexTypes?.map(t => ({
          value: t.id,
          label: t.displayName,
          color: t.color,
        }))}
      />
      
      <DialogActions>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={
            selectedIndexTypes.length === 0 || updateIndexTypes.isLoading
          }
        >
          {updateIndexTypes.isLoading ? 'Updating...' : 'Update'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
```

## Implementation Checklist

### Multi-Type Mentions
- [x] ~~Create `useUpdateMentionIndexTypes` hook~~ (Not needed - `useBulkUpdateIndexTypes` handles single mentions)
- [x] Create `useBulkUpdateIndexTypes` hook
- [x] Implement cache invalidation for affected pages
- [x] Build bulk index as modal UI
- [x] Add operation selector (add/replace/remove)
- [ ] Test multi-type filtering in sidebar sections *(Deferred to Task 5D-4)*

### Hierarchy Operations
- [x] Create `useUpdateEntryParent` hook
- [x] Implement drag-drop in entry tree
- [x] Add user-friendly error messages for cycle/depth
- [x] Add visual feedback during drag
- [ ] Test tree re-rendering after moves *(Deferred to Task 5D-4)*

### ProjectIndexType Operations
- [x] Create `useEnableIndexType` hook
- [x] Create `useDisableIndexType` hook
- [x] ~~Create `useReorderIndexTypes` hook~~ (Not needed - backend removed reorder endpoint, ordinal is client-side)
- [x] Add addon purchase messaging
- [ ] Test sidebar section visibility updates *(Deferred to Task 5D-4)*
- [ ] ~~Test reordering sidebar sections~~ (Not applicable - no backend support)

### Testing *(Deferred to Task 5D-4: Polish & Testing)*
- [ ] Test bulk operations with 100+ mentions
- [ ] Test cycle detection UX
- [ ] Test depth limit messaging
- [ ] Test multi-type cache invalidation
- [ ] Test addon access error messages
- [ ] Test concurrent hierarchy changes

### Implementation Status
- ✅ All hooks implemented with proper TypeScript types
- ✅ All UI components created
- ✅ TypeScript typecheck passes
- ✅ Linter errors resolved
- ✅ Rules of Hooks compliance
- ✅ Proper cache invalidation patterns

## Related Documentation

- [Task 5D-1: Core Optimistic Updates](./task-5d-1-core-optimistic-updates.md) - Basic CRUD patterns
- [Task 5D-3: State Migration & Cleanup](./task-5d-3-state-migration-cleanup.md) - Remove mock data
