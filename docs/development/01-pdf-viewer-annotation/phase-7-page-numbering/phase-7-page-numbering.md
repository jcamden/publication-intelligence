# Phase 7: Page Numbering System

**Status:** ⚪ Not Started  
**Dependencies:** Phase 6 completion (Context System) ✅  
**Duration:** 4-5 days (includes Phase 6 extensions: page exclusion, conflict detection)

## Overview

Implement multi-layer page numbering system with automatic extraction from contexts, project-level overrides, and page-level overrides. Display all layers with color-coding for transparency and debugging.

**Note:** Phase 6 Context System is complete with core features. Phase 7 will complete these deferred features:
- ✅ User-named contexts (e.g., "Top-right page number", "Bottom-center page number")
- ✅ `page_number` context type with `extracted_page_number` field for storing extracted values
- 🔄 **Page exclusion** (`exceptPages` field) - enables "Remove from page" functionality
- 🔄 **Conflict detection** - ensures only ONE page_number context per page
- 🔄 **Conflict resolution UI** - displays conflicts with navigation to resolve them

**Design Constraint:** Only ONE page_number context can apply to any page (to avoid ambiguity in canonical page numbers). Multiple ignore contexts CAN overlap.

## Page Numbering Layers

### 1. Document Page Number (always present)
- Sequential: 1, 2, 3... (PDF page order)
- Never changes
- Always visible
- Source of truth for internal operations

### 2. Context-Derived Page Number (from page number contexts)
- Extracted from page number context bboxes (contexts with `contextType: 'page_number'`)
- Each context has a user-provided name (e.g., "Top-right page number") for identification
- Automatic (AI/OCR extraction) stored in `contexts.extracted_page_number`
- Can include: numbers, Roman numerals, alphabetic
- Pages without extracted numbers are marked as [bracketed] = non-indexable

### 3. Project-Level Override (editable string)
- User can override entire page number sequence
- Edits in project sidebar
- Applies to all pages (unless page-level override)
- Validated for correctness (count, sequence, format)

### 4. Page-Level Override (single-page)
- User can override a single page's number
- Edits in page sidebar
- Takes precedence over project override
- Displayed with distinct styling (*asterisks*)

### Final (Canonical) Page Number
- **Always computed/derived**, never stored as persistent data
- Precedence: page > project > context > document
- Only computed when NO page_number context conflicts exist
- Used for indexing mentions (stored as reference to document page number)
- Displayed in index export
- **Optional:** "Save current state" button (when conflict-free) to snapshot canonical page numbers if needed for performance

## Page Number Format Examples

### Simple case (all layers align):
```
Document:     1, 2, 3, 4, 5, 6, 7, 8, 9, 10
Context:      1, 2, 3, 4, 5, 6, 7, 8, 9, 10
Project:      (none - using context)
Page:         (none)
Final:        1, 2, 3, 4, 5, 6, 7, 8, 9, 10
```

### Complex case (Roman numerals + Arabic):
```
Document:     1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12...
Context:      [1, 2, 3] i, ii, iii, iv, v, 1, 2, 3, 4, 5...
Project:      (none - using context)
Page:         (none)
Final:        [1, 2, 3] i, ii, iii, iv, v, 1, 2, 3, 4, 5...
```
Pages [1-3] are non-indexable (before pagination starts).

### With project override:
```
Document:     1, 2, 3, 4...140
Context:      [1-3] i-xxxii, 1-140
Project:      [1-3] i-xxxii, 1-130, a-m
Page:         (none)
Final:        [1-3] i-xxxii, 1-130, a-m
```
User corrected page count and changed final pages to alphabetic.

### With page-level override:
```
Document:     1, 2, 3...100, 101, 102, 103, 104, 105...140
Context:      [1-3] i-xxxii, 1-107
Project:      [1-3] i-xxxii, 1-130, a-m
Page:         (at page 101-105: i, ii, iii, iv, v)
Final:        [1-3] i-xxxii, 1-100, *i-v*, 106-130, a-m
```
Pages 101-105 have inserts with their own pagination, overridden at page level.

## UI Architecture

