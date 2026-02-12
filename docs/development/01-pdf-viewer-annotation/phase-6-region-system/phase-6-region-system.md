pnpm # Phase 6: Region System

**Status:** ✅ Complete (Including Extended Features)  
**Dependencies:** Phase 5 completion ✅  
**Completed:** February 10, 2026

**Extended Features Status:**
- ✅ Page exclusion ("Remove from page", `exceptPages` field)
- ✅ Conflict detection (client-side, automatic)
- ✅ Conflict resolution UI (Project/Page Sidebar navigation)
- ✅ "Every other page" with optional end page

## Overview

Implement region-based region system for marking areas to ignore during text extraction (headers/footers) and areas containing page numbers for automatic extraction.

**Schema Status:** The `regions` table was created in Phase 5 (Task 5A) with basic fields. Phase 6 extended the schema with:
- ✅ User-provided name (`name` field) for identification
- ✅ Color customization (`color` field)
- ✅ Visibility toggles (`visible` field)
- ✅ "Every other page" support (`everyOther`, `startPage`, `endPage` fields)
- ✅ Page exclusion support (`exceptPages` field)
- ✅ Association changed from `documentId` → `projectId` (simpler, 1:1 in MVP)

## User Stories

**As an indexer:**
- I want to mark headers/footers as exclude regions, so they don't interfere with text extraction
- I want to mark page number regions, so the system can automatically extract canonical page numbers
- I want to apply contexts to multiple pages (all pages, ranges, every other), so I don't have to draw the same region repeatedly
- I want to manage all regions in one place, but see which apply to the current page

## Context Types

