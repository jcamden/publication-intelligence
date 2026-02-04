# Task 5A: Schema Migration & IndexType Backend

**Duration:** 2-3 days  
**Status:** ⚪ Not Started  
**Dependencies:** Phase 4 completion

## Overview

Implement critical schema changes (IndexType, IndexEntry.index_type, IndexMention.index_types, Context) and build IndexType CRUD backend. This is the foundational task with breaking changes that all other Phase 5 tasks depend on.

**Work Includes:**
1. Schema changes in `db/gel/dbschema/indexing.gel`
2. Migration scripts for existing data
3. IndexType tRPC endpoints (CRUD + reorder)
4. Frontend integration for index type management
5. Testing and validation

## Key Design Decisions Driving Schema Changes

### 1. IndexEntry Per Index Type
**Decision:** Each IndexEntry belongs to exactly ONE index type. Same concept in multiple indexes = separate entries.

**Reason:** Enables different hierarchies per index, simpler queries, clearer ownership.

### 2. Colors From Index Types
**Decision:** Highlight colors derived from IndexType configuration, not from individual entries.

**Reason:** User configures colors at index type level. All Subject highlights are yellow, regardless of specific entry.

### 3. Multi-Type Mentions
**Decision:** Mentions can belong to multiple index types via `index_types` array.

**Reason:** A single highlight can be tagged for Subject AND Author (diagonal stripes with both colors).

### 4. Context System
**Decision:** Separate Context entities for ignore/page-number regions, independent color customization.

**Reason:** Different purpose than mentions/entries. Need per-context colors, not tied to index types.

---

## Required Schema Changes

### 1. Add IndexType Table ⚠️ **NEW TABLE**

**Location:** After Project, before IndexEntry

```edgeql
# ============================================================================
# IndexType - Project-level index configuration
# ============================================================================
#
# Defines available index types for a project (Subject, Author, Scripture, etc.)
# Each type has customizable color and visibility settings.
#
# Default index types created with new projects:
# - Subject (ordinal=0, color=#FCD34D yellow)
# - Author (ordinal=1, color=#93C5FD blue)
# - Scripture (ordinal=2, color=#86EFAC green)
#
# Users can add custom index types, customize colors, and reorder.

type IndexType {
  required project: Project {
    on target delete delete source;
  };
  
  # Type name (e.g., 'subject', 'author', 'scripture', 'bibliography')
  # Unique per project
  required name: str;
  
  # Display order and default color assignment
  # 0 = first index type (yellow), 1 = second (blue), etc.
  required ordinal: int16;
  
  # Hex color for highlights of this index type
  # User-customizable, affects all mentions tagged with this type
  required color: str {
    constraint regexp(r'^#[0-9A-Fa-f]{6}$');
  };
  
  # Visibility toggle (hide/show in UI)
  required visible: bool {
    default := true;
  };
  
  required created_at: datetime {
    default := datetime_current();
  };
  updated_at: datetime;
  
  # Soft deletion
  deleted_at: datetime;
  
  # Relationships
  multi entries := .<index_type[is IndexEntry];
  
  # Computed properties
  property entry_count := count(.entries filter not exists .deleted_at);
  property is_deleted := exists .deleted_at;
  
  # Constraints
  constraint exclusive on ((.project, .name)) except (exists .deleted_at);
  constraint exclusive on ((.project, .ordinal)) except (exists .deleted_at);
  
  # Access control: inherit from project
  access policy project_access
    allow all
    using (.project.can_access);
}
```

**Migration Notes:**
- Create default index types for existing projects (Subject, Author, Scripture)
- Assign default colors based on ordinal

---

### 2. Update IndexEntry Table ⚠️ **BREAKING CHANGE**

**Add `index_type` field and parent constraint:**

```edgeql
type IndexEntry {
  required project: Project {
    on target delete delete source;
  };
  
  # NEW: Index type this entry belongs to
  # Each entry belongs to exactly ONE index type
  # Example: "Kant" in Subject is separate from "Kant" in Author
  required index_type: IndexType {
    on target delete delete source;
  };
  
  # ... existing fields (slug, label, description, status, revision, deleted_at) ...
  
  # Parent entry (hierarchy within same index type only)
  parent: IndexEntry {
    on target delete allow;
  };
  multi children := .<parent[is IndexEntry];
  
  # ... existing timestamps and relationships ...
  
  # NEW CONSTRAINT: Parent must have same index_type
  constraint expression on (
    not exists .parent or .parent.index_type = .index_type
  ) {
    errmessage := "Parent entry must have the same index_type";
  };
  
  # Update slug uniqueness to be per index_type
  constraint exclusive on ((.project, .index_type, .slug)) {
    # Slug uniqueness per project AND index type
    # "kant_immanuel" can exist in both Subject and Author
  };
  
  # ... existing access policies ...
}
```

