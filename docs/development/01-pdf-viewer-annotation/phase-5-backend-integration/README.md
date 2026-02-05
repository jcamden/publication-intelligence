# Phase 5: Backend Integration

**Status:** ⚪ Ready to Start  
**Dependencies:** Phase 4 completion ✅  
**Duration:** 7-10 days

## Overview

Persist mentions, entries, and index types to Gel database with CRUD operations and optimistic updates. This phase transitions from Phase 4's local state management to full backend integration.

## Key Data Model Summary

### Addon-Based Access Model

**User purchases index type addons → Project enables index types → Entries & Mentions use those types**

1. **IndexTypeDefinition** (System-wide catalog)
   - Defines available index types (Subject, Author, Scripture, Bibliography, etc.)
   - Each has default color and description
   - Managed by system, rarely changes

2. **UserIndexTypeAddon** (User's purchased addons)
   - Junction table: which users have access to which index types
   - Managed by payment system (Stripe webhooks)
   - Users can only see/use index types they have addons for

3. **ProjectIndexType** (Project's enabled types with customization)
   - Projects enable index types the owner has addons for
   - Each has project-specific color and ordinal customization
   - Access control: Collaborators without addon cannot see this index type

4. **IndexEntry** (Content items, one per index type)
   - Each entry belongs to exactly ONE project index type (`project_index_type` field)
   - Same concept in multiple indexes = separate entry records
   - Parent/child hierarchy within same index type only
   - Example: "Kant" in Subject index is separate from "Kant" in Author index
   - Access: User needs addon to see/create entries in that index type

5. **IndexMention** (Highlights with multi-type support)
   - Links to one entry via `entry` field
   - Belongs to one or more project index types via `project_index_types` relationship
   - Highlight color(s) derived from index types, not entry
   - Multi-type mentions render with diagonal stripes
   - Access: User can see mention if they have addon for ANY of its types

**Collaborative Projects:** Users only see index types they have addons for. If User A has Subject+Author addons but User B has only Subject addon, User B sees only Subject sections/mentions in the project. No error messages - unavailable types are simply invisible.

## Sub-Tasks

### [5A: Schema Migration & Index Type Backend](./task-5a-schema-migration.md)
**Duration:** 2-3 days  
**Status:** ⚪ Not Started

Schema changes (IndexTypeDefinition, UserIndexTypeAddon, ProjectIndexType, IndexEntry.project_index_type, IndexMention.project_index_types, Context). Addon-based access control. No migration needed (fresh start). CRUD endpoints for enabling/disabling index types in projects.

### [5B: IndexEntry Backend](./task-5b-index-entry-backend.md)
**Duration:** 2 days  
**Status:** ⚪ Not Started

IndexEntry CRUD operations, hierarchy management, search/autocomplete, exact match detection. Filtered by user's accessible project index types.

### [5C: IndexMention Backend](./task-5c-index-mention-backend.md)
**Duration:** 2-3 days  
**Status:** ⚪ Not Started

IndexMention CRUD with multi-type support, page filtering, bulk operations for "Index As" feature. Validates user has addons for all selected types.

### [5D: Optimistic Updates & Error Handling](./task-5d-optimistic-updates.md)
**Duration:** 1-2 days  
**Status:** ⚪ Not Started

React Query optimistic updates, error handling, retry logic, loading states, state migration from local to API.

## Completion Criteria

Phase 5 complete when:
- [ ] Schema created (IndexTypeDefinition, UserIndexTypeAddon, ProjectIndexType, etc.)
- [ ] Default addon grants working (all users get Subject, Author, Scripture)
- [ ] ProjectIndexType CRUD working (enable/disable/reorder)
- [ ] Addon access control working (users only see types they have access to)
- [ ] IndexEntry CRUD working (filtered by accessible types)
- [ ] IndexMention CRUD working (multi-type support, addon validation)
- [ ] Parent/child hierarchy constraints enforced
- [ ] Entry search and exact match working
- [ ] Optimistic updates smooth (no flicker)
- [ ] Error handling graceful (retry, rollback)
- [ ] Local state replaced with tRPC queries
- [ ] Context schema ready for Phase 6
- [ ] Collaborative access tested (users with different addons)
- [ ] Performance acceptable (< 200ms for operations)

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

## State Migration Strategy

**Phase 4 (local state):**
```tsx
const [mentions, setMentions] = useState<Mention[]>([]);
const [indexEntries, setIndexEntries] = useState<IndexEntry[]>([]);
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

## Migration Path

1. Keep Phase 4 local state working
2. Add API endpoints (no UI changes)
3. Replace useState with useQuery (one at a time)
4. Add optimistic updates
5. Add error handling
6. Remove local state

## Performance Targets

- Mention CRUD operations: < 200ms
- Entry search/autocomplete: < 300ms (with debounce)
- Page load with mentions: < 500ms
- Optimistic updates: Instant (no perceived latency)
- Cache hit: < 50ms

## Success Criteria

- ✅ Mentions persist to database
- ✅ CRUD operations functional
- ✅ Optimistic updates working
- ✅ Error handling graceful
- ✅ Performance acceptable
- ✅ Data integrity maintained
- ✅ Schema migration completed without data loss
- ✅ All breaking changes documented and tested

## Related Documentation

- [Phase 4 README](../phase-4-highlight-management/README.md) - Frontend implementation (complete)
- [Phase 6 Context System](../phase-6-context-system/) - Next phase uses Context schema

## Next Phase

[Phase 6: Context System](../phase-6-context-system/) builds on the Context schema created in Task 5A, adding UI for ignore/page-number regions.