### Page Sidebar - Page Info Section

**Purpose:** Show page numbering for current page, allow single-page override

**Display:**
- Document page number (always)
- Context-derived page number (if context exists)
- Project override (if set)
- Page override input (editable)
- Final (computed, read-only)

**Mockup:**
```
┌─────────────────────────────────┐
│ Page Information                │
│                                 │
│ Document page: 42               │
│ Context: xiv                    │
│ Project override: (using ctx)   │
│                                 │
│ Page override:                  │
│ ┌─────────────────────────────┐ │
│ │                             │ │ ← Editable input
│ └─────────────────────────────┘ │
│ [Clear override]                │
│                                 │
│ Final: xiv                      │
└─────────────────────────────────┘
```

### Project Sidebar - Pages Section

**Purpose:** Show all page numbers, edit project-level overrides

**Display:**
- Four string representations (document, context, project, final)
- Color-coded to show source of each page number
- Editable project override string
- Validation feedback

**Mockup:**
```
┌─────────────────────────────────┐
│ Pages                           │
│                                 │
│ Document pages:                 │
│ 1-200                           │
│                                 │
│ Context-derived:                │
│ [1-3] i-xxxii, 1-140            │
│   (3 pages non-indexable)       │
│                                 │
│ Project override:               │
│ ┌─────────────────────────────┐ │
│ │ [1-3] i-xxxii, 1-130, a-m   │ │ ← Editable
│ └─────────────────────────────┘ │
│ [Parse] [Validate] [Apply]      │
│                                 │
│ Final:                          │
│ [1-3] i-xxxii, 1-100, *i-v*,    │
│ 106-130, a-m                    │
│   (3 pages non-indexable)       │
│   (5 pages with page overrides) │
└─────────────────────────────────┘
```

**Color Legend:**
- Gray: Non-indexable [bracketed]
- Blue: Context-derived
- Yellow: Project override (where different from context)
- Green: Page-level override (*asterisked*)

## String Format Specification

### Grammar
```
page_string = range_list
range_list = range ("," range)*
range = page_range | single_page | bracketed_range
page_range = page_number "-" page_number
single_page = page_number
bracketed_range = "[" range_list "]"
page_number = arabic | roman | alpha
arabic = [0-9]+
roman = [ivxlcdm]+
alpha = [a-z]+
```

### Examples
- `1-200` - Simple Arabic range
- `[1-3] i-xxxii, 1-140` - Non-indexable pages + Roman + Arabic
- `1-2, 5-6, 8, 10-12` - Custom ranges and singles
- `i, ii, iii, 1-100, a-m` - Mixed formats

## Validation Logic

### Count Validation
- Total pages in string must equal document page count
- Example: Document has 200 pages → string must describe 200 pages
- Error: "String describes 195 pages but document has 200"

### Sequence Validation
- Roman numerals: i, ii, iii, iv, v... (not i, iii, ii)
- Arabic: 1, 2, 3... (allow gaps, but warn on large gaps > 10)
- Alphabetic: a, b, c... (not a, c, b)

### Format Validation
- Brackets [] only for non-indexable pages
- Asterisks * only for page-level overrides (auto-generated, not user input)
- Commas separate ranges
- Hyphens separate range start-end

### Extraction Confidence (for context-derived)
- High: Clear text, unambiguous format
- Medium: Extractable but may need review
- Low: Unclear or failed extraction → suggest manual review

## Page Number Parsing

### Roman Numeral Parser
- i, ii, iii, iv, v, vi, vii, viii, ix, x...
- Case insensitive (I = i)
- Valid sequences only

### Arabic Parser
- 1, 2, 3, 4, 5...
- No zero-padding (not 001, 002)

### Alphabetic Parser
- a, b, c... or A, B, C...
- Single letter only (not aa, ab)

### Range Expander
- "1-5" → [1, 2, 3, 4, 5]
- "i-v" → [i, ii, iii, iv, v]
- "a-c" → [a, b, c]

## Conflict Detection & Resolution

### Constraint
Only ONE `page_number` context can apply to any page. Multiple overlapping `ignore` contexts are allowed.

