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

### 1. Addon-Based Index Type Access
**Decision:** Index types (Subject, Author, Scripture, etc.) are separate addons that users purchase. Users can only enable index types they have purchased addons for. In collaborative projects, users without an addon cannot see or interact with that index type at all.

**Reason:** Enables flexible monetization, clear feature gating, and prevents confusion when collaborators have different addon sets.

### 2. Global Index Type Definitions
**Decision:** System-wide catalog of available index types via `IndexTypeDefinition` table. Projects reference these definitions via `ProjectIndexType` junction table.

**Reason:** Centralized addon management, consistent naming/defaults across projects, easier to add new index types system-wide.

### 3. IndexEntry Per Index Type
**Decision:** Each IndexEntry belongs to exactly ONE index type. Same concept in multiple indexes = separate entries.

**Reason:** Enables different hierarchies per index, simpler queries, clearer ownership.

### 4. Colors From Index Types
**Decision:** Highlight colors derived from ProjectIndexType configuration, not from individual entries.

**Reason:** User configures colors at project-level index type. All Subject highlights are yellow, regardless of specific entry.

### 5. Multi-Type Mentions
**Decision:** Mentions can belong to multiple index types via `index_types` array.

**Reason:** A single highlight can be tagged for Subject AND Author (diagonal stripes with both colors). But user must have addons for all selected types.

### 6. Context System
**Decision:** Separate Context entities for ignore/page-number regions, independent color customization.

**Reason:** Different purpose than mentions/entries. Need per-context colors, not tied to index types.

---

## Required Schema Changes

### 1. Add IndexTypeDefinition Table ⚠️ **NEW TABLE**

**Location:** Early in schema, before User relationships

```edgeql
# ============================================================================
# IndexTypeDefinition - System-wide catalog of available index types
# ============================================================================
#
# Defines all possible index types that can be purchased as addons.
# These are seeded by system and rarely change.
#
# Examples:
# - subject (default_color=#FCD34D yellow)
# - author (default_color=#93C5FD blue)
# - scripture (default_color=#86EFAC green)
# - bibliography (default_color=#FCA5A5 red)

type IndexTypeDefinition {
  # Unique identifier (e.g., 'subject', 'author', 'scripture')
  required name: str {
    constraint exclusive;
  };
  
  # Display name for UI (e.g., 'Subject', 'Author', 'Scripture')
  required display_name: str;
  
  # Default color for new projects
  required default_color: str {
    constraint regexp(r'^#[0-9A-Fa-f]{6}$');
  };
  
  # Description for addon marketplace
  description: str;
  
  # Default ordinal for new projects
  required default_ordinal: int16;
  
  required created_at: datetime {
    default := datetime_current();
  };
  
  # System-managed, no soft delete
  # To disable: remove from marketplace, don't delete definition
  
  # Relationships
  multi user_addons := .<index_type_definition[is UserIndexTypeAddon];
  multi project_usages := .<definition[is ProjectIndexType];
}
```

**Initial Seed Data:**
```edgeql
INSERT IndexTypeDefinition {
  name := 'subject',
  display_name := 'Subject',
  default_color := '#FCD34D',
  description := 'Index subjects, topics, and concepts',
  default_ordinal := 0
};
INSERT IndexTypeDefinition {
  name := 'author',
  display_name := 'Author',
  default_color := '#93C5FD',
  description := 'Index authors and contributors',
  default_ordinal := 1
};
INSERT IndexTypeDefinition {
  name := 'scripture',
  display_name := 'Scripture',
  default_color := '#86EFAC',
  description := 'Index biblical references and citations',
  default_ordinal := 2
};
INSERT IndexTypeDefinition {
  name := 'bibliography',
  display_name := 'Bibliography',
  default_color := '#FCA5A5',
  description := 'Index bibliographic references',
  default_ordinal := 3
};
```

---

### 2. Add UserIndexTypeAddon Table ⚠️ **NEW TABLE**

**Location:** After IndexTypeDefinition, relates to User

```edgeql
# ============================================================================
# UserIndexTypeAddon - User's purchased index type addons
# ============================================================================
#
# Junction table tracking which users have purchased which index type addons.
# Users can only enable index types in projects if they have the addon.
#
# Addon purchase/management happens outside this system (Stripe, etc.)
# This table reflects current entitlements.

type UserIndexTypeAddon {
  required user: User {
    on target delete delete source;
  };
  
  required index_type_definition: IndexTypeDefinition {
    on target delete delete source;
  };
  
  # When addon was granted
  required granted_at: datetime {
    default := datetime_current();
  };
  
  # Optional expiration (null = permanent/lifetime)
  expires_at: datetime;
  
  # Computed properties
  property is_active := not exists .expires_at or .expires_at > datetime_current();
  property is_expired := exists .expires_at and .expires_at <= datetime_current();
  
  # Constraints
  constraint exclusive on ((.user, .index_type_definition));
  
  # Access control: user can see their own addons
  access policy user_access
    allow all
    using (.user = global current_user);
}
```