**Migration Strategy:**
1. Add `index_type` field as optional first
2. Create default IndexTypes for existing projects
3. Assign all existing entries to "Subject" index type (or prompt user)
4. Make `index_type` required
5. Update application code to filter entries by index_type

**Data Impact:**
- **BREAKING:** Existing entries need index_type assignment
- Need migration script to assign default type
- May need user input for ambiguous cases

---

### 3. Update IndexMention Table

**Add `index_types` array field:**

```edgeql
type IndexMention {
  # ... existing fields (document, entry, page, page_number, etc.) ...
  
  # NEW: Index types this mention is tagged with
  # Multi-type support: ['subject', 'author']
  # Determines which sidebar sections show this mention
  # Determines highlight colors (single type = solid, multi-type = stripes)
  required multi index_types: str {
    default := {'subject'}; # Default to subject if not specified
  };
  
  # ... rest of existing fields ...
  
  # NEW CONSTRAINT: At least one index type
  constraint expression on (
    count(.index_types) > 0
  ) {
    errmessage := "Mention must have at least one index type";
  };
  
  # ... existing constraints and access policies ...
}
```

**Migration Strategy:**
1. Add `index_types` field with default value
2. Existing mentions automatically get `index_types = ['subject']`
3. Update application code to use array instead of single value
4. Add UI for multi-type tagging (Phase 4C enhancement)

**Data Impact:**
- **Non-breaking:** Default value makes migration safe
- Existing data preserved, all mentions default to Subject

---

### 4. Add Context Table ⚠️ **NEW TABLE**

**Location:** After IndexMention, before Event

```edgeql
# ============================================================================
# Context - Region-based contexts for ignore/page-number extraction
# ============================================================================
#
# Contexts mark regions on PDF pages for special handling:
# - Ignore contexts: Exclude regions from text extraction (headers, footers)
# - Page-number contexts: Auto-extract page numbers from marked regions
#
# Contexts can apply to multiple pages via page_config.

scalar type ContextType extending enum<
  ignore,       # Exclude region from text extraction
  page_number   # Extract text as canonical page number
>;

scalar type PageConfigMode extending enum<
  this_page,    # Apply to current page only
  all_pages,    # Apply to all pages
  page_range,   # Apply to page range (e.g., 5-150)
  custom        # Apply to custom list (e.g., "1-2,5-6,8")
>;

type Context {
  required project: Project {
    on target delete delete source;
  };
  
  # Context type
  required context_type: ContextType;
  
  # Bounding box in PDF user space (coordinates in PDF points)
  required bbox_pdf: BoundingBox;
  
  # Page configuration (which pages this context applies to)
  required page_config: json;
  # Structure: {
  #   mode: 'this-page' | 'all-pages' | 'page-range' | 'custom',
  #   pages?: string,     # "1-50" or "1-2,5-6,8,10-12"
  #   everyOther?: bool,  # Apply to every other page
  #   startPage?: int     # Starting page for "every other"
  # }
  
  # For page-number contexts: extracted page number text
  extracted_page_number: str;
  
  # Extraction confidence for page-number contexts
  extraction_confidence: str; # 'high' | 'medium' | 'low'
  
  # Color for rendering context on PDF
  # Independent of index type colors
  # Defaults: Red (#FCA5A5) for ignore, Purple (#C4B5FD) for page-number
  required color: str {
    constraint regexp(r'^#[0-9A-Fa-f]{6}$');
  };
  
  # Visibility toggle
  required visible: bool {
    default := true;
  };
  
  required created_at: datetime {
    default := datetime_current();
  };
  updated_at: datetime;
  
  # Soft deletion
  deleted_at: datetime;
  
  # Computed properties
  property is_deleted := exists .deleted_at;
  property is_ignore := .context_type = ContextType.ignore;
  property is_page_number := .context_type = ContextType.page_number;
  
  # Access control: inherit from project
  access policy project_access
    allow all
    using (.project.can_access);
}
```

