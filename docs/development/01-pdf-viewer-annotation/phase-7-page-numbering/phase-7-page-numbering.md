# Phase 7: Canonical Page Numbering System

**Status:** ⚪ Not Started  
**Dependencies:** Phase 6 completion (Region System) ✅ (including all extended features)  
**Duration:** 4-5 days

## Overview

Implement a rules-based canonical page numbering system with:
- **Region-derived page numbers** - Automatic extraction from page number regions
- **User-defined rules** - Manual positive rules (define page numbers) and negative rules (ignore pages)
- **Visual feedback** - Color-coded display showing which pages are indexed and why
- **Rule conflict resolution** - Smart handling of overlapping rules with user confirmation
- **Page-level rule creation** - Quick rule creation from individual pages

**Phase 6 Completion Status (February 10, 2026):**
- ✅ User-named contexts (e.g., "Top-right page number", "Bottom-center page number")
- ✅ `page_number` region type with region drawing
- ✅ **Page exclusion** (`exceptPages` field) - enables "Remove from page" functionality
- ✅ **Conflict detection** (client-side via `useMemo`) - ensures only ONE page_number region per page
- ✅ **Conflict resolution UI** - displays conflicts inline with clickable page numbers
- ✅ "Every other page" with optional `endPage` parameter
- ✅ "Except pages" input in Create/Edit Context modal

**Phase 7 Focus:**
- Page number extraction from context bboxes (text layer)
- User-defined canonical page rules (positive and negative)
- Rule conflict detection and resolution
- Auto-joining of contiguous rules
- Color-coded canonical pages visualization
- Page-level and project-level rule creation UI

**Key Principles:**
- **User rules override contexts** - User-defined rules take precedence over region-derived page numbers
- **One rule per document page** - Same document page cannot exist in multiple user-defined rules
- **Auto-merge contiguous rules** - Rules that are contiguous in both document pages AND canonical pages are automatically joined
- **Computed, not stored** - Canonical page numbers are always computed on-demand

## Canonical Page Number Sources

### 1. Document Page Number (baseline)
- Sequential: 1, 2, 3... (PDF page order)
- Never changes
- Always visible
- Source of truth for internal operations
- **Display:** Red background = unaccounted/unindexed (error state)

### 2. Context-Derived Page Numbers
- Extracted from page number context bboxes (contexts with `regionType: 'page_number'`)
- Each context has a user-provided name (e.g., "Top-right page number")
- Automatic extraction from PDF text layer (OCR deferred for MVP)
- Extracted values computed on-demand, not stored persistently
- Can include: numbers, Roman numerals, alphabetic
- **Display:** Blue = region-derived page numbers
- **Overridden by:** User-defined rules (positive or negative)

### 3. User-Defined Rules (two types)

#### Positive Rules (define canonical page numbers)
- User manually defines canonical page numbers for document page ranges
- Two modes for generating canonical pages:
  
  **Auto-Generate Sequence:**
  - Document page range (e.g., "501-600")
  - Numeral type (Arabic, Roman, or Arbitrary)
  - Starting canonical page (e.g., "i", "1", "a")
  - System auto-generates sequential canonical pages based on numeral type
  
  **Arbitrary Sequence (for non-standard numbering):**
  - Document page range (e.g., "10-13")
  - Manually enter comma-separated canonical pages (e.g., "10, 10a, 10b, 11")
  - Use for: inserted pages (10a, 10b), compound notation (A-1, A-2), section numbers (1.1, 1.2)
  - Must provide exact count matching document page range

- Optional label field (e.g., "Appendix", "Index Section")
- **Display:** Green = user-defined positive rule
- **Takes precedence over:** Region-derived page numbers

#### Negative Rules (ignore pages)
- User marks document pages to be ignored (not indexed)
- Document page range (e.g., "1-10")
- Optional label field (e.g., "Cover pages", "Blank pages")
- Commonly used for: cover pages, blank pages, non-content pages
- **Display:** Gray with strikethrough = ignored
- **Takes precedence over:** Region-derived page numbers

### Final (Canonical) Page Number
- **Always computed/derived**, never stored as persistent data
- **Precedence:** User-defined rules (positive/negative) > Region-derived > Document page number
- Only computed when NO page_number region conflicts exist
- Used for indexing mentions (stored as reference to document page number)
- Displayed in index export

### Visual Indicators (Color Legend)
- **🔴 Red:** Unaccounted document pages (no context, no rule) - ERROR state
- **🔵 Blue:** Region-derived page numbers
- **🟢 Green:** User-defined positive rules (manual canonical pages)
- **⚪ Gray with strikethrough:** Ignored pages (user-defined negative rules)

## Product Walkthrough: Building Canonical Page Numbers

### Example: 600-page document

#### Step 1: Initial State (No contexts or rules)

**Canonical Pages Display:**
```
1-600 🔴 (red - unaccounted/error)
```

**Explanation:** All 600 document pages are unaccounted for. Red indicates these pages have no canonical page numbers defined (error state).

---

#### Step 2: Add Context-Derived Page Numbers

**User creates two page_number regions:**
1. Context A: Detects page numbers on every other page starting at page 20, ending at page 500 (pages 20, 22, 24... 500)
2. Context B: Detects page numbers on every other page starting at page 21, ending at page 499 (pages 21, 23, 25... 499)

**Combined extraction results:** The two contexts together extract page numbers covering pages 20-500, with extracted values: `i-x` (pages 20-29) and `1-480` (pages 30-500)

