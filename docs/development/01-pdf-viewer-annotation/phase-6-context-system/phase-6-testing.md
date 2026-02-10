# Phase 6: Context System - Testing Checklist

**Status:** ✅ Implementation Complete - Testing Pending  
**Related:** [Phase 6 Implementation](./phase-6-context-system.md)

**Implementation Notes:**
- All core features completed (February 10, 2026)
- Extended features completed (page exclusion, conflict detection, "every other" with end page)
- Conflict detection runs client-side via `useMemo` (no separate backend endpoint)
- Ready for comprehensive testing before Phase 7

## Pre-Testing Setup

### Database Migration
- [ ] Run `nvm use 23 && pnpm db:reset` to ensure schema includes `name` field
- [ ] Verify migration `0002_smooth_master_mold.sql` applied successfully
- [ ] Create a test project with a multi-page PDF (at least 10 pages)

### Test Data Preparation
- [ ] Upload a PDF with distinct headers/footers
- [ ] Upload a PDF with page numbers in different locations
- [ ] Ensure PDF has at least 10 pages for testing page config options

---

## 1. Context Creation Flow

### Drawing Mode Activation
- [ ] Click "Draw Context Region" button in Project Sidebar
- [ ] **Expected:** Button shows active state (styled button with toggle)
- [ ] **Expected:** Cursor changes to crosshair over PDF
- [ ] Click button again to toggle off
- [ ] **Expected:** Button returns to inactive state, cursor returns to default

### Region Drawing
- [ ] Activate drawing mode, click and drag on PDF to draw region
- [ ] **Expected:** Semi-transparent draft rectangle appears during drag
- [ ] **Expected:** Release creates the region
- [ ] **Expected:** Modal opens immediately after release with "Create Context" title
- [ ] Try drawing very small region (< 10px)
- [ ] **Expected:** Region is created (no minimum size validation)
- [ ] Try drawing region near page edge
- [ ] **Expected:** Region bbox is correctly captured within page bounds

### Create Context Modal - Name Field
- [ ] Modal opens with empty name field
- [ ] Try submitting without entering name
- [ ] **Expected:** Validation error: "Name is required"
- [ ] Enter name "Header"
- [ ] **Expected:** Name field accepts input
- [ ] Enter name with special characters "Header (Top-Right) - 2024"
- [ ] **Expected:** Special characters accepted