**Migration Notes:**
- Grant default addons (subject, author, scripture) to all existing users
- Future: webhook from payment system adds/removes addon records

---

### 3. Add ProjectIndexType Table ⚠️ **NEW TABLE** (replaces old IndexType)

**Location:** After Project, before IndexEntry

```edgeql
# ============================================================================
# ProjectIndexType - Project's enabled index types with customization
# ============================================================================
#
# Projects can enable index types that the user has purchased addons for.
# Each enabled index type can be customized per-project (color, visibility, order).
#
# Access control: Users without the addon cannot see this index type in the project.

type ProjectIndexType {
  required project: Project {
    on target delete delete source;
  };
  
  # Reference to system-wide definition
  required definition: IndexTypeDefinition {
    on target delete delete source;
  };
  
  # Project-specific customization
  required ordinal: int16;
  
  # Project-specific color (can override default)
  required color: str {
    constraint regexp(r'^#[0-9A-Fa-f]{6}$');
  };
  
  # Visibility toggle (hide/show in UI for this project)
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
  multi entries := .<project_index_type[is IndexEntry];
  
  # Computed properties
  property entry_count := count(.entries filter not exists .deleted_at);
  property is_deleted := exists .deleted_at;
  property name := .definition.name;
  property display_name := .definition.display_name;
  
  # Constraints
  constraint exclusive on ((.project, .definition)) except (exists .deleted_at);
  constraint exclusive on ((.project, .ordinal)) except (exists .deleted_at);
  
  # Access control: Project members who have the addon can see this
  access policy addon_access
    allow all
    using (
      e.op(
        .project.can_access,
        'and',
        e.op(
          .definition,
          'in',
          global current_user.index_type_addons.index_type_definition
        )
      )
    );
}
```

**Migration Notes:**
- No migration needed (fresh start)
- When user creates project, auto-enable index types they have addons for

---

### 4. Update IndexEntry Table

**Add `project_index_type` field and parent constraint:**

```edgeql
type IndexEntry {
  required project: Project {
    on target delete delete source;
  };
  
  # NEW: Project index type this entry belongs to
  # Each entry belongs to exactly ONE index type
  # Example: "Kant" in Subject is separate from "Kant" in Author
  required project_index_type: ProjectIndexType {
    on target delete delete source;
  };
  
  # ... existing fields (slug, label, description, status, revision, deleted_at) ...
  
  # Parent entry (hierarchy within same index type only)
  parent: IndexEntry {
    on target delete allow;
  };
  multi children := .<parent[is IndexEntry];
  
  # ... existing timestamps and relationships ...
  
  # NEW CONSTRAINT: Parent must have same project_index_type
  constraint expression on (
    not exists .parent or .parent.project_index_type = .project_index_type
  ) {
    errmessage := "Parent entry must have the same project_index_type";
  };
  
  # Update slug uniqueness to be per project_index_type
  constraint exclusive on ((.project, .project_index_type, .slug)) {
    # Slug uniqueness per project AND index type
    # "kant_immanuel" can exist in both Subject and Author
  };
  
  # Access control: inherit from project_index_type (which checks addon)
  access policy addon_access
    allow all
    using (.project_index_type in accessible(ProjectIndexType));
}
```

**Migration Strategy:**
- No migration needed (fresh start, no existing data)
- All new entries created with required project_index_type

**Data Impact:**
- None (no existing data to migrate)

---

### 5. Update IndexMention Table

**Add `project_index_types` relationship:**

```edgeql
type IndexMention {
  # ... existing fields (document, entry, page, page_number, etc.) ...
  
  # NEW: Project index types this mention is tagged with
  # Multi-type support: mention can appear in multiple index sections
  # Determines which sidebar sections show this mention
  # Determines highlight colors (single type = solid, multi-type = stripes)
  required multi project_index_types: ProjectIndexType {
    on target delete allow;  # If index type deleted, mention remains with other types
  };
  
  # ... rest of existing fields ...
  
  # NEW CONSTRAINT: At least one index type
  constraint expression on (
    count(.project_index_types) > 0
  ) {
    errmessage := "Mention must have at least one project_index_type";
  };
  
  # NEW CONSTRAINT: User must have addon for all selected types
  # Enforced in application layer during creation/update
  
  # Access control: User can see mention if they have addon for ANY of its types
  access policy addon_access
    allow select
    using (
      e.op(
        count(
          .project_index_types filter 
            .definition in global current_user.index_type_addons.index_type_definition
        ),
        '>',
        0
      )
    )
    allow insert, update, delete
    using (.document.project.can_access);
}
```