**Canonical Pages Display:**
```
1-19 🔴 (red)
i-x 🔵 (blue - region-derived)
1-480 🔵 (blue - region-derived)
501-600 🔴 (red)
```

**Explanation:** 
- Pages 1-19: Still unaccounted (no context covers them)
- Pages 20-29: Region-derived Roman numerals i-x
- Pages 30-500: Region-derived Arabic 1-480  
- Pages 501-600: Still unaccounted (no context covers them)

---

#### Step 3: Add User-Defined Positive Rule (501-600)

**User creates a positive rule:**
- Document pages: 501-600
- Numeral type: Roman
- Starting with: i

**System auto-generates:** i, ii, iii... xcix, c (100 pages)

**Canonical Pages Display:**
```
1-19 🔴 (red)
i-x 🔵 (blue)
1-480 🔵 (blue)
i-c 🟢 (green - user-defined positive rule)
```

**Explanation:** Pages 501-600 now have user-defined canonical page numbers (i-c), shown in green. User rules take precedence over region-derived.

---

#### Step 4: Add User-Defined Negative Rule (Ignore 1-19)

**User creates a negative rule:**
- Document pages: 1-19
- Action: Ignore (don't index)

**Canonical Pages Display:**
```
1-19 ⚪ (gray with strikethrough - ignored)
i-x 🔵 (blue)
1-480 🔵 (blue)
i-c 🟢 (green)
```

**Explanation:** Pages 1-19 are now marked as ignored (not indexed). All 600 pages are now accounted for.

## Rule Conflict Resolution

### Constraint: One Document Page, One Rule

**Principle:** The same document page cannot exist in two user-defined rules (positive or negative).

### Conflict Detection

When creating or editing a rule, the system checks if any document pages in the new/edited rule overlap with existing rules.

**Example conflicts:**
- Creating positive rule "101-200" when positive rule "150-300" exists → overlap on pages 150-200
- Creating negative rule "1-50" when negative rule "40-60" exists → overlap on pages 40-50
- Creating positive rule "200-250" when negative rule "220-240" exists → overlap on pages 220-240

### Conflict Warning Dialog

When a conflict is detected, show a confirmation dialog:

```
⚠️ Rule Conflict Detected

Document page(s) 150-200 are already part of an existing rule:
• "Positive Rule: Define 150-300 as 1-151"

These pages will be removed from the existing rule if you proceed.

This will result in:
• Splitting "Positive Rule: Define 150-300 as 1-151" into:
  - "Positive Rule: Define 150-199 as 1-50"
  - "Positive Rule: Define 201-300 as 52-151"

Are you sure you want to proceed?

[Cancel] [Proceed]
```

### Rule Splitting

When pages are removed from the **middle** of a rule, the system automatically splits it into two rules:

**Example:**
- **Before:** Positive rule covering doc pages 100-300 → canonical pages 1-201
- **User creates:** New rule for doc pages 150-200
- **After:**
  - Rule 1: Doc pages 100-149 → Canonical pages 1-50
  - Rule 2: Doc pages 201-300 → Canonical pages 51-151

**When pages are removed from the start or end**, the rule is simply shortened (not split).

### Auto-Joining Contiguous Rules

**Principle:** Rules that are contiguous in BOTH document pages AND canonical pages are automatically merged into a single rule.

**Note:** This applies to ALL contiguous rules, including single-page rules. For example, if you create rules for pages 10→10, 11→11, 12→12 using the "Index as canonical page" feature, they will automatically merge into a single rule: Doc pages 10-12 → Canonical pages 10-12.

**Example 1 - Rules get auto-joined:**
- Rule A: Doc pages 100-149 → Canonical pages 1-50
- Rule B: Doc pages 150-199 → Canonical pages 51-100
- **Result:** Auto-joined into single rule: Doc pages 100-199 → Canonical pages 1-100

**Example 2 - Rules stay separate (canonical pages not contiguous):**
- Rule A: Doc pages 100-149 → Canonical pages 1-50
- Rule B: Doc pages 150-199 → Canonical pages i-l (Roman numerals)
- **Result:** Stays as two separate rules (different numeral types)

**Example 3 - Rules stay separate (document pages not contiguous):**
- Rule A: Doc pages 100-149 → Canonical pages 1-50
- Rule B: Doc pages 200-249 → Canonical pages 51-100
- **Result:** Stays as two separate rules (gap in document pages: 150-199)

### Auto-Join Warning

Before confirming rule creation/update, warn the user if auto-joining will occur:

```
ℹ️ Rules Will Be Merged

Your new rule will be automatically merged with the existing rule:
• "Positive Rule: Define 100-149 as 1-50"

Resulting in:
• "Positive Rule: Define 100-199 as 1-100"

Are you sure you want to proceed?

[Cancel] [Proceed]
```

### User Rules vs Context-Derived

**Important:** User-defined rules DO NOT conflict with region-derived page numbers. User rules always take precedence and override region-derived page numbers.

**Example:**
- Region-derived: Pages 50-100 → i-li
- User creates positive rule: Pages 60-80 → 1-21
- **Result:**
  - Pages 50-59: i-x (blue - region-derived)
  - Pages 60-80: 1-21 (green - user-defined, overrides context)
  - Pages 81-100: xxxi-li (blue - region-derived)

## UI Architecture

### Page Sidebar - Page Numbering Section

**Purpose:** Show canonical page number for current page, allow quick rule creation

**Display:**
- Document page number (always)
- Region-derived page number (if exists, with region name)
- User-defined rule (if exists, with rule description)
- Quick rule creation input
- Final canonical page number (computed, read-only)

**Mockup Example 1 - Page with only region-derived page number:**
```
┌─────────────────────────────────┐
│ Page Numbering                  │
│                                 │
│ Document page: 42               │
│                                 │
│ Region-derived: xiv 🔵         │
│   from "Top-right Page Number"  │
│                                 │
│ Index as canonical page:        │
│ ┌─────────────────────────────┐ │
│ │ 23                          │ │ ← Creates project rule
│ └─────────────────────────────┘ │
│ [Create Rule]                   │
│                                 │
│ Canonical: xiv 🔵               │
└─────────────────────────────────┘
```

**Mockup Example 2 - Page with user-defined rule overriding context:**
```
┌─────────────────────────────────┐
│ Page Numbering                  │
│                                 │
│ Document page: 42               │
│                                 │
│ Region-derived: xiv 🔵         │
│   from "Top-right Page Number"  │
│   (strikethrough style)         │
│                                 │
│ User-defined: 23 🟢             │
│   from "Rule: Define 40-60      │
│   as 21-41"                     │
│   [Edit Rule] [Delete Rule]     │
│                                 │
│ Canonical: 23 🟢                │
└─────────────────────────────────┘
```

**Mockup Example 3 - Ignored page:**
```
┌─────────────────────────────────┐
│ Page Numbering                  │
│                                 │
│ Document page: 3                │
│                                 │
│ User-defined: Ignored ⚪         │
│   from "Rule: Ignore 1-20"      │
│   [Edit Rule] [Delete Rule]     │
│                                 │
│ Canonical: (not indexed)        │
└─────────────────────────────────┘
```

**"Index as canonical page" Input:**
- Creates a **project-level positive rule** for this single document page
- User enters canonical page number (e.g., "23", "v", "c")
- System detects numeral type automatically
- Same conflict resolution rules apply (may split/join existing rules)

### Project Sidebar - Canonical Pages Section

**Purpose:** Show canonical page number visualization, create/manage user-defined rules

**Display:**
- Color-coded canonical pages string (visual overview)
- Statistics (unaccounted pages, ignored pages, etc.)
- "Create Rule" button
- List of existing user-defined rules with edit/delete actions

**Mockup:**
```
┌─────────────────────────────────┐
│ Canonical Pages                 │
│                                 │
│ 1-19 🔴  i-x 🔵  1-480 🔵       │
│ i-c 🟢                          │
│                                 │
│ Statistics:                     │
│ • Total pages: 600              │
│ • Unaccounted: 0 pages          │
│ • Region-derived: 490 pages    │
│ • User-defined: 110 pages       │
│   - Indexed: 100 pages          │
│   - Ignored: 10 pages           │
│                                 │
│ [+ Create Rule]                 │
│                                 │
│ ──────────────────────────────  │
│                                 │
│ User-Defined Rules:             │
│                                 │
│ ✅ Define 501-600 as i-c        │
│    [Edit] [Delete]              │
│                                 │
│ 🚫 Ignore 1-19                  │
│    [Edit] [Delete]              │
│                                 │
└─────────────────────────────────┘
```

**Color Legend:**
- 🔴 **Red:** Unaccounted pages (error - need context or rule)
- 🔵 **Blue:** Region-derived page numbers
- 🟢 **Green:** User-defined positive rules
- ⚪ **Gray with strikethrough:** Ignored pages (negative rules)

**"Create Rule" Form:**

Opens a modal/dialog with:

```
┌─────────────────────────────────────┐
│ Create Canonical Page Rule          │
│                                     │
│ Rule Type:                          │
│ ○ Positive (Define page numbers)    │
│ ○ Negative (Ignore pages)           │
│                                     │
│ Document Pages:                     │
│ Start: ┌──────┐  End: ┌──────┐     │
│        │ 501  │       │ 600  │     │
│        └──────┘       └──────┘     │
│                                     │
│ Label (optional):                   │
│ ┌─────────────────────────────────┐ │
│ │ Appendix                        │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ─── Positive Rule Options ───       │
│                                     │
│ Sequence Mode:                      │
│ ● Auto-generate sequence            │
│ ○ Enter arbitrary sequence          │
│                                     │
│ Numeral Type:                       │
│ ○ Arabic (1, 2, 3...)               │
│ ● Roman (i, ii, iii...)             │
│                                     │
│ Starting Canonical Page:            │
│ ┌─────────────────────────────────┐ │
│ │ i                               │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Preview:                            │
│ Doc pages 501-600 → i, ii, iii...c  │
│                                     │
│ [Cancel]               [Create]     │
└─────────────────────────────────────┘
```

**When "Enter arbitrary sequence" is selected:**

```
│ Sequence Mode:                      │
│ ○ Auto-generate sequence            │
│ ● Enter arbitrary sequence          │
│                                     │
│ Canonical Pages (comma-separated):  │
│ ┌─────────────────────────────────┐ │
│ │ 10, 10a, 10b, 11                │ │
│ └─────────────────────────────────┘ │
│ Must provide exactly 4 values       │
│ (matching doc page range 501-504)   │
│                                     │
│ Preview:                            │
│ Doc pages 501-504 → 10, 10a, 10b,   │
│ 11                                  │
```

**Rule List Display:**
- Positive rules: ✅ icon, show label if provided (e.g., "Appendix (Define 501-600 as i-c)"), otherwise "Define [doc pages] as [canonical pages]"
- Negative rules: 🚫 icon, show label if provided (e.g., "Cover pages (Ignore 1-10)"), otherwise "Ignore [doc pages]"
- Each rule has Edit and Delete actions
- Rules sorted by document page start

## Canonical Page Display Format

### Visual String Representation

The canonical pages string provides a compressed visual overview showing which pages are indexed and how:

**Format:**
- Document page ranges displayed with their canonical page numbers
- Color-coded to show source (red/blue/green/gray)
- Compact representation using ranges where possible

**Examples:**

1. **Initial state (no contexts):**
   ```
   1-600 🔴
   ```

2. **With region-derived pages:**
   ```
   1-19 🔴  i-x 🔵  1-480 🔵  501-600 🔴
   ```

3. **With user-defined rules:**
   ```
   1-19 ⚪ (strikethrough)  i-x 🔵  1-480 🔵  i-c 🟢
   ```

### Display Rules

**Contiguous Ranges:**
- If document pages AND canonical pages are sequential, show as range
- Example: Doc pages 20-29 with canonical i-x → display as "i-x"

**Non-Contiguous:**
- If canonical pages have gaps, show separately
- Example: Doc pages 1-5 canonical [1, 3, 5, 7, 9] → display as "1, 3, 5, 7, 9"

**Mixed Sources:**
- Each source gets its own segment in the display
- Example: Pages 1-10 ignored, 11-20 region-derived, 21-30 user-defined:
  ```
  1-10 ⚪  11-20 🔵  21-30 🟢
  ```

### Rule Validation

When creating/editing user-defined rules:

#### Document Page Range Validation
- Start must be ≤ End
- Start must be ≥ 1
- End must be ≤ total document pages
- Range must not overlap with other user-defined rules (or user confirms split/merge)

#### Canonical Page Validation (Positive Rules)

**Auto-Generated Sequence:**
- Starting canonical page must match selected numeral type
- Arabic: Must be positive integer
- Roman: Must be valid Roman numeral (i, ii, v, x, l, c, d, m)
- System generates canonical page sequence based on:
  - Number of document pages in range
  - Numeral type selected
  - Starting canonical page
- Example: Doc pages 501-600 (100 pages), Roman, start "i" → generates i, ii, iii... xcix, c

**Arbitrary Sequence:**
- User provides comma-separated list of canonical pages
- Count must exactly match document page range size
- Accepts any string values (e.g., "10a", "A-1", "II-5", "1.1")
- No validation on format (user has full control)
- Example: Doc pages 10-13 (4 pages) → user enters "10, 10a, 10b, 11"


## Page Number Utilities

### Numeral Type Detection

Given a canonical page string, detect its type (used for "Index as canonical page" quick rule creation):

```typescript
function detectNumeralType(page: string): 'arabic' | 'roman' | 'arbitrary' {
  if (/^\d+$/.test(page)) return 'arabic';
  if (/^[ivxlcdm]+$/i.test(page)) return 'roman';
  return 'arbitrary'; // Everything else is treated as arbitrary
}
```

**Note:** If user enters anything other than pure arabic or roman numerals in the "Index as canonical page" input, it will be treated as an arbitrary sequence (single-page rule with arbitrary type).

### Sequence Generators

#### Roman Numeral Generator
```typescript
function generateRomanNumerals({ start, count }: { start: string; count: number }): string[] {
  // Convert start to number, generate count Roman numerals
  // i, ii, iii, iv, v, vi, vii, viii, ix, x, xi...
  // Case insensitive input, lowercase output
}
```

**Examples:**
- `generateRomanNumerals({ start: 'i', count: 5 })` → `['i', 'ii', 'iii', 'iv', 'v']`
- `generateRomanNumerals({ start: 'v', count: 3 })` → `['v', 'vi', 'vii']`

#### Arabic Generator
```typescript
function generateArabicNumerals({ start, count }: { start: number; count: number }): string[] {
  // Generate count Arabic numerals starting from start
}
```

**Examples:**
- `generateArabicNumerals({ start: 1, count: 5 })` → `['1', '2', '3', '4', '5']`
- `generateArabicNumerals({ start: 100, count: 3 })` → `['100', '101', '102']`

#### Arbitrary Sequence Parser
```typescript
function parseArbitrarySequence(input: string): string[] {
  // Split by comma, trim whitespace from each value
  // Return array of canonical page strings
}
```

**Examples:**
- `parseArbitrarySequence('10, 10a, 10b, 11')` → `['10', '10a', '10b', '11']`
- `parseArbitrarySequence('A-1, A-2, A-3')` → `['A-1', 'A-2', 'A-3']`

### Context Extraction Utilities

#### Extract Page Number from Bbox
```typescript
function extractPageNumberFromBbox({
  page,
  bbox,
  documentId
}: {
  page: number;
  bbox: BoundingBox;
  documentId: string;
}): string | null {
  // Extract text from PDF text layer at bbox location
  // Parse and validate as page number
  // Return extracted value or null if extraction fails
}
```

#### Detect Sequence Continuity
```typescript
function detectSequenceContinuity(values: string[]): boolean {
  // Check if extracted values form a continuous sequence
  // i, ii, iii → true
  // 1, 2, 3 → true
  // i, iii, v → false (gaps)
  // 1, 5, 10 → false (gaps)
}
```

## Context Conflicts (Phase 6 - Already Implemented)

### Page Number Region Conflicts

**Constraint:** Only ONE `page_number` region can apply to any page. Multiple overlapping `exclude` regions are allowed.

**Detection Logic:** Client-side using `@pubint/core/region.utils.ts` utility (✅ completed in Phase 6)

```typescript
type PageNumberConflict = {
  pageNumber: number;
  regions: Region[];
};

function detectPageNumberConflicts({ 
  contexts, 
  maxPage 
}: {
  regions: Region[];
  maxPage: number;
}): PageNumberConflict[] {
  const pageNumberRegions = contexts.filter(
    ctx => ctx.regionType === 'page_number'
  );
  
  const conflicts: PageNumberConflict[] = [];
  
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

**Resolution UI (✅ Implemented in Phase 6):**

Project Sidebar shows conflicts inline:
```
┌─────────────────────────────────┐
│ ● Top-right Page Number         │
│   Page Number                   │
│   All pages                     │
│   Conflicts: 5, 7, 9, 11...     │ ← Red, clickable
│   [👁][✏️][🗑️]                  │
└─────────────────────────────────┘
```

Page Sidebar shows conflict warning:
```
┌─────────────────────────────────┐
│ ⚠️ PAGE NUMBER CONFLICT          │
│                                 │
│ Multiple page number regions:  │
│ • Top-right Page Number         │
│ • Bottom-center Page Number     │
│                                 │
│ Only one page_number region    │
│ can apply per page. Please      │
│ resolve to enable indexing.     │
└─────────────────────────────────┘
```

### Page Exclusion ("Remove from Page") (✅ Implemented in Phase 6)

Users can click "Remove from this page" to add page to region's `exceptPages` array. This works for both `ignore` and `page_number` regions.

**Note:** Page number region conflicts MUST be resolved before canonical page numbers can be computed. User-defined rules are disabled until conflicts are resolved.

## Implementation Strategy

**Note:** Phase 6 extensions (page exclusion, region conflict detection, conflict resolution UI) are complete. Phase 7 focuses on page number extraction, user-defined rules, and canonical page visualization.

### 1. Page Number Extraction from Contexts (1 day)
- Text extraction from page number context bboxes (PDF text layer only, OCR deferred)
- Numeral type detection (Roman, Arabic, arbitrary)
- Sequence validation
- Compute region-derived page numbers on-demand (not persisted)
- Only compute when no region conflicts exist (Phase 6 constraint)

**Deliverables:**
- `extractPageNumberFromBbox()` utility
- `detectNumeralType()` utility
- `detectSequenceContinuity()` utility
- Region-derived page numbers appear in Project Sidebar canonical pages display (blue)

### 2. User-Defined Rules System (1.5 days)

#### Backend Schema
```typescript
type CanonicalPageRule = {
  id: string;
  projectId: string;
  ruleType: 'positive' | 'negative';
  documentPageStart: number;
  documentPageEnd: number;
  label?: string; // Optional user-provided label (e.g., "Appendix", "Index Section")
  
  // For positive rules only:
  numeralType?: 'arabic' | 'roman' | 'arbitrary';
  startingCanonicalPage?: string; // e.g., "1", "i" (for arabic/roman)
  arbitrarySequence?: string[]; // For 'arbitrary' type: ["10", "10a", "10b", "11"]
  
  createdAt: timestamp;
  updatedAt: timestamp;
};
```

#### API Endpoints
- `POST /api/projects/:projectId/canonical-page-rules` - Create rule
- `GET /api/projects/:projectId/canonical-page-rules` - List rules
- `PATCH /api/projects/:projectId/canonical-page-rules/:ruleId` - Update rule
- `DELETE /api/projects/:projectId/canonical-page-rules/:ruleId` - Delete rule

#### Utilities
- `generateCanonicalPageSequence()` - Generate sequence based on rule
- `detectRuleConflicts()` - Check for overlapping document pages in rules
- `splitRule()` - Split rule when pages removed from middle
- `mergeContiguousRules()` - Auto-join rules that are contiguous

**Deliverables:**
- Database migration for `canonical_page_rules` table
- Backend CRUD endpoints
- Conflict detection logic
- Rule splitting/merging logic

### 3. Canonical Pages Visualization (1 day)

#### Project Sidebar - Canonical Pages Section
- Color-coded canonical pages string display
- Statistics (unaccounted, region-derived, user-defined, ignored)
- List of user-defined rules with edit/delete actions
- "Create Rule" button opening modal

#### Create/Edit Rule Modal
- Rule type selection (positive/negative)
- Document page range inputs
- Numeral type selection (for positive rules)
- Starting canonical page input (for positive rules)
- Preview of generated sequence
- Conflict warnings with split/merge notifications
- Cancel/Save actions

**Deliverables:**
- `CanonicalPagesSection` component in Project Sidebar
- `CreateRuleModal` component
- `EditRuleModal` component
- Color-coded display with proper styling
- Conflict detection integration

### 4. Page-Level Rule Creation (1 day)

#### Page Sidebar - Page Numbering Section
- Display document page number
- Display region-derived page number (if exists) with region name
- Display user-defined rule (if exists) with rule description
- Show when user rule overrides context (strikethrough context)
- "Index as canonical page" input for quick rule creation
- Edit/Delete rule buttons (for existing rules)
- Final canonical page number (computed, read-only)

#### Quick Rule Creation
- Input field accepts canonical page number
- Auto-detects numeral type
- Creates project-level rule for single document page
- Handles conflicts (may split/join existing rules)
- Shows confirmation dialog if conflicts detected

**Deliverables:**
- `PageNumberingSection` component in Page Sidebar
- Quick rule creation form
- Integration with rule conflict resolution
- Strikethrough styling for overridden region-derived pages

### 5. Canonical Page Computation (0.5 days)

#### Computation Logic
```typescript
function computeCanonicalPages({
  documentPageCount,
  contexts,
  rules
}: {
  documentPageCount: number;
  regions: Region[];
  rules: CanonicalPageRule[];
}): Map<number, {
  canonicalPage: string | null;
  source: 'unaccounted' | 'context' | 'rule-positive' | 'rule-negative';
  sourceId?: string;
  color: 'red' | 'blue' | 'green' | 'gray';
}> {
  // 1. Check for region conflicts - if any exist, return empty map
  // 2. Extract region-derived page numbers
  // 3. Apply user-defined rules (override region-derived)
  // 4. Mark unaccounted pages as red
  // 5. Return map of document page → canonical page with metadata
}
```

**Priority:**
1. Check region conflicts first (Phase 6 constraint)
2. User-defined rules (highest priority)
3. Region-derived page numbers
4. Unaccounted (document page number, red)

**Caching Strategy:**
- Compute canonical pages once when project loads
- Cache results in memory (React state/context)
- Invalidate and recompute when:
  - Rules created/updated/deleted
  - Contexts created/updated/deleted
  - User navigates to different project (clear cache)
- No persistent caching needed for MVP (acceptable performance for typical document sizes)

**Deliverables:**
- `computeCanonicalPages()` utility
- Integration with Project Sidebar and Page Sidebar
- Cache invalidation logic
- Real-time updates when rules or regions change

## Backend Schema

**Note:** Canonical page numbers are COMPUTED, not stored. Mentions reference document page numbers directly.

### Existing Tables (Phase 6)

```typescript
type Context {
  id: string;
  projectId: string;
  regionType: 'page_number' | 'exclude';
  name: string; // e.g., "Top-right Page Number"
  pageConfig: PageConfig;
  exceptPages?: number[]; // Pages to exclude (✅ Phase 6)
  endPage?: number; // Optional ending page for "every other" (✅ Phase 6)
  // ... other fields
  // NO extracted_page_number field - extraction is computed on-demand
}
```

### New Table (Phase 7)

```typescript
type CanonicalPageRule {
  id: string; // UUID
  projectId: string; // Foreign key to projects
  ruleType: 'positive' | 'negative'; // positive = define pages, negative = ignore
  documentPageStart: number; // Starting document page (1-indexed)
  documentPageEnd: number; // Ending document page (inclusive)
  label: string | null; // Optional user label (e.g., "Appendix", "Cover pages")
  
  // For positive rules only (null for negative rules):
  numeralType: 'arabic' | 'roman' | 'arbitrary' | null;
  startingCanonicalPage: string | null; // For arabic/roman: e.g., "1", "i"
  arbitrarySequence: string[] | null; // For arbitrary: ["10", "10a", "10b", "11"]
  
  createdAt: timestamp;
  updatedAt: timestamp;
  deletedAt: timestamp | null; // Soft delete
}
```

**Indexes:**
- `projectId` (for efficient querying by project)
- `documentPageStart, documentPageEnd` (for efficient range queries and conflict detection)

**Constraints:**
- `documentPageStart` ≤ `documentPageEnd`
- For positive rules with `numeralType` = 'arabic' or 'roman':
  - `startingCanonicalPage` must be NOT NULL
  - `arbitrarySequence` must be NULL
- For positive rules with `numeralType` = 'arbitrary':
  - `arbitrarySequence` must be NOT NULL
  - `arbitrarySequence.length` must equal `(documentPageEnd - documentPageStart + 1)`
  - `startingCanonicalPage` must be NULL
- For negative rules:
  - `numeralType`, `startingCanonicalPage`, and `arbitrarySequence` must be NULL

### Computed Fields (Not Stored)

The following are NEVER stored in the database:

- **`context_derived_page_number`** - Extracted on-demand from page_number region bboxes
- **`canonical_page_number`** - Computed from: user rules > region-derived > document page
- **`is_indexable`** - Computed from canonical page (false if negative rule applies)
- **`has_context_conflicts`** - Computed client-side from overlapping page_number regions (Phase 6)

### Index Mentions (Unchanged)

```typescript
type IndexMention {
  id: string;
  indexId: string;
  conceptId: string;
  document_page_number: number; // Source of truth for location
  // canonical_page_number displayed in UI is computed at query time
  // ... other fields
}
```

**Rationale for Computed Approach:**
- **Flexibility:** Page number rules can change without migrating mention data
- **Conflict awareness:** Can't compute canonical if region conflicts exist (forces resolution)
- **Single source of truth:** Document page number is authoritative
- **User rule priority:** User-defined rules always override region-derived
- **Performance:** Canonical page numbers cached in memory/query layer if needed

## Testing Requirements

**Note:** Phase 6 tests (page exclusion, region conflict detection) are documented in `phase-6-testing.md`.

### Page Number Extraction from Contexts
- [ ] Extract Arabic numbers from context bboxes (text layer)
- [ ] Extract Roman numerals from context bboxes
- [ ] Extract arbitrary page numbers from context bboxes
- [ ] Numeral type detection works correctly
- [ ] Sequence continuity detection works (i, ii, iii vs i, iii, v)
- [ ] Failed extraction returns null
- [ ] Region-derived page numbers only computed when NO region conflicts exist (Phase 6 constraint)

### User-Defined Rules - CRUD Operations
- [ ] Create positive rule with auto-generated sequence
- [ ] Create positive rule with arbitrary sequence
- [ ] Create negative rule (ignore pages)
- [ ] Create rule with optional label
- [ ] Update existing rule
- [ ] Delete rule
- [ ] List all rules for a project
- [ ] Rules persist correctly in database with all fields (label, numeralType, arbitrarySequence)

### Sequence Generation
- [ ] Generate Arabic sequence (start: 1, count: 5 → 1, 2, 3, 4, 5)
- [ ] Generate Roman numeral sequence (start: i, count: 5 → i, ii, iii, iv, v)
- [ ] Handle Roman numeral edge cases (4 = iv, 9 = ix, 40 = xl, etc.)
- [ ] Arbitrary sequence validation: count must match document page range
- [ ] Arbitrary sequence accepts any string values (e.g., "10a", "A-1", "II-5")
- [ ] Arbitrary sequence stores as array in database

### Rule Conflict Detection
- [ ] Detect overlapping document pages in two positive rules
- [ ] Detect overlapping document pages in two negative rules
- [ ] Detect overlapping document pages in positive and negative rules
- [ ] No conflict when rules are adjacent but not overlapping
- [ ] Conflict detection runs before rule creation/update

### Rule Splitting
- [ ] Split rule when pages removed from middle
- [ ] Shortened rule when pages removed from start
- [ ] Shortened rule when pages removed from end
- [ ] Canonical page sequence updates correctly after split
- [ ] Multiple rules created when needed (split into 2+)

### Rule Auto-Joining
- [ ] Join two positive rules when contiguous in doc pages AND canonical pages
- [ ] DON'T join when contiguous in doc pages but NOT canonical pages
- [ ] DON'T join when contiguous in canonical pages but NOT doc pages
- [ ] DON'T join when numeral types differ (Arabic vs Roman)
- [ ] Join multiple rules if all are contiguous (3+ rules → 1)

### Canonical Page Computation
- [ ] Return empty if region conflicts exist (Phase 6 constraint)
- [ ] Unaccounted pages show as red (document page number)
- [ ] Region-derived pages show as blue
- [ ] User-defined positive rules show as green
- [ ] User-defined negative rules show as gray with strikethrough
- [ ] User rules override region-derived (not conflict)
- [ ] Final canonical page computed correctly (user rules > context > document)

### UI - Project Sidebar Canonical Pages Section
- [ ] Color-coded canonical pages string displays correctly
- [ ] Statistics show correct counts (unaccounted, region-derived, user-defined, ignored)
- [ ] "Create Rule" button opens modal
- [ ] List of user-defined rules displays correctly
- [ ] Edit rule opens modal with pre-filled values
- [ ] Delete rule removes from database and updates display

### UI - Create/Edit Rule Modal
- [ ] Rule type selection (positive/negative)
- [ ] Document page range inputs validate (start ≤ end, within document page count)
- [ ] Numeral type selection (Arabic/Roman/Alphabetic) for positive rules
- [ ] Starting canonical page input validates format
- [ ] Preview shows generated canonical page sequence
- [ ] Conflict warning shows when overlapping rules exist
- [ ] Split/merge notification shows when applicable
- [ ] Cancel button closes modal without changes
- [ ] Save button creates/updates rule and closes modal

### UI - Page Sidebar Page Numbering Section
- [ ] Document page number always displays
- [ ] Region-derived page number displays (if exists) with region name
- [ ] User-defined rule displays (if exists) with rule description
- [ ] Strikethrough on region-derived when overridden by user rule
- [ ] "Index as canonical page" input creates quick rule
- [ ] Auto-detects numeral type from input
- [ ] Edit/Delete buttons for existing rules
- [ ] Final canonical page displays correctly

### Index Mentions
- [ ] Mentions store document_page_number only (not canonical)
- [ ] Canonical page number computed at query time for display
- [ ] Mentions display with correct canonical page number
- [ ] Changing rules updates mention display immediately (since computed)
- [ ] Changing contexts updates mention display immediately (since computed)

## Success Criteria

### Phase 6 (Region System) - ✅ Complete
- ✅ `exceptPages` field added to schema with `endPage` for "every other" mode
- ✅ "Remove from page" functionality works for both ignore and page_number regions
- ✅ Page exclusions display in page config summary via `getPageConfigSummary()`
- ✅ Conflict detection identifies overlapping page_number regions (client-side)
- ✅ Conflicts display inline with clickable page numbers in Project Sidebar
- ✅ Conflict warning shows in Page Sidebar when on conflicting page
- ✅ User can resolve conflicts by removing pages or editing contexts

### Phase 7 (Canonical Page Numbering) - Focus

#### Backend
- [ ] `canonical_page_rules` table created with proper schema (including label, arbitrarySequence fields)
- [ ] CRUD API endpoints for rules (create, read, update, delete)
- [ ] Sequence generators work for Arabic and Roman
- [ ] Arbitrary sequence validation (count matches document page range)
- [ ] Optional label field persists and displays correctly
- [ ] Rule conflict detection works (overlapping document pages)
- [ ] Rule splitting works (pages removed from middle → 2 rules)
- [ ] Rule auto-joining works (contiguous doc pages + canonical pages → 1 rule)
- [ ] Auto-joining applies to single-page rules created via "Index as canonical page"

#### Page Number Extraction
- [ ] Extract page numbers from context bboxes (PDF text layer)
- [ ] Numeral type detection (Arabic/Roman/Arbitrary)
- [ ] Sequence continuity detection
- [ ] Failed extraction returns null
- [ ] Only compute when NO region conflicts exist (Phase 6 constraint)

#### Canonical Page Computation
- [ ] Canonical pages are COMPUTED, never stored
- [ ] User rules take precedence over region-derived
- [ ] Unaccounted pages show red (error state)
- [ ] Region-derived pages show blue
- [ ] User-defined positive rules show green
- [ ] User-defined negative rules show gray with strikethrough
- [ ] Computation respects Phase 6 region conflicts (returns empty if conflicts exist)

#### UI - Project Sidebar
- [ ] Canonical Pages section displays color-coded string
- [ ] Statistics show correct counts (unaccounted, context, user-defined, ignored)
- [ ] "Create Rule" button opens modal
- [ ] List of user-defined rules with edit/delete actions
- [ ] Real-time updates when rules or regions change

#### UI - Create/Edit Rule Modal
- [ ] Rule type selection (positive/negative)
- [ ] Document page range inputs with validation
- [ ] Optional label field accepts user input
- [ ] Sequence mode toggle (auto-generate vs arbitrary)
- [ ] Auto-generate mode: Numeral type selection (Arabic/Roman)
- [ ] Auto-generate mode: Starting canonical page input with validation
- [ ] Arbitrary mode: Comma-separated canonical pages input
- [ ] Arbitrary mode: Validation that count matches document page range
- [ ] Preview of generated/arbitrary sequence displays correctly
- [ ] Conflict warnings with split/merge notifications
- [ ] Cancel/Save actions work correctly
- [ ] Label displays in rule list after creation

#### UI - Page Sidebar
- [ ] Document page number always displayed
- [ ] Region-derived page number displayed with region name (if exists)
- [ ] User-defined rule displayed with rule description (if exists)
- [ ] Strikethrough on region-derived when overridden by user rule
- [ ] "Index as canonical page" input creates quick rule
- [ ] Edit/Delete buttons for existing rules
- [ ] Final canonical page displayed correctly

#### Index Mentions
- [ ] Mentions store document_page_number only (not canonical)
- [ ] Canonical page numbers computed at display time
- [ ] Changing rules updates mention display immediately (computed)
- [ ] Changing contexts updates mention display immediately (computed)

## Post-MVP Enhancements

The following features are deferred for post-MVP implementation:

### Undo/Redo for Rule Operations
**Why deferred:** Adds complexity with events table integration and testing burden.

**Implementation approach (when ready):**
- Emit events to events table: `rule.created`, `rule.updated`, `rule.deleted`
- Store full before/after state in event metadata
- Implement undo by reversing events (delete → recreate with previous state, etc.)
- Show undo/redo buttons in UI with last N operations
- Consider session-based undo vs persistent undo across page reloads

**Current mitigation:** Clear confirmation dialogs showing exactly what will happen, easy rule deletion/recreation.

---

### Bulk Rule Operations
**Features:**
- Shift all canonical page numbers by N (e.g., "all pages are off by 2")
- Delete all rules at once with confirmation
- Duplicate/copy rules for similar sections
- Batch edit multiple rules

**Use case:** Large documents with systematic errors or complex rule sets that need adjustment.

---

### Context Extraction Preview Before Creation
**Feature:** In Create Context modal, after drawing bbox, show preview of extracted values for first 10 pages before user commits.

**Benefit:** Helps validate bbox placement is correct before creating the context.

---

### Notification When Context Changes Affect Rules
**Feature:** When user edits a region bbox after rules have been created based on that context, show notification: "Context extraction changed. X pages now differ from your rules. Review?"

**Benefit:** Prevents confusion when region-derived pages change but user rules remain.

---

### Import/Export Rule Sets
**Feature:** Export rules as JSON, import rules from JSON with smart mapping to document page count.

**Use case:** Reusing rule sets across similar documents (e.g., multiple volumes of same series).

**Not needed:** User feedback indicates this is rare enough to handle manually for MVP.

---

## Next Steps

After Phase 7 completion, Epic 1 (PDF Viewer + Annotation System) is complete.

### Epic 1 Complete Deliverables:
- ✅ Phase 1-5: PDF viewer with text selection and region drawing
- ✅ Phase 6: Region system (page_number and exclude regions)
- [ ] Phase 7: Canonical page numbering (user-defined rules + context extraction)

### Next Epics:
- **Epic 2:** Concept Detection
  - Respect exclude regions (don't detect on ignored pages)
  - Extract concepts from visible text
  - Generate index entries per index type
  - Reference document page numbers (canonical computed at display time)

- **Epic 3:** Index Editor
  - Tabs per index type (back-of-book, subject, author, etc.)
  - Edit/merge/split entries
  - See canonical page numbers (computed from rules + contexts)
  - Export-ready view

- **Epic 4:** Export
  - Separate HTML views per index type
  - Display canonical page numbers
  - Professional formatting
  - Print-ready output
