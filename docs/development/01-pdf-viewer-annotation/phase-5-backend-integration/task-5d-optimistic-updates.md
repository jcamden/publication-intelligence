# Task 5D: Frontend Integration & Polish

**Duration:** 4-6 days  
**Status:** ⚪ Not Started  
**Dependencies:** Task 5C completion (IndexMention backend)

## Overview

Integrate frontend with backend APIs, implement optimistic updates for smooth UX, remove mock data, fix bugs, and polish the user experience with loading states, error handling, and comprehensive testing.

**This task is split into 4 sub-tasks for manageable implementation:**

1. **[Task 5D-1: Core Optimistic Updates](./task-5d-1-core-optimistic-updates.md)** (1-2 days)
   - Entry and mention CRUD with optimistic updates
   - Adapters for data conversion
   - Basic error handling and retry logic

2. **[Task 5D-2: Advanced Operations](./task-5d-2-advanced-operations.md)** (1-2 days)
   - Multi-type mention operations
   - Bulk updateIndexTypes
   - Hierarchy management (drag-drop, cycle detection)
   - ProjectIndexType operations

3. **[Task 5D-3: State Migration & Cleanup](./task-5d-3-state-migration-cleanup.md)** (1 day)
   - Remove all mock data from frontend
   - Replace useState with tRPC queries
   - Fix project settings index types bug
   - Code cleanup

4. **[Task 5D-4: Polish & Testing](./task-5d-4-polish-testing.md)** (1-2 days)
   - Skeleton loaders and loading states
   - Error boundaries
   - Network status detection
   - Confirmation dialogs
   - Frontend integration tests

## Key Decisions

Based on discussions, the following decisions were made:

### Variants Handling
**Question:** Where should variants (aliases) be handled?  
**Answer:** Inline in the entry form. Backend stores them in `indexVariants` table (already implemented in 5B).

### Soft Delete Behavior
**Question:** Should optimistic updates hide items immediately or wait for server?  
**Answer:** Hide immediately. Users expect instant feedback, and soft delete is already implemented in the backend.

### Revision Fields
**Question:** What are revision fields for?  
**Answer:** Track edit history version numbers. Not currently used in MVP but reserved for future audit/versioning features. No optimistic update concerns - server increments automatically.

### Color Persistence
**Question:** Does color customization persist?  
**Answer:** Yes, already implemented! `usePersistColorChange` hook in sidebar components debounces changes and calls `projectIndexType.update`. No additional work needed.

### Draft-to-Mention Boundary
**Question:** When does draft state transition to mention?  
**Answer:** When user clicks "Attach" button in mention creation popover. Same for entries - when user clicks "Create" button. Before that, state lives locally in PdfViewer/form components.

## Additional Tasks

Beyond the core integration work, this task includes:

### Mock Data Removal
- Clear out all Phase 4 mock data generators
- Remove hardcoded test entries, mentions, highlights
- Rely solely on backend data via tRPC

### Bug Fixes
- **Project Settings Index Types**: Selected index types in multiselect don't persist when clicking "Update Project"
  - Root cause: Form state likely missing indexTypes field or mutation not including them
  - Fix in task 5D-3

## Success Criteria

Task 5D complete when:
- [ ] All CRUD operations use tRPC with optimistic updates
- [ ] Mock data completely removed from frontend
- [ ] Project settings index types bug fixed
- [ ] Loading states render properly
- [ ] Error handling graceful with user-friendly messages
- [ ] Network offline detection working
- [ ] Confirmation dialogs for destructive actions
- [ ] No flickering during optimistic updates
- [ ] Performance acceptable (instant perceived latency)
- [ ] Frontend integration tests passing

## Architecture Notes

### Optimistic Update Pattern

All mutations follow this structure:

```typescript
useMutation({
  onMutate: async (input) => {
    // 1. Cancel outgoing queries
    // 2. Snapshot current state
    // 3. Optimistically update cache
    // 4. Return context for rollback
  },
  onError: (err, input, context) => {
    // 5. Rollback using snapshot
    // 6. Show user-friendly error toast
  },
  onSuccess: (data) => {
    // 7. Replace temp data with server response
    // 8. Show success toast
  },
  onSettled: () => {
    // 9. Invalidate queries to refetch
  },
})
```

### Cache Invalidation Strategy

- **Single-type operations**: Invalidate queries for that specific projectIndexTypeId
- **Multi-type operations**: Invalidate queries for all affected index types
- **Hierarchy operations**: Invalidate parent's projectIndexTypeId queries
- **Page mentions**: Invalidate by documentId + pageNumber
- **Project settings**: Invalidate project-level queries

### Error Message Mapping

- **Cycle detection**: "Cannot move entry: Would create a circular hierarchy"
- **Depth limit**: "Cannot move entry: Maximum hierarchy depth (5 levels) exceeded"
- **Addon access**: "You need to purchase this index type addon first"
- **Network errors**: "No internet connection - changes will be saved when restored"
- **Validation errors**: Use server message or friendly fallback

## Related Documentation

- [Task 5A: Schema Migration](./task-5a-schema-migration.md) - Database schema
- [Task 5B: IndexEntry Backend](./task-5b-index-entry-backend.md) - Entry endpoints
- [Task 5C: IndexMention Backend](./task-5c-index-mention-backend.md) - Mention endpoints
- [Phase 4 README](../phase-4-highlight-management/README.md) - Frontend implementation to replace

## Sub-Task Links

**Implementation Order:**

1. **[Task 5D-1: Core Optimistic Updates](./task-5d-1-core-optimistic-updates.md)**
   - Entry CRUD with optimistic updates
   - Mention CRUD with optimistic updates
   - Adapters (draftToMentionInput, mentionToPdfHighlight)
   - Query client configuration with retry logic

2. **[Task 5D-2: Advanced Operations](./task-5d-2-advanced-operations.md)**
   - Multi-type mention cache invalidation
   - Bulk updateIndexTypes (add/replace/remove)
   - Hierarchy drag-drop with cycle detection UX
   - ProjectIndexType enable/disable/reorder

3. **[Task 5D-3: State Migration & Cleanup](./task-5d-3-state-migration-cleanup.md)**
   - Remove all mock data generators
   - Replace useState with tRPC useQuery
   - Fix project settings index types persistence bug
   - Code cleanup and test updates

4. **[Task 5D-4: Polish & Testing](./task-5d-4-polish-testing.md)**
   - Skeleton loaders for all data fetching
   - Error boundaries for graceful degradation
   - Network status detection and offline banner
   - Confirmation dialogs for destructive actions
   - Comprehensive frontend integration tests

---

## Phase 5 Completion

After this task, Phase 5 is complete! All backend integration is functional with polished UX.

**Next Phase:** [Phase 6: Context System](../../phase-6-context-system/) - Build UI for ignore/page-number contexts using the Context schema from Task 5A.