**Migration Strategy:**
- No migration needed (fresh start)
- Application validates user has addons for all selected types

**Data Impact:**
- None (no existing data)

---

### 6. Add Context Table ⚠️ **NEW TABLE**

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

### 7. Update DocumentPage Table (Phase 7)

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

### 8. Update Project Table (Phase 7)

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

- [ ] **Critical:** Create IndexTypeDefinition table with seed data
- [ ] **Critical:** Create UserIndexTypeAddon table
- [ ] **Critical:** Create ProjectIndexType table
- [ ] **Critical:** Update IndexEntry with project_index_type field
- [ ] **Critical:** Update IndexMention with project_index_types relationship
- [ ] **Critical:** Create Context table
- [ ] Grant default addons to existing users:
  - [ ] Grant 'subject', 'author', 'scripture' addons to all users
  - [ ] Can be done via admin script or during user signup
- [ ] Update application code to check addon access
- [ ] Update tRPC endpoints to validate addon ownership

### Phase 7 (Page Numbering)

- [ ] Add page numbering fields to DocumentPage
- [ ] Add override fields to Project
- [ ] Implement page number extraction logic
- [ ] Build override string parser

---

## Breaking Changes Summary

**Good news:** No breaking changes needed since we're starting fresh with no production data.

### ⚠️ New Required Tables

**Impact:** Fresh schema, clean slate

**Migration Path:**
1. Create all new tables
2. Seed IndexTypeDefinition with standard types
3. Grant default addons to all users during signup
4. No data migration needed

---

## Addon Access Model

### How It Works

1. **System defines available index types** via `IndexTypeDefinition`
2. **Users purchase addons** (tracked in `UserIndexTypeAddon`)
3. **Projects enable types** the owner has access to (`ProjectIndexType`)
4. **Collaborators see only types they have addons for**

### Collaborative Project Rules

**Scenario:** User A has Subject+Author addons, User B has only Subject addon

**In shared project with Subject and Author enabled:**
- User A sees both Subject and Author sections/mentions
- User B sees only Subject section/mentions
- User B cannot create Author mentions
- User B cannot see entries in Author index
- No error messages about Author - it's simply invisible to User B

### Frontend Implications

```tsx
// Fetch only index types user has access to
const { data: projectIndexTypes } = trpc.projectIndexType.list.useQuery({
  projectId,
});
// Backend automatically filters based on user's addons

// Sidebar only shows sections for accessible index types
{projectIndexTypes.map(indexType => (
  <IndexSection key={indexType.id} indexType={indexType} />
))}

// Entry picker only shows entries from accessible index types
// Multi-type tagging only offers types user has access to
```

### Backend Validation

```typescript
// Creating an entry requires user to have the addon
create: protectedProcedure
  .input(z.object({
    projectId: z.string().uuid(),
    projectIndexTypeId: z.string().uuid(),
    label: z.string(),
    // ...
  }))
  .mutation(async ({ input, ctx }) => {
    // EdgeDB access policy handles this automatically
    // If user doesn't have addon, projectIndexType query returns empty
    const result = await ctx.db.query(/* insert entry */);
    // Result will be null if user lacks addon access
    if (!result) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have access to this index type'
      });
    }
    return result;
  });
```

---

---

## ProjectIndexType tRPC Endpoints

After schema migration, implement ProjectIndexType management endpoints.

### Router: `projectIndexType`