### 1. Ignore Context
- **Purpose:** Exclude regions from text extraction
- **Logic:** If text atom bbox is 100% within exclude region bbox → ignore it
- **Use cases:** Headers, footers, captions, marginal notes, page numbers (if not indexing them)
- **Default color:** Red (#FCA5A5) - user customizable per region

### 2. Page Number Context
- **Purpose:** Auto-extract text to establish canonical page number
- **Logic:** Extract text within bbox, parse as page number
- **Use cases:** Roman numerals, alternating corners, custom pagination
- **Default color:** Purple (#C4B5FD) - user customizable per region

**Color Customization:**

Region colors are independent of index type colors. Each context can have its own custom color:
- Default assignment when creating context (Red for ignore, Purple for page_number)
- User can override via color picker in region creation/edit modal
- Color changes affect context rendering on PDF (background fill)
- Useful for distinguishing multiple regions of same type (e.g., header vs footer exclude regions)

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
- Start page configurable via number input (required)
- End page configurable via number input (optional, defaults to last page of document)
- Example: "Every other page starting on 4, ending on 10" = 4, 6, 8, 10
- Example: "Every other page starting on 5" = 5, 7, 9, 11... (to end of document)
- **Backend mapping:** Stored as `pageConfigMode: "all_pages"` with `everyOther: true`, `startPage`, and optional `endPage`

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
      // Applies to all pages (unless filtered by everyOther, endPage, or exceptPages)
      break;
    case 'custom':
      // Parse context.pageRange (e.g., "1-2,5-6,8")
      // Check if targetPage is in list
      if (!isPageInCustomRange(context.pageRange, targetPage)) return false;
      break;
  }
  
  // Apply everyOther filter if enabled
  if (context.everyOther && context.startPage) {
    const offset = targetPage - context.startPage;
    if (offset < 0 || offset % 2 !== 0) {
      return false;
    }
    // Check endPage boundary if specified
    if (context.endPage !== undefined && targetPage > context.endPage) {
      return false;
    }
  }
  
  // Check exceptPages exclusions
  if (context.exceptPages && context.exceptPages.includes(targetPage)) {
    return false;
  }
  
  return true;
}
```

## UI Architecture

### Page Sidebar - Contexts Section

**Purpose:** Show contexts that apply to current page

**Display:**
- List of regions on this page
- Context name, type, and page config summary
- Color indicator
- Inline visibility toggle (eye icon)
- "Remove this page from context" button

**Actions:**
- Create new region (draw region first, then modal opens)
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

**Purpose:** Manage all regions project-wide

**Display:**
- List of all regions with name, type, and page config
- Color indicator
- Inline visibility toggle, edit, and delete actions
- Create new region button

**Actions:**
- Toggle visibility with eye icon (show/hide on PDF)
- Edit region (opens modal with pre-filled data)
- Delete context (with confirmation)
- Create new region (activate drawing mode, draw region, then modal opens)

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
- Page sidebar "Create Region" button
- Project sidebar "Create Region" button

**Implementation Notes:**
- Region must be drawn BEFORE modal opens
- Modal opens after region is confirmed on PDF
- Edit mode: Modal title changes to "Edit Region" and pre-fills all fields

**Fields:**
- **Name:** User-provided name (required, e.g., "Header", "Footer", "Page Number Top-Right")
- **Type:** Ignore / Page Number (dropdown)
- **Apply to:**
  - ○ This page only (default if created from page sidebar)
  - ○ All pages
  - ○ Every other page:
    - Starting on: [___] (number input, required)
    - Ending on: [___] (number input, optional - defaults to last page)
  - ○ Custom pages: [___________________] (text input, e.g., "1-2, 5-6, 8, 10-12")
- **Except pages:** [___________________] (text input, comma-separated, only visible when mode is NOT "this_page", e.g., "3, 5, 7")
- **Color:** Color picker (default per type: Red for ignore, Purple for page_number)

**Validation:**
- Bbox must be drawn
- Name is required
- Page ranges must be valid (within document page count)
- Custom string must parse correctly (e.g., "1-2,5-6,8")
- "Every other starting page" must be within range (>= 1, <= document page count)
- "Every other ending page" (if specified) must be >= starting page and <= document page count
- Except pages must be valid comma-separated numbers and within the pages covered by the page config

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
- Click "Draw Region" in region creation modal
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
- **Color per region** (each region has its own color, independent of type)
  - Different exclude regions can have different colors
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
export const regions = pgTable("regions", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentId: uuid("document_id")  // Will change to projectId in Phase 6
    .references(() => sourceDocuments.id, { onDelete: "cascade" })
    .notNull(),
  regionType: regionTypeEnum("region_type").notNull(),  // 'exclude' | 'page_number'
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
export const regions = pgTable("regions", {
  // ... existing fields ...
  projectId: uuid("project_id")  // Changed from documentId
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  
  // New fields:
  name: text("name").notNull(),  // User-provided name for the region
  color: text("color").notNull(),  // Hex color (e.g., "#FCA5A5")
  visible: boolean("visible").default(true).notNull(),  // Controls rendering on PDF
  everyOther: boolean("every_other").default(false).notNull(),  // Apply every other page
  startPage: integer("start_page"),  // Starting page for every other (e.g., 4 = 4,6,8,10...)
  endPage: integer("end_page"),  // Ending page for every other (optional, defaults to last page)
  exceptPages: integer("except_pages").array(),  // Pages to exclude from this context
});
```

**Final Schema (after Phase 6 extensions):**
```typescript
{
  id: uuid;
  projectId: uuid;  // References projects
  name: text;  // User-provided name (e.g., "Header", "Footer", "Page Number Top-Right")
  regionType: 'exclude' | 'page_number';
  pageConfigMode: 'this_page' | 'all_pages' | 'custom';  // Note: "page_range" removed
  pageNumber: integer;  // For this_page mode
  pageRange: text;  // For custom mode (e.g., "1-2,5-6,8")
  everyOther: boolean;  // Whether to apply every other page
  startPage: integer;  // Starting page for every other
  endPage: integer;  // Ending page for every other (optional, defaults to last page)
  exceptPages: integer[];  // Pages to exclude (e.g., [3, 5, 7])
  bbox: json;  // BoundingBox in PDF user space
  color: text;  // Hex color
  visible: boolean;  // Visibility toggle
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
  regionType: 'exclude' | 'page_number';
  pageConfigMode: 'this_page' | 'all_pages' | 'custom';
  pageNumber?: number;
  pageRange?: string;
  everyOther: boolean;
  startPage?: number;
  endPage?: number;  // Optional ending page for every other mode
  exceptPages?: number[];  // Pages to exclude
  bbox: BoundingBox;
  color: string;
  visible: boolean;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
};

type CreateContextInput = {
  projectId: string;
  name: string;  // Required
  regionType: 'exclude' | 'page_number';
  bbox: BoundingBox;
  pageConfigMode: 'this_page' | 'all_pages' | 'custom';
  pageNumber?: number;
  pageRange?: string;
  everyOther?: boolean;
  startPage?: number;
  endPage?: number;  // Optional ending page for every other mode
  exceptPages?: number[];  // Optional exclusions
  color?: string;  // Default per type if not provided
  visible?: boolean;  // Default true
};
```

