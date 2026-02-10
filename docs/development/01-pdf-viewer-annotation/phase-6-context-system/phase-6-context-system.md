# Phase 6: Context System

**Status:** ⚪ Not Started  
**Dependencies:** Phase 5 completion ✅  
**Duration:** 5-6 days

## Overview

Implement region-based context system for marking areas to ignore during text extraction (headers/footers) and areas containing page numbers for automatic extraction.

**Schema Status:** The `contexts` table was created in Phase 5 (Task 5A) with basic fields. Phase 6 will extend the schema with:
- Color customization (`color` field)
- Visibility toggles (`visible` field)
- "Every other page" support (`everyOther`, `startPage` fields)
- Extracted page number storage (`extractedPageNumber` field)
- Association changed from `documentId` → `projectId` (simpler, 1:1 in MVP)

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

### Range
- From page X to page Y
- Example: "5-150" (pages 5 through 150)
- Optional: Every other page checkbox

### Custom
- Comma-separated list of ranges and individual pages
- Example: "1-2, 5-6, 8, 10-12"
- Flexible for complex patterns

### Every Other (modifier)
- Applies to "all pages" or "range" modes
- Start page configurable
- Example: "Every other page starting on page 4" = 4, 6, 8, 10...
- Example: "Every other page starting on page 5" = 5, 7, 9, 11...

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
- Type (ignore/page-number)
- Color indicator
- Visibility toggle
- "Remove this page from context" button

**Actions:**
- Create new context (opens creation modal)
- Click context → highlight on PDF
- Remove page from context
- Edit context → opens project sidebar context section

**Mockup:**
```
┌─────────────────────────────────┐
│ Contexts (2)                    │
│                                 │
│ ● Ignore: Header              ↗ │
│   All pages                     │
│   [Remove from this page]       │
│                                 │
│ ● Page Number: Top-right      ↗ │
│   Every other (starting page 4) │
│   [Remove from this page]       │
│                                 │
│ [+ Create Context]              │
└─────────────────────────────────┘
```

### Project Sidebar - Contexts Section

**Purpose:** Manage all contexts project-wide

**Display:**
- List of all contexts
- Type, page config summary
- Edit/delete actions
- Create new context

**Actions:**
- View all contexts
- Edit context (full modal with all options)
- Delete context (confirmation)
- Create new context

**Mockup:**
```
┌─────────────────────────────────┐
│ Contexts (5)                    │
│                                 │
│ ● Ignore: Header               │
│   All pages              [Edit] │
│                                 │
│ ● Ignore: Footer               │
│   All pages              [Edit] │
│                                 │
│ ● Page Number: Top-right       │
│   Pages 4-150 (every other)    │
│                          [Edit] │
│                                 │
│ ● Page Number: Bottom-center   │
│   Pages 5-151 (every other)    │
│                          [Edit] │
│                                 │
│ ● Ignore: Chapter headings     │
│   Custom: 10,25,40,55    [Edit] │
│                                 │
│ [+ Create Context]              │
└─────────────────────────────────┘
```

## Context Creation Modal

**Triggered from:**
- Page sidebar "Create Context" button
- Project sidebar "Create Context" button

**Fields:**
- **Type:** Ignore / Page Number (dropdown)
- **Draw Region:** Click to activate drawing mode, then click-drag on PDF
- **Apply to:**
  - ○ This page only (default if created from page sidebar)
  - ○ All pages
  - ○ Page range: [___] to [___]
    - □ Every other page
    - □ Starting on page: [___] (if "every other" checked)
  - ○ Custom: [___________________] (e.g., "1-2, 5-6, 8, 10-12")
- **Color:** Color picker (default per type)
- **Visible:** Checkbox (default: true)

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
  contextType: 'ignore' | 'page_number';
  pageConfigMode: 'this_page' | 'all_pages' | 'page_range' | 'custom';
  pageNumber: integer;  // For this_page mode
  pageRange: text;  // For page_range/custom modes
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
// Shared types
type Context = {
  id: string;
  projectId: string;
  contextType: 'ignore' | 'page_number';
  pageConfigMode: 'this_page' | 'all_pages' | 'page_range' | 'custom';
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
  contextType: 'ignore' | 'page_number';
  bbox: BoundingBox;
  pageConfigMode: 'this_page' | 'all_pages' | 'page_range' | 'custom';
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

## Implementation Strategy

### 0. Schema Migration (0.5 days)
- Change `contexts.documentId` → `contexts.projectId`:
  - Update foreign key reference (projects 1:1 documents in MVP)
  - Simpler for UI (no need to resolve document → project)
- Add new fields to `contexts` table:
  - `color: text` (default: "#FCA5A5" for ignore, "#C4B5FD" for page_number)
  - `visible: boolean` (default: true)
  - `everyOther: boolean` (default: false)
  - `startPage: integer` (nullable, for every other mode)
  - `extractedPageNumber: text` (nullable, for page_number contexts)
- Update Drizzle schema and generate migration
- Update RLS policies (inherit from projects instead of source_documents)
- Add tRPC endpoints for context CRUD

### 1. Drawing Mode (2 days)
- Add "draw region" mode to annotation system
- Click-drag to create rectangle
- Store bbox in PDF user space
- Visual feedback during drawing
- Reuse existing coordinate conversion from highlight system

### 2. Context Creation UI (1 day)
- Modal with all fields
- Page config options (radio buttons + inputs)
- Validation logic
- Color picker integration
- Default colors per context type

### 3. Context Management (1 day)
- Page sidebar contexts section (contexts for current page)
- Project sidebar contexts section (all contexts)
- Edit/delete actions with confirmation dialogs
- "Remove from this page" functionality (adjust page config)

### 4. Context Rendering (1 day)
- Render contexts on PDF viewer (semi-transparent rectangles)
- Visibility toggles (hide/show)
- Hover/click interactions
- Z-index below mentions but above canvas
- Color per context (not per type)

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

Phase 6 complete when:
- [ ] Schema migration complete (nested pageConfig, color, visible, extractedPageNumber)
- [ ] tRPC endpoints implemented (context.create, list, update, delete)
- [ ] User can draw regions on PDF (click-drag with visual feedback)
- [ ] User can create ignore contexts
- [ ] User can create page number contexts
- [ ] User can apply contexts to multiple pages (5 config modes: this-page, all-pages, page-range, custom, every-other)
- [ ] User can customize context colors (independent per context)
- [ ] Contexts render correctly on PDF at all zoom levels
- [ ] Page sidebar shows only contexts for current page
- [ ] Project sidebar shows all contexts
- [ ] Edit/delete operations work with optimistic updates
- [ ] Visibility toggles show/hide contexts
- [ ] "Remove from this page" adjusts page config without deleting context
- [ ] Interaction tests passing for all context operations

## Next Phase

[Phase 7: Page Numbering System](../phase-7-page-numbering/) uses page number contexts to extract and display canonical page numbers.
