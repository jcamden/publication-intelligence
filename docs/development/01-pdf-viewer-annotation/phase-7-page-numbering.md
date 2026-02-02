# Phase 7: Page Numbering System

**Status:** ⚪ Not Started  
**Dependencies:** Phase 6 completion (Context System)  
**Duration:** 3-4 days

## Overview

Implement multi-layer page numbering system with automatic extraction from contexts, project-level overrides, and page-level overrides. Display all layers with color-coding for transparency and debugging.

## Page Numbering Layers

### 1. Document Page Number (always present)
- Sequential: 1, 2, 3... (PDF page order)
- Never changes
- Always visible
- Source of truth for internal operations

### 2. Context-Derived Page Number (from page number contexts)
- Extracted from page number context bboxes
- Automatic (AI/OCR extraction)
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
- Computed from layers above (precedence: page > project > context > document)
- Used for indexing mentions
- Displayed in index export

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

## Implementation Strategy

### 1. Page Number Extraction (1 day)
- OCR/text extraction from page number context bboxes
- Parsing logic (Roman, Arabic, alphabetic)
- Confidence scoring
- Store in `DocumentPage.context_page_number`

### 2. String Parsing & Validation (1 day)
- Parser for page number strings
- Validation logic (count, sequence, format)
- Range expander
- Error messages

### 3. Page Info UI (1 day)
- Page sidebar section
- Display all layers
- Editable page-level override
- Clear override button

### 4. Project Pages UI (1 day)
- Project sidebar section
- Display all string representations
- Editable project override string
- Validation feedback
- Color-coded display

## Backend Schema

```typescript
type DocumentPage {
  document_page_number: int; // Always present
  context_page_number?: string; // From page number context
  context_extraction_confidence?: 'high' | 'medium' | 'low';
  project_override_page_number?: string; // Project-level override
  page_override_page_number?: string; // Single-page override
  canonical_page_number?: string; // Computed
  is_indexable: boolean; // False if [bracketed]
}

type Project {
  page_number_override_string?: string; // Full override string
  page_number_validation_errors?: string[]; // From last validation
}
```

## Testing Requirements

- [ ] Context extraction works for Arabic numbers
- [ ] Context extraction works for Roman numerals
- [ ] Context extraction works for alphabetic
- [ ] Page-level override persists correctly
- [ ] Project-level override validates count
- [ ] Project-level override validates sequence
- [ ] Non-indexable pages [bracketed] parsed correctly
- [ ] Final page number computed from correct layer
- [ ] Color-coding displays correctly
- [ ] Mentions indexed under canonical page numbers

## Success Criteria

- ✅ Context-derived page numbers extracted and displayed
- ✅ Project-level override editable and validated
- ✅ Page-level override editable
- ✅ All layers displayed with color-coding
- ✅ Final page number computed correctly
- ✅ Non-indexable pages handled
- ✅ Validation errors shown with helpful messages
- ✅ Mentions use canonical page numbers for indexing

## Next Steps

After Phase 7, Epic 1 is complete. Next:
- **Epic 2:** Concept Detection (respect ignore contexts, generate entries per index type)
- **Epic 3:** Index Editor (tabs per index type)
- **Epic 4:** Export (separate HTML views per index type)