**Migration Notes:**
- New table, no migration needed
- No existing data affected

---

### 5. Update DocumentPage Table (Phase 7)

**Add multi-layer page numbering fields:**

```edgeql
type DocumentPage {
  # ... existing fields (document, page_number, text_content, metadata) ...
  
  # Multi-layer page numbering (Phase 7)
  # Layer 1: Document page number (always present, 1-based)
  # Already exists as `page_number`
  
  # Layer 2: Context-extracted page number (from page-number contexts)
  context_page_number: str;
  context_extraction_confidence: str; # 'high' | 'medium' | 'low'
  
  # Layer 3: Project-level override (from project.page_number_override_string)
  project_override_page_number: str;
  
  # Layer 4: Page-level override (manual override for single page)
  page_override_page_number: str;
  
  # Computed: Canonical page number (highest priority layer that has value)
  # Priority: page_override > project_override > context_page > page_number
  property canonical_page_number := (
    .page_override_page_number ??
    .project_override_page_number ??
    .context_page_number ??
    <str>.page_number
  );
  
  # Whether this page is indexable (false if page number is [bracketed])
  required is_indexable: bool {
    default := true;
  };
  
  # ... existing relationships and constraints ...
}
```

**Migration Strategy:**
1. Add fields as optional
2. Existing pages keep only document page_number
3. Phase 7 implements context extraction and overrides

**Data Impact:**
- **Non-breaking:** All fields optional except is_indexable
- Existing data unaffected

---

### 6. Update Project Table (Phase 7)

**Add page numbering override fields:**

```edgeql
type Project {
  # ... existing fields ...
  
  # Project-level page number override string (Phase 7)
  # Format: "i,ii,iii,iv,1-150"
  # Applies to all pages in sequence
  page_number_override_string: str;
  
  # Validation errors from last override string parse
  # Helps user correct syntax issues
  page_number_validation_errors: array<str>;
  
  # ... existing relationships and computed properties ...
}
```

**Migration Strategy:**
1. Add fields as optional
2. No default values needed
3. Phase 7 implements override UI

**Data Impact:**
- **Non-breaking:** Fields optional
- No impact on existing projects

---

## Migration Checklist

### Phase 5 (Backend Integration)

- [ ] **Critical:** Create IndexType table
- [ ] **Critical:** Add index_type field to IndexEntry (BREAKING)
- [ ] **Critical:** Add index_types array to IndexMention
- [ ] **Critical:** Create Context table
- [ ] Create migration script for existing data:
  - [ ] Create default IndexTypes for all projects
  - [ ] Assign all existing IndexEntries to Subject index type
  - [ ] Assign all existing IndexMentions `index_types = ['subject']`
- [ ] Update application code to use new fields
- [ ] Update tRPC endpoints to handle index types

### Phase 7 (Page Numbering)

- [ ] Add page numbering fields to DocumentPage
- [ ] Add override fields to Project
- [ ] Implement page number extraction logic
- [ ] Build override string parser

---

## Breaking Changes Summary

### ⚠️ IndexEntry.index_type (Required Field)

**Impact:** All existing entries need type assignment

**Migration Path:**
1. Add field as optional
2. Backfill with "Subject" default (or prompt user)
3. Make field required
4. Update all entry creation code

### ⚠️ IndexEntry Slug Uniqueness

**Impact:** Slug constraint changes from per-project to per-project-per-type

**Migration Path:**
1. Check for duplicate slugs across would-be-separate indexes
2. Rename duplicates if found
3. Update constraint

---

## Non-Breaking Changes

### ✅ IndexMention.index_types

**Impact:** None - has default value

**Migration:** Automatic via default value

### ✅ Context Table

**Impact:** None - new table

**Migration:** None needed

### ✅ DocumentPage Page Numbering Fields

**Impact:** None - all optional fields

**Migration:** None needed until Phase 7

---

---

## IndexType tRPC Endpoints

After schema migration, implement IndexType management endpoints.

### Router: `indexType`