### Detection Logic
```typescript
type PageNumberConflict = {
  pageNumber: number;
  contexts: { id: string; name: string; }[];
};

function detectPageNumberConflicts({ projectId }): PageNumberConflict[] {
  const pageNumberContexts = await getContexts({ 
    projectId, 
    contextType: 'page_number' 
  });
  
  const conflictsByPage = new Map<number, Context[]>();
  
  for (const context of pageNumberContexts) {
    const applicablePages = getApplicablePages(context);
    for (const page of applicablePages) {
      if (!conflictsByPage.has(page)) {
        conflictsByPage.set(page, []);
      }
      conflictsByPage.get(page)!.push(context);
    }
  }
  
  return Array.from(conflictsByPage.entries())
    .filter(([_, contexts]) => contexts.length > 1)
    .map(([page, contexts]) => ({
      pageNumber: page,
      contexts: contexts.map(c => ({ id: c.id, name: c.name })),
    }));
}
```

### Resolution UI

**Project Sidebar - Context with Conflicts:**
```
┌─────────────────────────────────┐
│ ● Top-right Page Number    ⚠️  │
│   Page Number                   │
│   All pages                     │
│                                 │
│   ⚠️ CONFLICTS:                 │
│   • Page 5 (with Bottom PN)     │
│     [Go to Page 5]              │
│   • Page 7 (with Bottom PN)     │
│     [Go to Page 7]              │
│                                 │
│   [👁][✏️][🗑️]                  │
└─────────────────────────────────┘
```

**Page Sidebar - When on Conflicting Page:**
```
┌─────────────────────────────────┐
│ ⚠️ PAGE NUMBER CONFLICT          │
│                                 │
│ Multiple page number contexts   │
│ apply to this page:             │
│                                 │
│ • Top-right Page Number         │
│   [Remove from this page]       │
│                                 │
│ • Bottom-center Page Number     │
│   [Remove from this page]       │
│                                 │
│ Choose one to keep.             │
│ Canonical page number cannot    │
│ be computed until resolved.     │
└─────────────────────────────────┘
```

### Page Exclusion ("Remove from Page")

When user clicks "Remove from this page":

1. **Add page to `exceptPages` array:**
   ```typescript
   await updateContext({
     id: contextId,
     exceptPages: [...context.exceptPages || [], currentPage],
   });
   ```

2. **Update page config summary:**
   - "All pages" → "All pages except 5,7"
   - "Every other starting on 1" → "Every other starting on 1; except 3,5"
   - "Custom: 1-10,20-30" → "Custom: 1-10,20-30 except 5,25"

3. **Applies to both ignore and page_number contexts**

## Implementation Strategy

### 0. Phase 6 Extensions (1 day)
- Add `except_pages` field to contexts schema
- Update `appliesToPage()` logic to check exceptions
- Implement conflict detection backend logic
- Add "Remove from page" button functionality
- Update page config summary to show exceptions

### 1. Page Number Extraction (1 day)
- OCR/text extraction from page number context bboxes
- Parsing logic (Roman, Arabic, alphabetic)
- Confidence scoring
- Store extracted values in `contexts.extracted_page_number`
- Compute context-derived page numbers (only when no conflicts)

### 2. String Parsing & Validation (1 day)
- Parser for page number strings
- Validation logic (count, sequence, format)
- Range expander
- Error messages
- Support for [bracketed] non-indexable pages

### 3. Page Info UI (1 day)
- Page sidebar section
- Display all layers (document, context, project, page, final)
- Show conflict warning when page_number contexts overlap
- "Remove from page" buttons in conflict resolution
- Editable page-level override
- Clear override button

### 4. Project Pages UI (1 day)
- Project sidebar section
- Display all string representations
- Show conflicts inline below each context
- "Go to Page X" buttons for quick navigation
- Editable project override string
- Validation feedback
- Color-coded display

## Backend Schema

**Note:** Canonical page numbers are COMPUTED, not stored. Mentions reference document page numbers directly.