**Endpoints:**
```typescript
// apps/index-pdf-backend/src/trpc/routers/region.router.ts
context: {
  list: // Get all regions for a project
  create: // Create new region with bbox and page config
  update: // Update region (color, visible, page config, exceptPages, etc.)
  delete: // Soft delete context
  getForPage: // Get contexts that apply to a specific page number
  // Note: detectConflicts runs client-side, no separate endpoint needed
}
```

**Frontend Hooks:**
```typescript
// Similar pattern to indexEntry/indexMention hooks
const { data: contexts } = trpc.region.list.useQuery({ projectId });
const { data: pageContexts } = trpc.region.getForPage.useQuery({ 
  projectId, 
  pageNumber 
});
const createRegion = trpc.region.create.useMutation({
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
- ✅ Changed `regions.documentId` → `regions.projectId`
- ✅ Added `name` field (user-provided name for context)
- ✅ Added `color` field (hex color, defaults per type)
- ✅ Added `visible` field (boolean, default true)
- ✅ Added `everyOther` field (boolean, default false)
- ✅ Added `startPage` field (integer, for every other mode)
- ✅ Added `endPage` field (integer, optional ending page for every other mode)
- ✅ Added `exceptPages` field (integer array, for page exclusions)
- ✅ Updated RLS policies (inherit from projects)
- ✅ Generated migrations (`0001_real_abomination.sql`)

**1. tRPC Backend**
- ✅ Created region module (`region.repo.ts`, `region.service.ts`, `region.router.ts`)
- ✅ Implemented `region.list` (get all regions for project)
- ✅ Implemented `region.getForPage` (get contexts for specific page)
- ✅ Implemented `region.create` with default colors
- ✅ Implemented `region.update` for all fields
- ✅ Implemented `region.delete` (soft delete)
- ✅ Added event logging for context operations

**2. Shared Types & Utils**
- ✅ Created `@pubint/core/region.types.ts` with all Region types
- ✅ Created `@pubint/core/region.utils.ts` with page config logic
- ✅ Implemented `appliesToPage()` function for filtering
- ✅ Implemented `parsePageRange()` for custom page parsing
- ✅ Implemented `validatePageRange()` for validation
- ✅ Implemented `getPageConfigSummary()` for display

**3. Drawing Mode Integration**
- ✅ Reused existing region drawing from IndexMention flow
- ✅ Added `draw-region` action type to editor state
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
- ✅ Edit mode: Pre-fills data, changes title to "Edit Region"
- ✅ Uses tRPC create/update mutations

**5. Context Management UI**
- ✅ Project Sidebar: Lists all regions with name, type, pages
- ✅ Page Sidebar: Lists only regions for current page
- ✅ Inline visibility toggle (eye icon)
- ✅ Edit button (opens modal with pre-filled data)
- ✅ Delete button (with browser confirmation)
- ✅ Color indicator circle

**6. Context Rendering**
- ✅ Contexts render on PDF using existing `PdfHighlightLayer`
- ✅ Custom colors applied per region (via `contextColor` metadata)
- ✅ Visibility toggle hides/shows contexts
- ✅ Context highlights use selected hex color
- ✅ Semi-transparent fill for visibility

### ✅ Completed: Extended Features

**7. Page Exclusion ("Remove from Page")**
- ✅ Added `except_pages` field to schema (integer array)
- ✅ Updated `appliesToPage()` to check exceptPages
- ✅ Implemented "Remove from page" button in Page Sidebar
  - ✅ For "this_page" regions: Shows confirmation, then deletes context
  - ✅ For multi-page regions: Adds current page to exceptPages
- ✅ Added "Except pages" input to Create/Edit Region Modal (comma-separated, e.g., "3, 5, 7")
- ✅ Updated page config summary to show exceptions (e.g., "All pages except 3, 5, 7")
- ✅ Validated except pages are within the page config range

**8. Conflict Detection & Resolution**
- ✅ Implemented `detectPageNumberConflicts()` utility function (client-side)
- ✅ Conflict detection runs client-side using `useMemo` (no separate tRPC endpoint needed)
- ✅ Shows warning in Create/Edit modal when conflicts will occur
  - ✅ Calculates conflicting pages
  - ✅ Displays list of conflicts with region names
  - ✅ Allows user to proceed (warning, not blocking)
- ✅ Displays conflicts in Project Sidebar
  - ✅ Shows "Conflicts: 5, 7, 9" below context (inline, comma-separated)
  - ✅ Styles page numbers in red
  - ✅ Clicking page number navigates PDF to that page
- ✅ Displays conflict warning in Page Sidebar (when on conflicting page)
  - ✅ Lists all conflicting regions
  - ✅ Shows "Remove from this page" for each
  - ✅ Updates immediately after removal

**9. Testing Documentation**
- ✅ Documented all new functionality in phase-6-testing.md
- ✅ Added test cases for page exclusion
- ✅ Added test cases for conflict detection and resolution

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
- [ ] Region colors display correctly (independent per region)
- [ ] Visibility toggle shows/hides contexts
- [ ] Edit region updates correctly with optimistic updates
- [ ] Delete context removes from all pages with confirmation
- [ ] "Remove from this page" adjusts page config (doesn't delete)
- [ ] Hover shows tooltip with context details
- [ ] Click region scrolls to sidebar (page sidebar) or opens edit modal (project sidebar)
- [ ] Page sidebar shows only contexts for current page
- [ ] Project sidebar shows all regions

## Success Criteria

✅ Phase 6 Complete (Core Features):
- [x] Schema migration complete (name, color, visible, everyOther, startPage, extractedPageNumber)
- [x] tRPC endpoints implemented (region.create, list, update, delete, getForPage)
- [x] User can draw regions on PDF (reused existing region drawing mode)
- [x] User can create exclude regions
- [x] User can create page number regions
- [x] User can apply contexts to multiple pages (4 config modes: this-page, all-pages, every-other, custom)
- [x] User can name contexts for easy identification
- [x] User can customize context colors (independent per region)
- [x] Contexts render correctly on PDF with selected color
- [x] Page sidebar shows only contexts for current page
- [x] Project sidebar shows all regions
- [x] Edit operations work (modal pre-fills data)
- [x] Delete operations work (with confirmation)
- [x] Visibility toggles show/hide contexts (inline eye icon)

✅ Phase 6 Extended Features (Complete):
- [x] "Remove from this page" functionality
  - [x] Schema change: Added `except_pages` integer array field
  - [x] For "this_page" regions: Shows confirmation, deletes if confirmed
  - [x] For multi-page regions: Adds page to exceptPages array
  - [x] Edit modal shows "Except pages" input (for multi-page modes)
- [x] Page exclusion support (e.g., "every other starting on 1; except 3,5,7")
  - [x] Updated `appliesToPage()` to check exceptPages
  - [x] Display exceptions in page config summary
- [x] Conflict detection for overlapping page_number regions
  - [x] Client-side: `detectPageNumberConflicts()` utility function
  - [x] Conflict detection runs in Project Sidebar via `useMemo` (no tRPC endpoint)
  - [x] Warning in Create/Edit modal (non-blocking)
- [x] Conflict resolution UI with navigation to conflicting pages
  - [x] Project Sidebar: Shows red page numbers for conflicts (inline, comma-separated)
  - [x] Clicking red page number navigates to that page
  - [x] Page Sidebar: Shows conflict warning with "Remove from page" buttons
- [x] Testing documentation for all extended features (see phase-6-testing.md)

## Extended Features (Now Implementing)

The following features were identified during Phase 6 implementation and are now being implemented:

### Page Exclusion ("Except" Clause)

**Problem:** When user clicks "Remove from page" in Page Sidebar, we need to exclude specific pages from a region without recreating it.

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

**Special Case - "This Page Only" Context:**
When a region has `pageConfigMode: "this_page"` and the user clicks "Remove from page":
- Show confirmation: "Removing the last page from a region will delete it. Are you sure you'd like to proceed?"
- If confirmed: Delete the region entirely (soft delete)
- Rationale: A "this page only" context with zero pages makes no sense

**UI Updates:**
- "Remove from page" button adds current page to `exceptPages` array
- Edit Context modal shows excluded pages input (for all multi-page modes)
- Excluded pages input appears below page config options when mode is not "this_page"
- User can edit the excluded pages list to re-include pages
- Page config summary includes exceptions (e.g., "All pages except 3, 5, 7")

### Conflict Detection for Page Number Contexts

**Constraint:** Only ONE `page_number` region can apply to any given page (to avoid ambiguity in canonical page numbers).

**When to Check:** Automatically when creating or updating contexts.

**Create/Edit Modal Validation:**
When user submits the modal:
1. Calculate which pages the region will apply to
2. Check for conflicts with existing page_number regions
3. If conflicts exist, show warning before creating:
   ```
   ⚠️ Conflicts Detected
   
   This region will conflict with existing page number regions on:
   • Page 5 (with "Bottom-center Page Number")
   • Page 7 (with "Bottom-center Page Number")
   • Page 9 (with "Bottom-center Page Number")
   
   You can resolve these conflicts after creating the context, but
   page numbers will be unavailable until conflicts are resolved.
   
   [Cancel] [Create Anyway]
   ```
4. Allow user to proceed (warning only, not blocking)

**Conflict Detection Logic:**
```typescript
// Client-side: Detect conflicts when regions change (from @pubint/core/region.utils.ts)
function detectPageNumberConflicts({ 
  contexts, 
  maxPage 
}: {
  regions: Region[];
  maxPage: number;
}): Array<{ pageNumber: number; contexts: Context[] }> {
  const pageNumberRegions = contexts.filter(ctx => ctx.regionType === 'page_number');
  const conflicts = [];
  
  for (let page = 1; page <= maxPage; page++) {
    const regionsForPage = pageNumberRegions.filter(ctx => 
      appliesToPage({ context: ctx, targetPage: page })
    );
    
    if (regionsForPage.length > 1) {
      conflicts.push({
        pageNumber: page,
        contexts: regionsForPage,
      });
    }
  }
  
  return conflicts;
}
```

**Implementation Notes:**
- Conflict detection runs **client-side** using the shared utility function
- Project Sidebar uses `useMemo` to compute conflicts from fetched contexts
- Create/Edit modal calls the utility directly before submitting
- No separate tRPC endpoint needed (simplifies architecture)

**Conflict Display - Project Sidebar:**

After a region is created/updated, conflicts appear immediately below the context:

```
┌─────────────────────────────────┐
│ ● Top-right Page Number         │
│   Page Number                   │
│   All pages                     │
│   Conflicts: 5, 7, 9            │  ← Red colored page numbers
│   [👁][✏️][🗑️]                  │
└─────────────────────────────────┘
```

**Clicking a red page number:**
- Navigates the PDF viewer to that page
- Allows user to resolve conflict by removing one of the contexts

**Conflict Display - Page Sidebar:**

When viewing a page with conflicting page_number regions:

```
┌─────────────────────────────────┐
│ ⚠️ PAGE NUMBER CONFLICT          │
│                                 │
│ Multiple page number regions:  │
│ • Top-right Page Number         │
│   [Remove from this page]       │
│ • Bottom-center Page Number     │
│   [Remove from this page]       │
│                                 │
│ Resolve conflict to enable      │
│ canonical page number indexing. │
└─────────────────────────────────┘
```

**Important Notes:**
- Conflicts are NOT blocking - users can create conflicting regions
- Warning appears during creation/edit, but allows proceeding
- Red page numbers appear immediately after context is created/updated
- No separate conflict detection screen - just inline warnings and navigation

### Exclude Region Overlaps (No Conflict)

**Note:** Multiple `exclude` regions CAN overlap on the same page (no conflict). All exclude regions apply cumulatively.

## Next Phase

[Phase 7: Page Numbering System](../phase-7-page-numbering/) uses page number regions to extract and display canonical page numbers. All Phase 6 features (including page exclusion and conflict detection) have been completed and are ready for Phase 7 integration.