```typescript
// apps/index-pdf-backend/src/routers/index-type.router.ts

export const indexTypeRouter = router({
  // List all index types for project
  list: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      return await ctx.db.query(e.select(e.IndexType, (indexType) => ({
        ...e.IndexType['*'],
        entry_count: true,
        filter: e.op(
          e.op(indexType.project.id, '=', e.uuid(input.projectId)),
          'and',
          e.op('not', e.op('exists', indexType.deleted_at))
        ),
        order_by: indexType.ordinal,
      })));
    }),
  
  // Create new index type
  create: protectedProcedure
    .input(z.object({
      projectId: z.string().uuid(),
      name: z.string().min(1).max(50),
      color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
      ordinal: z.number().int().min(0),
    }))
    .mutation(async ({ input, ctx }) => {
      // Validate unique name per project
      // Create IndexType
      // Return created type
    }),
  
  // Update index type (name, color, visibility)
  update: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      name: z.string().min(1).max(50).optional(),
      color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      visible: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Validate ownership
      // Update fields
      // Return updated type
    }),
  
  // Reorder index types (change ordinals)
  reorder: protectedProcedure
    .input(z.object({
      projectId: z.string().uuid(),
      order: z.array(z.object({
        id: z.string().uuid(),
        ordinal: z.number().int().min(0),
      })),
    }))
    .mutation(async ({ input, ctx }) => {
      // Bulk update ordinals
      // Used for drag-drop reordering in UI
    }),
  
  // Delete index type (soft delete)
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      // Validate ownership
      // Check if entries exist (warn user or cascade)
      // Set deleted_at timestamp
    }),
});
```

### Frontend Integration

```tsx
// apps/index-pdf-frontend/src/app/projects/[projectDir]/settings/index-types.tsx

export const IndexTypesSettings = () => {
  const { projectId } = useProject();
  
  // Query index types
  const { data: indexTypes, isLoading } = trpc.indexType.list.useQuery({
    projectId,
  });
  
  // Mutations
  const createType = trpc.indexType.create.useMutation({
    onSuccess: () => {
      utils.indexType.list.invalidate({ projectId });
    },
  });
  
  const updateType = trpc.indexType.update.useMutation({
    onSuccess: () => {
      utils.indexType.list.invalidate({ projectId });
    },
  });
  
  const reorderTypes = trpc.indexType.reorder.useMutation({
    onSuccess: () => {
      utils.indexType.list.invalidate({ projectId });
    },
  });
  
  // UI: List with color pickers, visibility toggles, drag-drop reorder
  // Create new type button with modal
  // Edit/delete actions per type
  
  return (
    <div>
      {/* Index type management UI */}
    </div>
  );
};
```

---

## Testing Requirements

- [ ] Migration script tested on copy of production data
- [ ] All existing mentions render correctly after migration
- [ ] Entry creation enforces index_type requirement
- [ ] Parent entries validate same index_type constraint
- [ ] Multi-type mention tagging works
- [ ] Context creation and rendering works
- [ ] No data loss during migration
- [ ] Rollback plan documented
- [ ] IndexType CRUD operations work
- [ ] Index type reordering works
- [ ] Color customization persists correctly
- [ ] Visibility toggle affects UI correctly

---

## Implementation Checklist

### Schema Migration
- [ ] Write migration script (EdgeQL)
- [ ] Test migration on dev database
- [ ] Create default IndexTypes for test projects
- [ ] Verify data integrity after migration
- [ ] Document rollback procedure

### IndexType Backend
- [ ] Create `indexType` tRPC router
- [ ] Implement `list` endpoint with filtering
- [ ] Implement `create` endpoint with validation
- [ ] Implement `update` endpoint
- [ ] Implement `reorder` endpoint for drag-drop
- [ ] Implement `delete` endpoint with cascade checks
- [ ] Add access control checks (project ownership)
- [ ] Write unit tests for endpoints

### Frontend Integration
- [ ] Create index type settings page
- [ ] Add color picker UI
- [ ] Add visibility toggles
- [ ] Implement drag-drop reordering
- [ ] Add create/edit/delete dialogs
- [ ] Connect to tRPC endpoints
- [ ] Add loading and error states

### Validation
- [ ] Run migration on staging database
- [ ] Test all CRUD operations
- [ ] Verify color changes affect highlights
- [ ] Verify ordinal changes affect order
- [ ] Test edge cases (delete with entries, duplicate names)
- [ ] Performance test with many index types

---

## Next Task

[Task 5B: IndexEntry Backend](./task-5b-index-entry-backend.md) - Build entry CRUD with index_type filtering and hierarchy management.