```typescript
// apps/index-pdf-backend/src/routers/project-index-type.router.ts

export const projectIndexTypeRouter = router({
  // List project's enabled index types (filtered by user's addons)
  list: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      // EdgeDB access policy automatically filters to types user has addons for
      return await ctx.db.query(e.select(e.ProjectIndexType, (pit) => ({
        ...e.ProjectIndexType['*'],
        definition: {
          name: true,
          display_name: true,
          description: true,
        },
        entry_count: true,
        filter: e.op(
          e.op(pit.project.id, '=', e.uuid(input.projectId)),
          'and',
          e.op('not', e.op('exists', pit.deleted_at))
        ),
        order_by: pit.ordinal,
      })));
    }),
  
  // List available index type definitions user can add to project
  listAvailable: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      // Return definitions user has addons for that aren't yet enabled in project
      return await ctx.db.query(/* ... */);
    }),
  
  // Enable an index type for project (user must have addon)
  enable: protectedProcedure
    .input(z.object({
      projectId: z.string().uuid(),
      definitionId: z.string().uuid(),
      color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      ordinal: z.number().int().min(0).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // 1. Verify user has addon for this definition
      const userHasAddon = await ctx.db.query(/* check UserIndexTypeAddon */);
      if (!userHasAddon) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this index type'
        });
      }
      
      // 2. Get default color/ordinal from definition if not provided
      const definition = await ctx.db.query(/* fetch IndexTypeDefinition */);
      
      // 3. Create ProjectIndexType
      return await ctx.db.query(/* insert ProjectIndexType */);
    }),
  
  // Update project index type (color, visibility, ordinal)
  update: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      visible: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // EdgeDB access policy validates user has addon
      // Update customization fields only (not definition reference)
      return await ctx.db.query(/* update ProjectIndexType */);
    }),
  
  // Reorder project index types (change ordinals)
  reorder: protectedProcedure
    .input(z.object({
      projectId: z.string().uuid(),
      order: z.array(z.object({
        id: z.string().uuid(),
        ordinal: z.number().int().min(0),
      })),
    }))
    .mutation(async ({ input, ctx }) => {
      // Bulk update ordinals for drag-drop reordering
      // Only reorders types user has access to
    }),
  
  // Disable index type in project (soft delete)
  disable: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      // Check if entries exist (warn user)
      // Set deleted_at timestamp (doesn't remove addon)
      // User can re-enable later
    }),
});

// Also need addon management endpoints (separate router)
export const indexTypeAddonRouter = router({
  // List user's purchased addons
  listUserAddons: protectedProcedure
    .query(async ({ ctx }) => {
      return await ctx.db.query(e.select(e.UserIndexTypeAddon, (addon) => ({
        ...e.UserIndexTypeAddon['*'],
        index_type_definition: {
          name: true,
          display_name: true,
          description: true,
          default_color: true,
        },
        filter: e.op(addon.user, '=', e.global.current_user),
      })));
    }),
  
  // Admin: Grant addon to user (called by payment webhook)
  grantAddon: adminProcedure
    .input(z.object({
      userId: z.string().uuid(),
      indexTypeDefinitionId: z.string().uuid(),
      expiresAt: z.date().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Insert UserIndexTypeAddon record
      // Called by Stripe webhook or admin panel
    }),
  
  // Admin: Revoke addon from user
  revokeAddon: adminProcedure
    .input(z.object({
      userId: z.string().uuid(),
      indexTypeDefinitionId: z.string().uuid(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Delete UserIndexTypeAddon record
      // User loses access to index type in all projects
    }),
});
```

### Frontend Integration

```tsx
// apps/index-pdf-frontend/src/app/projects/[projectDir]/settings/index-types.tsx

export const IndexTypesSettings = () => {
  const { projectId } = useProject();
  
  // Query enabled index types (automatically filtered by user's addons)
  const { data: enabledTypes, isLoading } = trpc.projectIndexType.list.useQuery({
    projectId,
  });
  
  // Query available index types user can enable
  const { data: availableTypes } = trpc.projectIndexType.listAvailable.useQuery({
    projectId,
  });
  
  // Mutations
  const enableType = trpc.projectIndexType.enable.useMutation({
    onSuccess: () => {
      utils.projectIndexType.list.invalidate({ projectId });
      utils.projectIndexType.listAvailable.invalidate({ projectId });
    },
  });
  
  const updateType = trpc.projectIndexType.update.useMutation({
    onSuccess: () => {
      utils.projectIndexType.list.invalidate({ projectId });
    },
  });
  
  const reorderTypes = trpc.projectIndexType.reorder.useMutation({
    onSuccess: () => {
      utils.projectIndexType.list.invalidate({ projectId });
    },
  });
  
  const disableType = trpc.projectIndexType.disable.useMutation({
    onSuccess: () => {
      utils.projectIndexType.list.invalidate({ projectId });
      utils.projectIndexType.listAvailable.invalidate({ projectId });
    },
  });
  
  return (
    <div>
      {/* Enabled index types: color pickers, visibility toggles, drag-drop reorder */}
      <section>
        <h2>Enabled Index Types</h2>
        {enabledTypes?.map(type => (
          <IndexTypeRow key={type.id} type={type} />
        ))}
      </section>
      
      {/* Available types user can enable */}
      <section>
        <h2>Available Index Types</h2>
        <p>You have access to these index types. Enable them for this project.</p>
        {availableTypes?.map(def => (
          <AvailableTypeRow 
            key={def.id} 
            definition={def}
            onEnable={() => enableType.mutate({ 
              projectId, 
              definitionId: def.id 
            })}
          />
        ))}
      </section>
      
      {/* Link to addon marketplace */}
      <section>
        <h2>Get More Index Types</h2>
        <p>Purchase additional index type addons to expand your indexing capabilities.</p>
        <Button asChild>
          <a href="/addons/marketplace">Browse Addons</a>
        </Button>
      </section>
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
