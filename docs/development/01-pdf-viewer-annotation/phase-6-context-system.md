# Phase 6: Context System

**Status:** ⚪ Not Started  
**Dependencies:** Phase 4 completion  
**Duration:** 4-5 days

## Overview

Implement region-based context system for marking areas to ignore during text extraction (headers/footers) and areas containing page numbers for automatic extraction.

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
- Default assignment when creating context (Red for ignore, Purple for page-number)
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

## Backend Integration (Phase 5)

**Context Schema:**
```typescript
type Context {
  id: uuid;
  project: Project;
  type: 'ignore' | 'page-number';
  bbox_pdf: BoundingBox; // PDF user space
  page_config: {
    mode: 'this-page' | 'all-pages' | 'range' | 'custom';
    pages?: string; // "1-50" or "1-2,5-6,8"
    everyOther?: boolean;
    startPage?: int; // For "every other"
  };
  extracted_page_number?: string; // For page-number contexts
  color: string;
  visible: boolean;
  created_at: datetime;
  updated_at: datetime;
}
```

## Implementation Strategy

### 1. Drawing Mode (2 days)
- Add "draw region" mode to annotation system
- Click-drag to create rectangle
- Store bbox in PDF user space
- Visual feedback during drawing

### 2. Context Creation UI (1 day)
- Modal with all fields
- Page config options (radio buttons + inputs)
- Validation logic
- Color picker integration

### 3. Context Management (1 day)
- Page sidebar contexts section
- Project sidebar contexts section
- Edit/delete actions
- "Remove from this page" functionality

### 4. Context Rendering (1 day)
- Render contexts on PDF viewer
- Visibility toggles
- Hover/click interactions
- Z-index below mentions

## Testing Requirements

- [ ] Draw region creates correct bbox in PDF user space
- [ ] "Apply to all pages" creates correct page config
- [ ] "Every other" logic works correctly
- [ ] Custom page string parses correctly
- [ ] Contexts render at correct zoom levels
- [ ] Visibility toggle works
- [ ] Edit context updates correctly
- [ ] Delete context removes from all pages
- [ ] "Remove from this page" only removes from current page

## Success Criteria

- ✅ User can draw regions on PDF
- ✅ User can create ignore contexts
- ✅ User can create page number contexts
- ✅ User can apply contexts to multiple pages (5 config modes)
- ✅ Contexts render correctly on PDF
- ✅ Page sidebar shows relevant contexts
- ✅ Project sidebar shows all contexts
- ✅ Edit/delete operations work
- ✅ Visibility toggles work

## Next Phase

[Phase 7: Page Numbering System](./phase-7-page-numbering.md) uses page number contexts to extract and display canonical page numbers.
