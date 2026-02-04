# Phase 5: Required Schema Changes

**Status:** Not Started  
**Dependencies:** Phase 4 completion

## Overview

Based on design decisions made in Phase 4, the following schema changes are required in `db/gel/dbschema/indexing.gel`.

## Key Design Decisions Driving Schema Changes

### 1. Subscription-Based Index Type Access
**Decision:** Index type availability is determined by subscription tier. Users configure which entitled types to use per-project.

**Architecture:**
- **System Level:** `IndexTypeTemplate` defines available index types (Subject, Author, Scripture, Context)
- **User Level:** `UserIndexTypeEntitlement` grants access based on subscription
  - Base tier: Subject only (always available)
  - Premium tier: All index types
- **Project Level:** `ProjectIndexType` enables/configures entitled types per project
  - User can enable/disable entitled types
  - User can customize colors per project per type
  - Default: Enable all entitled types on project creation

**Reason:** 
- Enables subscription monetization (Subject free, others premium)
- Allows project-specific customization (orange Author in one project, green in another)
- Maintains access control (can't enable types without entitlement)
- Clear separation: entitlement (what you can use) vs. configuration (how you use it)

### 2. IndexEntry Per Index Type
**Decision:** Each IndexEntry belongs to exactly ONE index type. Same concept in multiple indexes = separate entries.

**Reason:** Enables different hierarchies per index, simpler queries, clearer ownership.

### 3. Colors From Index Types (Project-Level)
**Decision:** Highlight colors derived from ProjectIndexType configuration, not from individual entries.

**Reason:** 
- User configures colors at project + index type level
- All Subject highlights in a project use the same hue (with programmatic lightness/chroma variations)
- Color is tied to type name, not ordinal position
- Uses OKLCH color space for better color manipulation

### 4. Multi-Type Mentions
**Decision:** Mentions can belong to multiple index types via `index_types` array.

**Reason:** A single highlight can be tagged for Subject AND Author (diagonal stripes with both colors).

### 5. Context System
**Decision:** Separate Context entities for ignore/page-number regions, independent color customization.

**Reason:** Different purpose than mentions/entries. Need per-context colors, not tied to index types.

---

## Required Schema Changes

### 1. Add Index Type System Tables ⚠️ **NEW TABLES**

This implements a three-tier architecture for subscription-based index type access:

#### 1a. IndexTypeTemplate - System-Level Index Type Definitions

**Location:** After Project, before IndexEntry

```edgeql
# ============================================================================
# IndexTypeTemplate - System-level index type definitions
# ============================================================================
#
# Defines what index types exist in the system.
# Users get access to these via subscription-based entitlements.
#
# System templates (seeded at deployment):
# - Subject (ordinal=0, hue=230 blue, base_tier=true)
# - Author (ordinal=1, hue=30 orange, base_tier=false)
# - Scripture (ordinal=2, hue=120 green, base_tier=false)
# - Context (ordinal=3, hue=340 pink, base_tier=false)

type IndexTypeTemplate {
  # Template name (e.g., 'subject', 'author', 'scripture', 'context')
  # Globally unique across system
  required name: str {
    constraint exclusive;
  };
  
  # Display label for UI
  required label: str;
  
  # Description for user-facing documentation
  description: str;
  
  # Default hue (0-360) for OKLCH color system
  # Lightness and chroma are applied programmatically based on context
  required default_hue: int16 {
    constraint min_value(0);
    constraint max_value(360);
  };
  
  # Display order and default color assignment
  # Used when initializing new projects
  required ordinal: int16 {
    constraint exclusive;
  };
  
  # Whether this type is included in base subscription tier
  # true = available to all users (Subject)
  # false = requires premium subscription
  required is_base_tier: bool {
    default := false;
  };
  
  required created_at: datetime {
    default := datetime_current();
  };
  updated_at: datetime;
  
  # Relationships
  multi entitlements := .<template[is UserIndexTypeEntitlement];
  multi project_configs := .<template[is ProjectIndexType];
  
  # Computed properties
  property user_count := count(.entitlements);
  property project_count := count(.project_configs);
}
```

#### 1b. UserIndexTypeEntitlement - User-Level Access Control

**Location:** After IndexTypeTemplate

```edgeql
# ============================================================================
# UserIndexTypeEntitlement - User-level index type access control
# ============================================================================
#
# Defines which index types a user has ACCESS to based on subscription.
# Automatically granted:
# - All users get 'subject' (base tier)
# - Premium users get 'author', 'scripture', 'context'

type UserIndexTypeEntitlement {
  required user: User {
    on target delete delete source;
  };
  
  required template: IndexTypeTemplate {
    on target delete delete source;
  };
  
  # How this entitlement was granted
  required granted_via: str; # 'base_tier', 'premium_tier', 'addon', 'trial', etc.
  
  required granted_at: datetime {
    default := datetime_current();
  };
  
  # Optional expiration for trials or temporary access
  expires_at: datetime;
  
  # Computed properties
  property is_expired := exists .expires_at and .expires_at < datetime_current();
  property is_active := not .is_expired;
  
  # Constraints
  constraint exclusive on ((.user, .template));
  
  # Access control: users can read their own entitlements
  access policy user_read_own
    allow select
    using (.user.id ?= global current_user_id);
  
  access policy admin_full_access
    allow all
    using (exists (
      select User filter .id = global current_user_id and .is_admin
    ));
}
```

#### 1c. ProjectIndexType - Project-Level Index Type Configuration

**Location:** After UserIndexTypeEntitlement

```edgeql
# ============================================================================
# ProjectIndexType - Project-level index type configuration
# ============================================================================
#
# Defines which index types are ENABLED for a specific project.
# User can only enable types they have entitlement for.
# Each type can have project-specific color customization.
#
# Default behavior on project creation:
# - Enable all entitled types
# - Use template default hue
# - User can disable, reorder, or change colors per project

type ProjectIndexType {
  required project: Project {
    on target delete delete source;
  };
  
  required template: IndexTypeTemplate {
    on target delete restrict;
  };
  
  # OKLCH hue (0-360) - project-specific color customization
  # Lightness and chroma are applied programmatically
  required hue: int16 {
    constraint min_value(0);
    constraint max_value(360);
  };
  
  # Whether this type is enabled for this project
  # User can disable entitled types they don't need
  required enabled: bool {
    default := true;
  };
  
  # Display order within this project
  # User can reorder types per project
  required ordinal: int16;
  
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
  property type_name := .template.name;
  
  # Constraints
  constraint exclusive on ((.project, .template)) except (exists .deleted_at);
  constraint exclusive on ((.project, .ordinal)) except (exists .deleted_at);
  
  # Access control: inherit from project
  access policy project_access
    allow all
    using (.project.can_access);
}
```

**Migration Notes:**

1. **Seed IndexTypeTemplate:**
   ```edgeql
   insert IndexTypeTemplate {
     name := 'subject',
     label := 'Subject Index',
     default_hue := 230,  # Blue
     ordinal := 0,
     is_base_tier := true
   };
   insert IndexTypeTemplate {
     name := 'author',
     label := 'Author Index',
     default_hue := 30,   # Orange
     ordinal := 1,
     is_base_tier := false
   };
   insert IndexTypeTemplate {
     name := 'scripture',
     label := 'Scripture Index',
     default_hue := 120,  # Green
     ordinal := 2,
     is_base_tier := false
   };
   insert IndexTypeTemplate {
     name := 'context',
     label := 'Contexts',
     default_hue := 340,  # Pink
     ordinal := 3,
     is_base_tier := false
   };
   ```

2. **Grant existing users all types (grandfather existing users):**
   ```edgeql
   for user in (select User)
   union (
     for template in (select IndexTypeTemplate)
     union (
       insert UserIndexTypeEntitlement {
         user := user,
         template := template,
         granted_via := 'migration_grandfathered'
       }
     )
   );
   ```

3. **Create ProjectIndexType for existing projects:**
   ```edgeql
   for project in (select Project)
   union (
     for template in (select IndexTypeTemplate)
     union (
       insert ProjectIndexType {
         project := project,
         template := template,
         hue := template.default_hue,
         ordinal := template.ordinal,
         enabled := true
       }
     )
   );
   ```

---

### 2. Update IndexEntry Table ⚠️ **BREAKING CHANGE**

**Add `project_index_type` field and parent constraint:**

```edgeql
type IndexEntry {
  required project: Project {
    on target delete delete source;
  };
  
  # NEW: Project index type this entry belongs to
  # Each entry belongs to exactly ONE project index type
  # Example: "Kant" in Project A's Subject is separate from Project B's Subject
  # Example: "Kant" in Subject is separate from "Kant" in Author (same project)
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
  
  # NEW CONSTRAINT: Entry must belong to same project as its project_index_type
  constraint expression on (
    .project = .project_index_type.project
  ) {
    errmessage := "Entry must belong to same project as its project_index_type";
  };
  
  # Update slug uniqueness to be per project_index_type
  constraint exclusive on ((.project, .project_index_type, .slug)) {
    # Slug uniqueness per project AND index type
    # "kant_immanuel" can exist in both Subject and Author
  };
  
  # ... existing access policies ...
}
```

**Migration Strategy:**
1. Add `project_index_type` field as optional first
2. Create ProjectIndexType records for existing projects (see section 1 migration)
3. Assign all existing entries to their project's "Subject" ProjectIndexType
4. Make `project_index_type` required
5. Update application code to filter entries by project_index_type

**Data Impact:**
- **BREAKING:** Existing entries need project_index_type assignment
- Need migration script to assign default type
- All existing entries will be assigned to Subject index type

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

#### Schema Changes
- [ ] **Critical:** Create IndexTypeTemplate table (system-level definitions)
- [ ] **Critical:** Create UserIndexTypeEntitlement table (subscription access control)
- [ ] **Critical:** Create ProjectIndexType table (project-level configuration)
- [ ] **Critical:** Add project_index_type field to IndexEntry (BREAKING)
- [ ] **Critical:** Add index_types array to IndexMention
- [ ] **Critical:** Create Context table

#### Data Migration
- [ ] Seed IndexTypeTemplate with 4 default types (subject, author, scripture, context)
- [ ] Grant all existing users entitlements to all 4 types (grandfather existing users)
- [ ] Create ProjectIndexType records for all existing projects (all 4 types, default hues)
- [ ] Migrate localStorage color-config to ProjectIndexType.hue for existing projects
- [ ] Assign all existing IndexEntries to their project's Subject ProjectIndexType
- [ ] Assign all existing IndexMentions `index_types = ['subject']`

#### Application Code Updates
- [ ] Update tRPC endpoints to handle three-tier architecture:
  - [ ] `indexTypeTemplate.list` - System templates
  - [ ] `userIndexTypeEntitlement.list` - User's entitled types
  - [ ] `projectIndexType.list` - Project's enabled types
  - [ ] `projectIndexType.update` - Update hue/enabled/ordinal
- [ ] Update frontend to query ProjectIndexType instead of localStorage
- [ ] Add subscription tier logic to grant/revoke entitlements
- [ ] Add entitlement validation when enabling ProjectIndexType
- [ ] Update IndexEntry creation to require ProjectIndexType
- [ ] Update IndexMention creation to validate index_types against project's enabled types
- [ ] Add UI for project settings to enable/disable/customize index types

### Phase 7 (Page Numbering)

- [ ] Add page numbering fields to DocumentPage
- [ ] Add override fields to Project
- [ ] Implement page number extraction logic
- [ ] Build override string parser

---

## Breaking Changes Summary

### ⚠️ IndexEntry.project_index_type (Required Field)

**Impact:** All existing entries need project_index_type assignment

**Migration Path:**
1. Create ProjectIndexType records for all projects (4 default types each)
2. Add project_index_type field to IndexEntry as optional
3. Backfill all entries with their project's Subject ProjectIndexType
4. Make field required
5. Update all entry creation code to require ProjectIndexType

### ⚠️ IndexEntry Slug Uniqueness

**Impact:** Slug constraint changes from per-project to per-project-per-type

**Migration Path:**
1. Check for duplicate slugs across would-be-separate indexes within each project
2. Rename duplicates if found (append type name: "kant_immanuel_author")
3. Update constraint

### ⚠️ Subscription-Based Access Control

**Impact:** Users can only enable index types they have entitlement for

**Migration Path:**
1. Grant all existing users all 4 index type entitlements (grandfather)
2. New users get only Subject (base tier) by default
3. Implement subscription upgrade/downgrade logic
4. Add entitlement checks when enabling ProjectIndexType

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

## Testing Requirements

- [ ] Migration script tested on copy of production data
- [ ] All existing mentions render correctly after migration
- [ ] Entry creation enforces index_type requirement
- [ ] Parent entries validate same index_type constraint
- [ ] Multi-type mention tagging works
- [ ] Context creation and rendering works
- [ ] No data loss during migration
- [ ] Rollback plan documented

---

## Next Steps

1. Review schema changes with team
2. Write migration script (EdgeQL)
3. Test migration on staging database
4. Update application code
5. Deploy schema changes
6. Deploy application code
7. Verify production data integrity