### Create Context Modal - Type Selection
- [ ] Default type is "Ignore"
- [ ] **Expected:** Color picker shows red (#FCA5A5)
- [ ] Change type to "Page Number"
- [ ] **Expected:** Color picker updates to purple (#C4B5FD)
- [ ] Change back to "Ignore"
- [ ] **Expected:** Color picker returns to red

### Create Context Modal - Page Config: This Page Only
- [ ] Select "This page only" radio
- [ ] **Expected:** No additional inputs appear
- [ ] Submit form
- [ ] **Expected:** Context created for current page only
- [ ] Navigate to different page
- [ ] **Expected:** Context not visible in Page Sidebar
- [ ] Navigate back to original page
- [ ] **Expected:** Context visible in Page Sidebar

### Create Context Modal - Page Config: All Pages
- [ ] Select "All pages" radio
- [ ] **Expected:** No additional inputs appear
- [ ] Submit form
- [ ] **Expected:** Context created
- [ ] Navigate through multiple pages
- [ ] **Expected:** Context visible on every page in Page Sidebar

### Create Context Modal - Page Config: Every Other Page
- [ ] Select "Every other page, starting on" radio
- [ ] **Expected:** Number inputs appear IMMEDIATELY below radio option (starting on, ending on)
- [ ] Input "4" as starting page
- [ ] **Expected:** Input accepts value
- [ ] Leave ending page empty (optional, defaults to last page)
- [ ] Submit form
- [ ] **Expected:** Context created
- [ ] Navigate to page 4
- [ ] **Expected:** Context visible in Page Sidebar
- [ ] Navigate to page 5
- [ ] **Expected:** Context NOT visible in Page Sidebar
- [ ] Navigate to page 6
- [ ] **Expected:** Context visible in Page Sidebar
- [ ] Navigate to page 3
- [ ] **Expected:** Context NOT visible in Page Sidebar (before start page)

### Create Context Modal - Page Config: Every Other Page with End Page
- [ ] Select "Every other page, starting on" radio
- [ ] Input "2" as starting page, "8" as ending page
- [ ] Submit form
- [ ] **Expected:** Context created
- [ ] Navigate to pages 2, 4, 6, 8
- [ ] **Expected:** Context visible in Page Sidebar
- [ ] Navigate to page 10
- [ ] **Expected:** Context NOT visible (after end page)
- [ ] Navigate to pages 3, 5, 7, 9
- [ ] **Expected:** Context NOT visible (odd pages)

### Create Context Modal - Page Config: Custom Pages
- [ ] Select "Custom pages" radio
- [ ] **Expected:** Text input appears IMMEDIATELY below radio option
- [ ] Leave input empty and try to submit
- [ ] **Expected:** Validation error: "Page range is required"
- [ ] Enter "1-5"
- [ ] **Expected:** Input accepts value
- [ ] Submit form
- [ ] **Expected:** Context created
- [ ] Navigate to pages 1, 3, 5
- [ ] **Expected:** Context visible in Page Sidebar
- [ ] Navigate to page 6
- [ ] **Expected:** Context NOT visible in Page Sidebar

### Create Context Modal - Custom Pages Validation
- [ ] Enter "1-2,5-6,8"
- [ ] **Expected:** Input accepts value, no validation error
- [ ] Submit form
- [ ] **Expected:** Context created
- [ ] Verify context applies to pages 1, 2, 5, 6, 8 only
- [ ] Enter invalid format "abc"
- [ ] **Expected:** Validation error on submit
- [ ] Enter "1-999" (beyond document page count)
- [ ] **Expected:** Validation error on submit

### Create Context Modal - Color Picker
- [ ] Open color picker
- [ ] **Expected:** Color picker UI appears
- [ ] Select custom color (e.g., #00FF00 green)
- [ ] **Expected:** Color picker updates to show green
- [ ] Submit form
- [ ] **Expected:** Context created with green color
- [ ] Check PDF viewer
- [ ] **Expected:** Context region rendered with green background

### Create Context Modal - Switching Between Page Configs
- [ ] Select "Custom pages" → observe input appears
- [ ] Switch to "All pages" → **Expected:** Custom pages input disappears
- [ ] Switch to "Every other page" → **Expected:** Starting page input appears
- [ ] Switch to "This page only" → **Expected:** Starting page input disappears
- [ ] **Expected:** No orphaned inputs remain visible

---

## 2. Context Display

### Project Sidebar - Context List
- [ ] Create 3+ contexts with different names
- [ ] Open Project Sidebar → Contexts section
- [ ] **Expected:** All contexts listed with:
  - Name (first line, bold)
  - Type (second line, "Ignore" or "Page Number")
  - Page config summary (third line, e.g., "All pages", "Pages 1-5")
  - Color indicator circle
  - Eye icon, Edit icon, Delete icon
- [ ] Verify names are displayed correctly for all contexts
- [ ] Verify color circles match selected colors

### Page Sidebar - Context List
- [ ] Create context applying to "All pages"
- [ ] Create context applying to "This page only" (page 1)
- [ ] Create context applying to "Custom pages: 1,3,5"
- [ ] Navigate to page 1
- [ ] **Expected:** Page Sidebar shows all 3 contexts (all apply to page 1)
- [ ] Navigate to page 2
- [ ] **Expected:** Page Sidebar shows only "All pages" context
- [ ] Navigate to page 3
- [ ] **Expected:** Page Sidebar shows "All pages" and "Custom" contexts
- [ ] Verify each context shows:
  - Name (first line)
  - Type (second line)
  - Page config summary (third line)
  - Eye icon and "Remove Page" button

---

## 3. Context Visibility Toggle

### Project Sidebar - Eye Icon
- [ ] Create visible context (default)
- [ ] **Expected:** Eye icon shows "eye" (open)
- [ ] Click eye icon
- [ ] **Expected:** Icon changes to "eye-off" (closed)
- [ ] Check PDF viewer
- [ ] **Expected:** Context region no longer rendered
- [ ] Check Page Sidebar
- [ ] **Expected:** Context still listed (visibility is separate from page config)
- [ ] Click eye icon again
- [ ] **Expected:** Icon changes back to "eye" (open)
- [ ] **Expected:** Context region rendered again on PDF

### Page Sidebar - Eye Icon
- [ ] Navigate to page with context
- [ ] Toggle visibility using eye icon in Page Sidebar
- [ ] **Expected:** Same behavior as Project Sidebar
- [ ] Navigate to Project Sidebar
- [ ] **Expected:** Eye icon state matches (synced)

### Multiple Contexts Visibility
- [ ] Create 2 contexts on same page with overlapping regions
- [ ] Hide first context
- [ ] **Expected:** Only second context visible on PDF
- [ ] Hide second context
- [ ] **Expected:** No contexts visible on PDF
- [ ] Show both contexts
- [ ] **Expected:** Both contexts rendered (may overlap)

---

## 4. Context Editing

### Edit Button Click
- [ ] Click edit icon (pencil) in Project Sidebar
- [ ] **Expected:** Modal opens with title "Edit Context" (not "Create Context")
- [ ] **Expected:** All fields pre-filled with existing data:
  - Name field shows context name
  - Type dropdown shows selected type
  - Page config radio shows selected mode
  - If "Custom pages", text input shows page range
  - If "Every other page", number input shows starting page
  - Color picker shows selected color

### Edit Name
- [ ] Change name from "Header" to "Top Header"
- [ ] Click "Save"
- [ ] **Expected:** Modal closes
- [ ] **Expected:** Project Sidebar shows updated name "Top Header"
- [ ] **Expected:** Page Sidebar shows updated name "Top Header"

### Edit Type
- [ ] Edit context with type "Ignore"
- [ ] Change type to "Page Number"
- [ ] **Expected:** Color picker updates to purple (default for page_number)
- [ ] Click "Save"
- [ ] **Expected:** Context updated
- [ ] **Expected:** Type changes in both sidebars

### Edit Page Config
- [ ] Edit context with "All pages"
- [ ] Change to "Custom pages: 1-3"
- [ ] Click "Save"
- [ ] **Expected:** Context updated
- [ ] Navigate to page 4
- [ ] **Expected:** Context NOT visible in Page Sidebar
- [ ] Navigate to page 2
- [ ] **Expected:** Context visible in Page Sidebar

### Edit Color
- [ ] Edit context
- [ ] Change color from red to blue (#0000FF)
- [ ] Click "Save"
- [ ] **Expected:** Context color indicator updates in sidebar
- [ ] Check PDF viewer
- [ ] **Expected:** Context region now rendered with blue background

### Edit Modal Cancellation
- [ ] Open edit modal
- [ ] Change name
- [ ] Click "Cancel"
- [ ] **Expected:** Modal closes
- [ ] **Expected:** Name NOT changed in sidebar

---

## 5. Context Deletion

### Delete from Project Sidebar
- [ ] Click delete icon (trash) in Project Sidebar
- [ ] **Expected:** Browser confirmation dialog: "Are you sure you want to delete this context?"
- [ ] Click "Cancel"
- [ ] **Expected:** Context not deleted
- [ ] Click delete icon again
- [ ] Click "OK" in confirmation
- [ ] **Expected:** Context removed from Project Sidebar
- [ ] Navigate to pages where context was applied
- [ ] **Expected:** Context no longer visible in Page Sidebar
- [ ] **Expected:** Context no longer rendered on PDF

### Delete Syncing
- [ ] Create context applying to multiple pages
- [ ] Navigate to page with context (Page Sidebar shows it)
- [ ] Open Project Sidebar, delete context
- [ ] **Expected:** Context immediately removed from Page Sidebar
- [ ] Navigate to other pages where context applied
- [ ] **Expected:** Context not visible anywhere

---

## 6. Context Rendering on PDF

### Basic Rendering
- [ ] Create context with default red color
- [ ] **Expected:** Semi-transparent red rectangle renders on PDF at context bbox
- [ ] Zoom in/out on PDF
- [ ] **Expected:** Context region scales correctly with zoom

### Multiple Contexts on Same Page
- [ ] Create 2+ contexts on same page (non-overlapping)
- [ ] **Expected:** All contexts render simultaneously
- [ ] Create 2 contexts with overlapping regions
- [ ] **Expected:** Both render (may layer on top of each other)

### Context Colors
- [ ] Create context with red color (#FF0000)
- [ ] **Expected:** Context rendered with red background
- [ ] Create context with blue color (#0000FF)
- [ ] **Expected:** Context rendered with blue background
- [ ] Edit first context to green (#00FF00)
- [ ] **Expected:** Context updates to green on PDF immediately

### Hidden Contexts
- [ ] Create context, toggle visibility off
- [ ] **Expected:** Context does NOT render on PDF
- [ ] Toggle visibility on
- [ ] **Expected:** Context renders on PDF

---

## 7. Page Config Logic

### This Page Only
- [ ] Create context on page 3 with "This page only"
- [ ] Navigate to pages 1, 2, 4, 5
- [ ] **Expected:** Context not visible on any other page
- [ ] Navigate back to page 3
- [ ] **Expected:** Context visible

### All Pages
- [ ] Create context with "All pages"
- [ ] Navigate through all pages in document
- [ ] **Expected:** Context visible on every page

### Every Other Starting On (Odd Start, No End Page)
- [ ] Create context with "Every other, starting on 5"
- [ ] Navigate to pages: 3, 4, 5, 6, 7, 8, 9, 10
- [ ] **Expected Visible:** Pages 5, 7, 9 (and all subsequent odd pages)
- [ ] **Expected Hidden:** Pages 3, 4, 6, 8, 10

### Every Other Starting On (Even Start, No End Page)
- [ ] Create context with "Every other, starting on 4"
- [ ] Navigate to pages: 2, 3, 4, 5, 6, 7, 8, 9
- [ ] **Expected Visible:** Pages 4, 6, 8 (and all subsequent even pages)
- [ ] **Expected Hidden:** Pages 2, 3, 5, 7, 9

### Every Other with End Page
- [ ] Create context with "Every other, starting on 2, ending on 8"
- [ ] Navigate to pages: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
- [ ] **Expected Visible:** Pages 2, 4, 6, 8 only
- [ ] **Expected Hidden:** Pages 1, 3, 5, 7, 9, 10 (before start, after end, or odd pages)

### Every Other with End Page Validation
- [ ] Select "Every other" mode
- [ ] Input starting page "10", ending page "5"
- [ ] Try to submit
- [ ] **Expected:** Validation error (ending page must be >= starting page)

### Custom Pages - Simple Range
- [ ] Create context with "1-5"
- [ ] Navigate to pages: 1, 3, 5, 6, 10
- [ ] **Expected Visible:** Pages 1, 3, 5
- [ ] **Expected Hidden:** Pages 6, 10

### Custom Pages - Multiple Ranges
- [ ] Create context with "1-2,5-6,8"
- [ ] Navigate to pages: 1, 2, 3, 4, 5, 6, 7, 8, 9
- [ ] **Expected Visible:** Pages 1, 2, 5, 6, 8
- [ ] **Expected Hidden:** Pages 3, 4, 7, 9

### Custom Pages - Individual Pages
- [ ] Create context with "1,3,5,7,9"
- [ ] Navigate to odd pages 1-9
- [ ] **Expected Visible:** Pages 1, 3, 5, 7, 9
- [ ] Navigate to even pages 2-10
- [ ] **Expected Hidden:** All even pages

---

## 8. Backend & Data Integrity

### Database Persistence
- [ ] Create context
- [ ] Refresh browser page
- [ ] **Expected:** Context still exists in Project Sidebar
- [ ] **Expected:** Context renders on PDF

### Query Invalidation
- [ ] Open Project Sidebar and Page Sidebar side-by-side (if possible)
- [ ] Create context in Project Sidebar
- [ ] **Expected:** Page Sidebar updates immediately if context applies to current page
- [ ] Edit context in Project Sidebar
- [ ] **Expected:** Page Sidebar updates immediately
- [ ] Delete context in Project Sidebar
- [ ] **Expected:** Page Sidebar updates immediately

### Name Field in Database
- [ ] Create context with name "Test Context"
- [ ] Open browser dev tools → Network tab
- [ ] Observe tRPC response from `context.list`
- [ ] **Expected:** Response includes `name: "Test Context"` field
- [ ] If name is missing, schema migration may not have been applied

---

## 9. Edge Cases & Error Handling

### Empty Name
- [ ] Open create context modal
- [ ] Leave name field empty
- [ ] Try to submit
- [ ] **Expected:** Validation error: "Name is required"

### Invalid Custom Page Range
- [ ] Enter "abc" in custom pages
- [ ] Try to submit
- [ ] **Expected:** Validation error
- [ ] Enter "1-1000" (beyond document page count of e.g., 50)
- [ ] Try to submit
- [ ] **Expected:** Validation error

### Starting Page Beyond Document Length
- [ ] Select "Every other, starting on"
- [ ] Enter starting page "999" (beyond document page count)
- [ ] Try to submit
- [ ] **Expected:** Validation error

### Creating Multiple Contexts Rapidly
- [ ] Create 5 contexts in quick succession
- [ ] **Expected:** All 5 contexts created and listed
- [ ] **Expected:** No duplicate entries or UI glitches

### Deleting Context While Viewing It
- [ ] Navigate to page with single context
- [ ] Delete context from Project Sidebar
- [ ] **Expected:** Context removed from Page Sidebar immediately
- [ ] **Expected:** Context no longer rendered on PDF
- [ ] **Expected:** No errors in browser console

---

## 10. Page Exclusion ("Remove from Page")

### Remove from Multi-Page Context
- [ ] Create context with "All pages"
- [ ] Navigate to page 5
- [ ] Click "Remove from this page" button in Page Sidebar
- [ ] **Expected:** Button triggers update mutation
- [ ] **Expected:** Context no longer appears in Page Sidebar for page 5
- [ ] Navigate to page 4 and page 6
- [ ] **Expected:** Context still appears on pages 4 and 6
- [ ] Open Edit Context modal
- [ ] **Expected:** "Except pages" field shows "5"

### Remove from "This Page Only" Context
- [ ] Create context with "This page only" on page 3
- [ ] Click "Remove from this page" button
- [ ] **Expected:** Confirmation dialog: "Removing the last page from a context will delete it. Are you sure you'd like to proceed?"
- [ ] Click "Cancel"
- [ ] **Expected:** Context not deleted
- [ ] Click "Remove from this page" again, click "OK"
- [ ] **Expected:** Context deleted entirely (soft delete)
- [ ] Check Project Sidebar
- [ ] **Expected:** Context no longer listed
- [ ] **Implementation Note:** Uses `deleteContext` mutation for "this_page" contexts, `updateContext` with `exceptPages` for multi-page contexts

### Remove Multiple Pages
- [ ] Create context with "All pages"
- [ ] Navigate to page 3, click "Remove from this page"
- [ ] Navigate to page 7, click "Remove from this page"
- [ ] Navigate to page 10, click "Remove from this page"
- [ ] **Expected:** Context not visible on pages 3, 7, 10
- [ ] Navigate to other pages
- [ ] **Expected:** Context visible on all other pages
- [ ] Open Edit Context modal
- [ ] **Expected:** "Except pages" field shows "3, 7, 10"

### Re-include Excluded Pages
- [ ] Create context with "All pages except 3, 7"
- [ ] Open Edit Context modal
- [ ] **Expected:** "Except pages" field shows "3, 7"
- [ ] Change "Except pages" to "3" (remove 7)
- [ ] Click "Save"
- [ ] Navigate to page 7
- [ ] **Expected:** Context now appears in Page Sidebar
- [ ] Navigate to page 3
- [ ] **Expected:** Context does NOT appear

### Except Pages Input Validation
- [ ] Create context with "Custom pages: 1-10"
- [ ] Open Edit Context modal
- [ ] Enter "15" in "Except pages" (outside custom range)
- [ ] Try to submit
- [ ] **Expected:** Validation error: "Except pages must be within the page config range"
- [ ] Enter "3, 5, abc" (invalid format)
- [ ] Try to submit
- [ ] **Expected:** Validation error about invalid format
- [ ] Enter "3, 5, 7" (valid)
- [ ] Submit
- [ ] **Expected:** Context updated successfully

### Except Pages Display
- [ ] Create context with "All pages except 3, 5, 7"
- [ ] Check Project Sidebar
- [ ] **Expected:** Page config summary shows "All pages except 3, 5, 7"
- [ ] Create context with "Every other starting on 1, except 3, 7"
- [ ] **Expected:** Summary shows something like "(every other, 1-[last page]) except 3, 7"
- [ ] Create context with "Custom: 1-10,20-30 except 5, 25"
- [ ] **Expected:** Summary shows "1-10, 20-30 except 5, 25"
- [ ] **Implementation Note:** Summary generation uses `getPageConfigSummary()` from `@pubint/core/context.utils.ts`

---

## 11. Conflict Detection & Resolution

### Create Context with Conflicts
- [ ] Create page_number context "Top-right PN" with "All pages"
- [ ] Navigate to page 5
- [ ] Draw second page_number context region
- [ ] Fill modal with name "Bottom-center PN", type "Page Number", "All pages"
- [ ] Try to submit
- [ ] **Expected:** Conflict warning appears inline in the modal (replacing form fields):
  - Header: "⚠️ Conflicts Detected"
  - Lists conflicting pages (e.g., "Page 1, 2, 3...")
  - Shows conflicting context names
  - Message: "You can resolve these conflicts after creating the context..."
  - Buttons: "Cancel" and "Save Anyway" (modal footer buttons are hidden)
- [ ] Click "Cancel"
- [ ] **Expected:** Warning disappears, form fields reappear, context not created
- [ ] Submit again, click "Save Anyway"
- [ ] **Expected:** Context created despite conflicts
- [ ] **Implementation Note:** Warning replaces form content, footer buttons hidden during warning

### Conflict Display - Project Sidebar
- [ ] After creating conflicting contexts from previous test
- [ ] Open Project Sidebar
- [ ] **Expected:** Both contexts show conflicts below them (inline, comma-separated):
  - "Top-right PN" → "Conflicts: 1, 2, 3, 4, 5, ..." (in red, comma-separated)
  - "Bottom-center PN" → "Conflicts: 1, 2, 3, 4, 5, ..." (in red, comma-separated)
- [ ] **Expected:** Conflict list shows up to 20 page numbers, then "..." if more
- [ ] Click on red page number "5" under "Top-right PN"
- [ ] **Expected:** PDF viewer navigates to page 5
- [ ] **Expected:** URL updates to reflect page 5
- [ ] **Implementation Note:** Conflicts are computed client-side via `useMemo` in the Project Sidebar

### Conflict Display - Page Sidebar
- [ ] While on page 5 (with conflicts from previous test)
- [ ] Open Page Sidebar
- [ ] **Expected:** Conflict warning appears at top:
  ```
  ⚠️ PAGE NUMBER CONFLICT
  
  Multiple page number contexts:
  • Top-right Page Number
    [Remove from this page]
  • Bottom-center Page Number
    [Remove from this page]
  
  Resolve conflict to enable
  canonical page number indexing.
  ```

### Resolve Conflict - Remove from Page
- [ ] On page 5 with conflict warning visible
- [ ] Click "Remove from this page" under "Bottom-center Page Number"
- [ ] **Expected:** Conflict warning disappears
- [ ] **Expected:** Only "Top-right Page Number" listed in Page Sidebar
- [ ] Navigate to page 6
- [ ] **Expected:** Still shows conflict (only removed from page 5)
- [ ] Navigate back to page 5
- [ ] **Expected:** No conflict, only "Top-right Page Number" visible

### Conflict with Every Other Page
- [ ] Create page_number context "Even pages PN" with "Every other starting on 2"
- [ ] Create page_number context "All pages PN" with "All pages"
- [ ] **Expected:** Warning shows conflicts on pages 2, 4, 6, 8... (even pages)
- [ ] Click "Create Anyway"
- [ ] Navigate to page 2
- [ ] **Expected:** Page Sidebar shows conflict warning
- [ ] Navigate to page 3
- [ ] **Expected:** No conflict warning (only "All pages PN" applies)

### Conflict with Custom Pages
- [ ] Create page_number context "Custom PN" with "Custom: 1-5, 10-15"
- [ ] Create page_number context "Overlapping PN" with "Custom: 3-8"
- [ ] **Expected:** Warning shows conflicts on pages 3, 4, 5 (overlap)
- [ ] Click "Create Anyway"
- [ ] Navigate to pages 1, 2
- [ ] **Expected:** No conflict (only "Custom PN" applies)
- [ ] Navigate to page 3
- [ ] **Expected:** Conflict warning (both apply)
- [ ] Navigate to pages 6, 7, 8
- [ ] **Expected:** No conflict (only "Overlapping PN" applies)

### No Conflict for Ignore Contexts
- [ ] Create ignore context "Header" with "All pages"
- [ ] Create ignore context "Footer" with "All pages"
- [ ] **Expected:** NO conflict warning (ignore contexts can overlap)
- [ ] Navigate to any page
- [ ] **Expected:** Both contexts visible, no conflict warning
- [ ] Check Project Sidebar
- [ ] **Expected:** No conflict indicators for ignore contexts

### Edit Context to Create Conflict
- [ ] Create page_number context "PN 1" with "Custom: 1-5"
- [ ] Create page_number context "PN 2" with "Custom: 10-15"
- [ ] **Expected:** No conflicts initially
- [ ] Edit "PN 2", change to "Custom: 3-8"
- [ ] Try to submit
- [ ] **Expected:** Warning shows conflicts on pages 3, 4, 5
- [ ] Click "Save Anyway"
- [ ] **Expected:** Conflicts appear in Project Sidebar

### Edit Context to Resolve Conflict
- [ ] With conflicting contexts from previous test
- [ ] Edit "PN 2", change to "Custom: 6-10" (no overlap)
- [ ] Submit
- [ ] **Expected:** No warning (conflict resolved)
- [ ] Check Project Sidebar
- [ ] **Expected:** No conflict indicators on either context
- [ ] Navigate to pages 3, 4, 5
- [ ] **Expected:** No conflict warnings in Page Sidebar

---

## 12. Edge Cases & Error Handling (Extended)

Use this template to record test results:

```markdown
## Test Run: [Date]

**Tester:** [Name]
**Environment:** [Browser, OS]
**Database:** [Fresh reset? Migration applied?]

### Results
- Total Tests: __
- Passed: __
- Failed: __
- Blocked: __

### Failed Tests
1. [Test Name]: [Issue Description]
2. [Test Name]: [Issue Description]

### Blockers
1. [Blocker Description]

### Notes
- [Any additional observations]
```

---

## 12. Edge Cases & Error Handling (Extended)

### Except Pages Edge Cases
- [ ] Create context with "All pages except 1-200" (all pages excluded)
- [ ] **Expected:** Validation warning or allow but context never shows anywhere
- [ ] Create context "Custom: 1-10 except 1-10" (all pages in range excluded)
- [ ] **Expected:** Similar to above
- [ ] Try to exclude page 999 when document only has 100 pages
- [ ] **Expected:** Validation error

### Conflict Detection Edge Cases
- [ ] Create 3+ page_number contexts all applying to same page
- [ ] **Expected:** Conflict warning lists all 3+ contexts
- [ ] Delete one conflicting context
- [ ] **Expected:** Conflicts update immediately (fewer conflicts or resolved)
- [ ] Create page_number context that conflicts on page 1 only
- [ ] **Expected:** Warning shows only page 1 in conflict list

### Remove from Page During Navigation
- [ ] Create context "All pages"
- [ ] Navigate rapidly between pages 1, 2, 3, 4, 5
- [ ] While navigating, click "Remove from page" on page 3
- [ ] **Expected:** No UI glitches, context removed from page 3 only
- [ ] Navigate back to page 3
- [ ] **Expected:** Context not visible

---

## Post-Testing Actions

- [ ] Document any bugs found in GitHub Issues or project tracker
- [ ] Update phase-6-context-system.md if implementation differs from spec
- [ ] Verify all migrations applied correctly in production/staging
- [ ] Mark Phase 6 as fully tested and ready for Phase 7
