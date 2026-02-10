# Phase 6: Context System

**Status:** ✅ Complete  
**Dependencies:** Phase 5 completion ✅  
**Completed:** February 10, 2026

## Overview

Implement region-based context system for marking areas to ignore during text extraction (headers/footers) and areas containing page numbers for automatic extraction.

**Schema Status:** The `contexts` table was created in Phase 5 (Task 5A) with basic fields. Phase 6 extended the schema with:
- ✅ User-provided name (`name` field) for identification
- ✅ Color customization (`color` field)
- ✅ Visibility toggles (`visible` field)
- ✅ "Every other page" support (`everyOther`, `startPage` fields)
- ✅ Extracted page number storage (`extractedPageNumber` field)
- ✅ Association changed from `documentId` → `projectId` (simpler, 1:1 in MVP)

## User Stories

**As an indexer:**
- I want to mark headers/footers as ignore contexts, so they don't interfere with text extraction
- I want to mark page number regions, so the system can automatically extract canonical page numbers
- I want to apply contexts to multiple pages (all pages, ranges, every other), so I don't have to draw the same region repeatedly
- I want to manage all contexts in one place, but see which apply to the current page

## Context Types

### 1. Ignore Context
- **Purpose:** Exclude regions from text extraction
- **Logic:** If text atom bbox is 100% within ignore context bbox → ignore it
- **Use cases:** Headers, footers, captions, marginal notes, page numbers (if not indexing them)
- **Default color:** Red (#FCA5A5) - user customizable per context

### 2. Page Number Context
- **Purpose:** Auto-extract text to establish canonical page number
- **Logic:** Extract text within bbox, parse as page number
- **Use cases:** Roman numerals, alternating corners, custom pagination
- **Default color:** Purple (#C4B5FD) - user customizable per context

**Color Customization:**

Context colors are independent of index type colors. Each context can have its own custom color:
- Default assignment when creating context (Red for ignore, Purple for page_number)
- User can override via color picker in context creation/edit modal
- Color changes affect context rendering on PDF (background fill)
- Useful for distinguishing multiple contexts of same type (e.g., header vs footer ignore contexts)

## Page Configuration Options

Contexts can be applied to pages using these modes:

### This Page Only
- Context applies to current page only
- Quick for one-off exceptions

### All Pages
- Context applies to all pages in document
- Good for consistent headers/footers

### Every Other Page, Starting On
- **Implementation:** Top-level radio option (not a modifier)
- Start page configurable via number input
- Example: "Every other page starting on page 4" = 4, 6, 8, 10...
- Example: "Every other page starting on page 5" = 5, 7, 9, 11...
- **Backend mapping:** Stored as `pageConfigMode: "all_pages"` with `everyOther: true`

### Custom
- Comma-separated list of ranges and individual pages
- Example: "1-2, 5-6, 8, 10-12"
- Flexible for complex patterns
- **Note:** "Page Range" option was removed (redundant with custom)

**Implementation Logic:**
```typescript
function appliesToPage({ context, targetPage }: {
  context: Context;
  targetPage: number;
}): boolean {
  // Check base page config mode
  switch (context.pageConfigMode) {
    case 'this_page':
      if (context.pageNumber !== targetPage) return false;
      break;
    case 'all_pages':
      // Applies to all pages
      break;
    case 'page_range':
      // Parse context.pageRange (e.g., "1-50")
      // Check if targetPage is in range
      break;
    case 'custom':
      // Parse context.pageRange (e.g., "1-2,5-6,8")
      // Check if targetPage is in list
      break;
  }
  
  // Apply everyOther filter if enabled
  if (context.everyOther && context.startPage) {
    const offset = targetPage - context.startPage;
    if (offset < 0 || offset % 2 !== 0) {
      return false;
    }
  }
  
  return true;
}
```

## UI Architecture

### Page Sidebar - Contexts Section

**Purpose:** Show contexts that apply to current page

**Display:**
- List of contexts on this page
- Context name, type, and page config summary
- Color indicator
- Inline visibility toggle (eye icon)
- "Remove this page from context" button

**Actions:**
- Create new context (draw region first, then modal opens)
- Toggle visibility with eye icon
- Click "Remove Page" to exclude current page from context
- Click "Show/Hide" to toggle visibility

**Mockup:**
```
┌─────────────────────────────────┐
│ Contexts (2)                    │
│                                 │
│ ● Header                        │
│   Ignore                        │
│   All pages                     │
│   [👁 Hide] [Remove Page]       │
│                                 │
│ ● Top-right Page Number         │
│   Page Number                   │
│   Every other (starting page 4) │
│   [👁 Hide] [Remove Page]       │
│                                 │
└─────────────────────────────────┘
```

### Project Sidebar - Contexts Section

**Purpose:** Manage all contexts project-wide

**Display:**
- List of all contexts with name, type, and page config
- Color indicator
- Inline visibility toggle, edit, and delete actions
- Create new context button

**Actions:**
- Toggle visibility with eye icon (show/hide on PDF)
- Edit context (opens modal with pre-filled data)
- Delete context (with confirmation)
- Create new context (activate drawing mode, draw region, then modal opens)

**Mockup:**
```
┌─────────────────────────────────┐
│ Contexts (5)                    │
│ [🖱 Draw Context Region]        │
│                                 │
│ ● Header                        │
│   Ignore                        │
│   All pages                     │
│   [👁][✏️][🗑️]                  │
│                                 │
│ ● Footer                        │
│   Ignore                        │
│   All pages                     │
│   [👁][✏️][🗑️]                  │
│                                 │
│ ● Top-right Page Number         │
│   Page Number                   │
│   Pages 4-150 (every other)     │
│   [👁][✏️][🗑️]                  │
│                                 │
│ ● Bottom-center Page Number     │
│   Page Number                   │
│   Pages 5-151 (every other)     │
│   [👁][✏️][🗑️]                  │
│                                 │
│ ● Chapter Headings              │
│   Ignore                        │
│   Custom: 10,25,40,55           │
│   [👁][✏️][🗑️]                  │
└─────────────────────────────────┘
```

## Context Creation Modal

**Triggered from:**
- Page sidebar "Create Context" button
- Project sidebar "Create Context" button

**Implementation Notes:**
- Region must be drawn BEFORE modal opens
- Modal opens after region is confirmed on PDF
- Edit mode: Modal title changes to "Edit Context" and pre-fills all fields

**Fields:**
- **Name:** User-provided name (required, e.g., "Header", "Footer", "Page Number Top-Right")
- **Type:** Ignore / Page Number (dropdown)
- **Apply to:**
  - ○ This page only (default if created from page sidebar)
  - ○ All pages
  - ○ Every other page, starting on: [___] (number input appears immediately when selected)
  - ○ Custom pages: [___________________] (text input appears immediately when selected, e.g., "1-2, 5-6, 8, 10-12")
- **Color:** Color picker (default per type: Red for ignore, Purple for page_number)

**Validation:**
- Bbox must be drawn
- Page ranges must be valid (within document page count)
- Custom string must parse correctly
- "Every other starting page" must be within range

**Mockup:**
```
┌─────────────────────────────────┐
│ Create Context                  │
│                                 │
│ Type: [Page Number       ▼]    │
│                                 │
│ Region: [Draw on PDF]           │
│ Status: Drawn ✓                 │
│                                 │
│ Apply to:                       │
│ ○ This page only                │
│ ○ All pages                     │
│ ● Page range: [4] to [150]     │
│   ☑ Every other page            │
│   Starting on page: [4]         │
│ ○ Custom: [                  ]  │
│                                 │
│ Color: [■]                      │
│ ☑ Visible                       │
│                                 │
│ [Cancel]           [Create]     │
└─────────────────────────────────┘
```

## Drawing Mode

### Activation
- Click "Draw Region" in context creation modal
- Cursor changes to crosshair
- Overlay message: "Click and drag to draw region"

### Interaction
- Click-drag to draw rectangle
- Release to finalize
- Can redraw by clicking "Redraw"
- Escape to cancel drawing

### Visual Feedback
- Semi-transparent overlay while drawing
- Dashed border
- Shows dimensions (width x height in PDF points)

## Context Rendering

### On PDF Viewer
- Render all visible contexts for current page
- Layered below mentions (z-index)
- Semi-transparent fill (20% opacity)
- Dashed border (2px)
- **Color per context** (each context has its own color, independent of type)
  - Different ignore contexts can have different colors
  - Useful for visual distinction (e.g., header=red, footer=orange)
  - Not tied to index type colors (completely separate system)

### Hover State
- Increase opacity to 40%
- Show tooltip: Type, page config, "Click to edit"

### Click Action
- If in page sidebar: Scroll to context in list
- If in project sidebar: Open edit modal

## Backend Schema (Phase 5 + Extensions)

**Current Schema (from Phase 5):**
```typescript
// Table: contexts (Drizzle schema)
export const contexts = pgTable("contexts", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentId: uuid("document_id")  // Will change to projectId in Phase 6
    .references(() => sourceDocuments.id, { onDelete: "cascade" })
    .notNull(),
  contextType: contextTypeEnum("context_type").notNull(),  // 'ignore' | 'page_number'
  pageConfigMode: pageConfigModeEnum("page_config_mode").notNull(),  // 'this_page' | 'all_pages' | 'page_range' | 'custom'
  pageNumber: integer("page_number"),  // For this_page mode only
  pageRange: text("page_range"),  // For page_range/custom modes (e.g., "1-50" or "1-2,5-6,8")
  bbox: json("bbox"),  // BoundingBox in PDF user space
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),  // Soft delete
});
```

**Phase 6 Schema Changes:**

1. **Change association:** `documentId` → `projectId` (simpler, 1:1 in MVP)
2. **Add new fields:**

```typescript
export const contexts = pgTable("contexts", {
  // ... existing fields ...
  projectId: uuid("project_id")  // Changed from documentId
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  
  // New fields:
  name: text("name").notNull(),  // User-provided name for the context
  color: text("color").notNull(),  // Hex color (e.g., "#FCA5A5")
  visible: boolean("visible").default(true).notNull(),  // Controls rendering on PDF
  everyOther: boolean("every_other").default(false).notNull(),  // Apply every other page
  startPage: integer("start_page"),  // Starting page for every other (e.g., 4 = 4,6,8,10...)
  extractedPageNumber: text("extracted_page_number"),  // For page_number contexts, stores extracted value
});
```

**Final Schema (after Phase 6):**
```typescript
{
  id: uuid;
  projectId: uuid;  // References projects
  name: text;  // User-provided name (e.g., "Header", "Footer", "Page Number Top-Right")
  contextType: 'ignore' | 'page_number';
  pageConfigMode: 'this_page' | 'all_pages' | 'custom';  // Note: "page_range" removed
  pageNumber: integer;  // For this_page mode
  pageRange: text;  // For custom mode (e.g., "1-2,5-6,8")
  everyOther: boolean;  // Whether to apply every other page
  startPage: integer;  // Starting page for every other
  bbox: json;  // BoundingBox in PDF user space
  color: text;  // Hex color
  visible: boolean;  // Visibility toggle
  extractedPageNumber: text;  // Extracted page number (for page_number type)
  createdAt: timestamp;
  updatedAt: timestamp;
  deletedAt: timestamp;
}
```

## tRPC Integration Pattern (from Phase 5)

Following Phase 5 patterns, all context operations will use tRPC with optimistic updates:

**Types:**
```typescript
// Shared types (defined in @pubint/core)
type Context = {
  id: string;
  projectId: string;
  name: string;  // User-provided name
  contextType: 'ignore' | 'page_number';
  pageConfigMode: 'this_page' | 'all_pages' | 'custom';
  pageNumber?: number;
  pageRange?: string;
  everyOther: boolean;
  startPage?: number;
  bbox: BoundingBox;
  color: string;
  visible: boolean;
  extractedPageNumber?: string;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
};

type CreateContextInput = {
  projectId: string;
  name: string;  // Required
  contextType: 'ignore' | 'page_number';
  bbox: BoundingBox;
  pageConfigMode: 'this_page' | 'all_pages' | 'custom';
  pageNumber?: number;
  pageRange?: string;
  everyOther?: boolean;
  startPage?: number;
  color?: string;  // Default per type if not provided
  visible?: boolean;  // Default true
};
```

**Endpoints:**
```typescript
// apps/index-pdf-backend/src/trpc/routers/context.router.ts
context: {
  list: // Get all contexts for a project
  create: // Create new context with bbox and page config
  update: // Update context (color, visible, page config, etc.)
  delete: // Soft delete context
  getForPage: // Get contexts that apply to a specific page number
}
```

**Frontend Hooks:**
```typescript
// Similar pattern to indexEntry/indexMention hooks
const { data: contexts } = trpc.context.list.useQuery({ projectId });
const { data: pageContexts } = trpc.context.getForPage.useQuery({ 
  projectId, 
  pageNumber 
});
const createContext = trpc.context.create.useMutation({
  onMutate: // Optimistic update
  onError: // Rollback
  onSuccess: // Replace temp data
});
```

**Optimistic Update Strategy:**
- Create: Add temp context to cache immediately, show on PDF
- Update: Update cache immediately, re-render context
- Delete: Remove from cache immediately, hide from PDF
- Rollback on error with toast notification

## Implementation Summary

### ✅ Completed Tasks

**0. Schema Migration**
- ✅ Changed `contexts.documentId` → `contexts.projectId`
- ✅ Added `name` field (user-provided name for context)
- ✅ Added `color` field (hex color, defaults per type)
- ✅ Added `visible` field (boolean, default true)
- ✅ Added `everyOther` field (boolean, default false)
- ✅ Added `startPage` field (integer, for every other mode)
- ✅ Added `extractedPageNumber` field (text, for page_number contexts)
- ✅ Updated RLS policies (inherit from projects)
- ✅ Generated migrations (`0001_real_abomination.sql`, `0002_smooth_master_mold.sql`)

**1. tRPC Backend**
- ✅ Created context module (`context.repo.ts`, `context.service.ts`, `context.router.ts`)
- ✅ Implemented `context.list` (get all contexts for project)
- ✅ Implemented `context.getForPage` (get contexts for specific page)
- ✅ Implemented `context.create` with default colors
- ✅ Implemented `context.update` for all fields
- ✅ Implemented `context.delete` (soft delete)
- ✅ Added event logging for context operations

**2. Shared Types & Utils**
- ✅ Created `@pubint/core/context.types.ts` with all Context types
- ✅ Created `@pubint/core/context.utils.ts` with page config logic
- ✅ Implemented `appliesToPage()` function for filtering
- ✅ Implemented `parsePageRange()` for custom page parsing
- ✅ Implemented `validatePageRange()` for validation
- ✅ Implemented `getPageConfigSummary()` for display

**3. Drawing Mode Integration**
- ✅ Reused existing region drawing from IndexMention flow
- ✅ Added `draw-context` action type to editor state
- ✅ Draw region button in Project Sidebar with toggle state
- ✅ Crosshair cursor during region drawing
- ✅ Auto-opens modal after region is drawn

**4. Context Creation/Edit Modal**
- ✅ Name field (required)
- ✅ Type selector (ignore/page_number)
- ✅ Page config radio options (this_page, all_pages, every_other, custom)
- ✅ Conditional inputs show immediately when radio selected
- ✅ Color picker with default colors per type
- ✅ Validation for name, page ranges, starting page
- ✅ Edit mode: Pre-fills data, changes title to "Edit Context"
- ✅ Uses tRPC create/update mutations

**5. Context Management UI**
- ✅ Project Sidebar: Lists all contexts with name, type, pages
- ✅ Page Sidebar: Lists only contexts for current page
- ✅ Inline visibility toggle (eye icon)
- ✅ Edit button (opens modal with pre-filled data)
- ✅ Delete button (with browser confirmation)
- ✅ Color indicator circle

**6. Context Rendering**
- ✅ Contexts render on PDF using existing `PdfHighlightLayer`
- ✅ Custom colors applied per context (via `contextColor` metadata)
- ✅ Visibility toggle hides/shows contexts
- ✅ Context highlights use selected hex color
- ✅ Semi-transparent fill for visibility

### 🔧 Implementation Notes

**Every Other Page Configuration:**
- UI shows as top-level radio option for better UX
- Backend stores as `pageConfigMode: "all_pages"` + `everyOther: true`
- Mapping happens in modal submit handler

**Page Range Options:**
- Removed "page_range" option (redundant with custom)
- Three modes: this_page, all_pages, custom
- "Every other" is UI-only mode (maps to all_pages + everyOther flag)

**Visibility Toggle:**
- Removed from Create/Edit modal
- Moved to inline toggle in context lists
- More intuitive UX (show/hide without editing)

**Region Drawing Flow:**
1. Click "Draw Context Region" button
2. Cursor changes to crosshair
3. Draw region on PDF
4. Modal opens automatically with drawn bbox
5. Fill in name, type, page config, color
6. Submit to create/update context

## Testing Requirements

### Backend Tests
- [ ] Schema migration runs successfully
- [ ] Context CRUD endpoints work (create, read, update, delete)
- [ ] RLS policies enforce project access
- [ ] Page config validation works (ranges, custom strings)
- [ ] "Every other" logic calculates correct pages
- [ ] Soft delete works correctly

### Frontend Tests
- [ ] Draw region creates correct bbox in PDF user space
- [ ] "Apply to all pages" creates correct page config
- [ ] "Every other" checkbox enables/disables startPage field
- [ ] Custom page string validates and parses correctly
- [ ] Contexts render at correct zoom levels
- [ ] Context colors display correctly (independent per context)
- [ ] Visibility toggle shows/hides contexts
- [ ] Edit context updates correctly with optimistic updates
- [ ] Delete context removes from all pages with confirmation
- [ ] "Remove from this page" adjusts page config (doesn't delete)
- [ ] Hover shows tooltip with context details
- [ ] Click context scrolls to sidebar (page sidebar) or opens edit modal (project sidebar)
- [ ] Page sidebar shows only contexts for current page
- [ ] Project sidebar shows all contexts

## Success Criteria

✅ Phase 6 Complete (Core Features):
- [x] Schema migration complete (name, color, visible, everyOther, startPage, extractedPageNumber)
- [x] tRPC endpoints implemented (context.create, list, update, delete, getForPage)
- [x] User can draw regions on PDF (reused existing region drawing mode)
- [x] User can create ignore contexts
- [x] User can create page number contexts
- [x] User can apply contexts to multiple pages (4 config modes: this-page, all-pages, every-other, custom)
- [x] User can name contexts for easy identification
- [x] User can customize context colors (independent per context)
- [x] Contexts render correctly on PDF with selected color
- [x] Page sidebar shows only contexts for current page
- [x] Project sidebar shows all contexts
- [x] Edit operations work (modal pre-fills data)
- [x] Delete operations work (with confirmation)
- [x] Visibility toggles show/hide contexts (inline eye icon)

🔄 Phase 6 Deferred Features (to be completed with Phase 7):
- [ ] "Remove from this page" functionality
- [ ] Page exclusion support (e.g., "every other starting on 1; except 3,5,7")
- [ ] Conflict detection for overlapping page_number contexts
- [ ] Conflict resolution UI with navigation to conflicting pages
- [ ] Interaction tests for context operations (see testing document)

## Deferred Features (Phase 6 Extensions)

The following features were identified during Phase 6 implementation but deferred to be completed alongside Phase 7:

### Page Exclusion ("Except" Clause)

**Problem:** When user clicks "Remove from page" in Page Sidebar, we need to exclude specific pages from a context without recreating it.

**Solution:** Add `exceptPages` field to schema:

```typescript
type Context = {
  // ... existing fields ...
  exceptPages?: number[]; // Array of page numbers to exclude
};
```

**Examples:**
- Context: "All pages, except 3,5,7"
  - `pageConfigMode: "all_pages"`, `exceptPages: [3, 5, 7]`
- Context: "Every other starting on 1, except 3,7"
  - `pageConfigMode: "all_pages"`, `everyOther: true`, `startPage: 1`, `exceptPages: [3, 7]`
- Context: "Custom pages 1-10,20-30, except 5,25"
  - `pageConfigMode: "custom"`, `pageRange: "1-10,20-30"`, `exceptPages: [5, 25]`

**UI Updates:**
- "Remove from page" button adds current page to `exceptPages` array
- Edit Context modal shows excluded pages with option to re-include them
- Page config summary includes exceptions (e.g., "All pages except 3, 5, 7")

### Conflict Detection for Page Number Contexts

**Constraint:** Only ONE `page_number` context can apply to any given page (to avoid ambiguity in canonical page numbers).

**Conflict Detection Logic:**
```typescript
// Backend: Detect conflicts when contexts change
function detectPageNumberConflicts({ projectId }): ConflictReport[] {
  const pageNumberContexts = getContexts({ projectId, type: 'page_number' });
  const conflicts = [];
  
  for (let page = 1; page <= documentPageCount; page++) {
    const contextsForPage = pageNumberContexts.filter(ctx => 
      appliesToPage({ context: ctx, targetPage: page })
    );
    
    if (contextsForPage.length > 1) {
      conflicts.push({
        page,
        contexts: contextsForPage.map(ctx => ({
          id: ctx.id,
          name: ctx.name,
        })),
      });
    }
  }
  
  return conflicts;
}
```

**Conflict Resolution UI:**

In Project Sidebar, contexts with conflicts show error state:

```
┌─────────────────────────────────┐
│ ● Top-right Page Number         │
│   Page Number                   │
│   All pages                     │
│   ⚠️ CONFLICTS:                 │
│   • Page 5 (with "Bottom PN")   │
│     [Navigate to Page 5]        │
│   • Page 7 (with "Bottom PN")   │
│     [Navigate to Page 7]        │
│   [👁][✏️][🗑️]                  │
└─────────────────────────────────┘
```

In Page Sidebar (when on conflicting page):

```
┌─────────────────────────────────┐
│ ⚠️ PAGE NUMBER CONFLICT          │
│                                 │
│ Multiple page number contexts:  │
│ • Top-right Page Number         │
│   [Remove from this page]       │
│ • Bottom-center Page Number     │
│   [Remove from this page]       │
│                                 │
│ Resolve conflict to enable      │
│ canonical page number indexing. │
└─────────────────────────────────┘
```

**Resolution Options:**
1. Click "Remove from this page" on unwanted context (adds to `exceptPages`)
2. Edit context to change page config (avoid overlap)
3. Delete one of the conflicting contexts

### Ignore Context Overlaps (No Conflict)

**Note:** Multiple `ignore` contexts CAN overlap on the same page (no conflict). All ignore regions apply cumulatively.

## Next Phase

[Phase 7: Page Numbering System](../phase-7-page-numbering/) uses page number contexts to extract and display canonical page numbers. Phase 7 will complete the deferred Phase 6 features (page exclusion, conflict detection) as they are required for canonical page numbering to work correctly.