```typescript
type Context {
  // ... existing fields from Phase 6 ...
  extracted_page_number?: string; // OCR-extracted value (from Phase 6)
  except_pages?: number[]; // Pages to exclude from this context (NEW)
}

type Project {
  page_number_override_string?: string; // Full override string (optional)
  page_number_validation_errors?: string[]; // From last validation (optional)
}

// NO STORED FIELDS - All computed on-the-fly:
// - context_page_number (from contexts with contextType='page_number')
// - canonical_page_number (computed from layers)
// - is_indexable (computed from canonical page number [bracket] status)
// - has_conflicts (computed from overlapping page_number contexts)

// Mentions store document_page_number only:
type IndexMention {
  document_page_number: int; // Source of truth for location
  // canonical_page_number displayed in UI is computed at query time
}
```

**Rationale for Computed Approach:**
- **Flexibility:** Page number rules can change without migrating mention data
- **Conflict awareness:** Can't compute canonical if conflicts exist (forces resolution)
- **Single source of truth:** Document page number is authoritative
- **Performance:** Canonical page numbers cached in memory/query layer if needed
- **Optional snapshotting:** "Save current state" feature can persist if performance requires it later

## Testing Requirements

### Phase 6 Extensions
- [ ] `except_pages` field persists in database
- [ ] "Remove from page" adds page to `except_pages`
- [ ] `appliesToPage()` correctly excludes pages in `except_pages`
- [ ] Page config summary displays exceptions (e.g., "All pages except 5,7")
- [ ] Conflict detection identifies overlapping page_number contexts
- [ ] Conflict detection allows overlapping ignore contexts (no error)
- [ ] Conflicts display in Project Sidebar below affected context
- [ ] "Go to Page X" button navigates to conflicting page
- [ ] Page Sidebar shows conflict warning when on conflicting page
- [ ] Removing page from context resolves conflict

### Page Number Extraction
- [ ] Context extraction works for Arabic numbers
- [ ] Context extraction works for Roman numerals
- [ ] Context extraction works for alphabetic
- [ ] Extraction confidence scoring works (high/medium/low)
- [ ] Multiple contexts on same page detected as conflict
- [ ] Context-derived page numbers only computed when conflict-free

### Page Number Layers
- [ ] Page-level override persists correctly
- [ ] Project-level override validates count
- [ ] Project-level override validates sequence
- [ ] Non-indexable pages [bracketed] parsed correctly
- [ ] Final page number computed from correct layer (page > project > context > document)
- [ ] Final page number NOT computed when conflicts exist
- [ ] Color-coding displays correctly for each layer

### Index Mentions
- [ ] Mentions store document_page_number only (not canonical)
- [ ] Canonical page number computed at query time for display
- [ ] Mentions display with correct canonical page number
- [ ] Changing page number rules updates mention display (since computed)

## Success Criteria

### Phase 6 Extensions
- [ ] `except_pages` field added to schema
- [ ] "Remove from page" functionality works for both ignore and page_number contexts
- [ ] Page exclusions display in page config summary
- [ ] Conflict detection identifies overlapping page_number contexts
- [ ] Conflicts display with navigation buttons in Project Sidebar
- [ ] Conflict warning shows in Page Sidebar when on conflicting page
- [ ] User can resolve conflicts by removing pages or editing contexts

### Page Numbering
- [ ] Context-derived page numbers extracted and displayed
- [ ] Canonical page numbers are COMPUTED, not stored
- [ ] Project-level override editable and validated
- [ ] Page-level override editable
- [ ] All layers displayed with color-coding
- [ ] Final page number computed correctly (when no conflicts)
- [ ] Final page number NOT computed when conflicts exist
- [ ] Non-indexable pages [bracketed] handled
- [ ] Validation errors shown with helpful messages

### Index Mentions
- [ ] Mentions store document_page_number (not canonical)
- [ ] Canonical page numbers computed at display time
- [ ] Changing page number rules updates mention display immediately

## Next Steps

After Phase 7, Epic 1 is complete. Next:
- **Epic 2:** Concept Detection (respect ignore contexts, generate entries per index type)
- **Epic 3:** Index Editor (tabs per index type)
- **Epic 4:** Export (separate HTML views per index type)
