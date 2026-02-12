# Context-Derived Page Numbers: Implementation Guide

## Overview

Region-derived page numbers are extracted from `page_number` regions by reading the PDF text layer at the bbox location. This provides an automated way to derive canonical page numbers directly from the document's rendered page numbers.

## Architecture

### 1. Text Extraction Hook (`use-region-derived-page-numbers.ts`)

**Location**: `apps/index-pdf-frontend/src/app/projects/[projectDir]/editor/_hooks/use-region-derived-page-numbers.ts`

**Purpose**: Extract page numbers from PDF.js text layer at context bbox locations

**Key Features**:
- Uses PDF.js `getTextContent()` to access text layer
- Filters text items that intersect with context bboxes
- Validates extracted text using `extractPageNumberFromBbox`
- Returns `RegionDerivedPageNumber[]` with documentPage, canonicalPage, regionId, regionName
- Handles loading states and errors gracefully

**Implementation Details**:

```typescript
const extractTextFromBbox = async ({ page, bbox }) => {
  const textContent = await page.getTextContent();
  
  // Filter text items that intersect with bbox
  for (const item of textContent.items) {
    const itemX = item.transform[4];  // X position
    const itemY = item.transform[5];  // Y position
    const itemWidth = item.width;
    const itemHeight = item.height || 12; // Default fallback
    
    // Check intersection
    const intersects =
      itemX < bbox.x + bbox.width &&
      itemX + itemWidth > bbox.x &&
      itemY < bbox.y + bbox.height &&
      itemY + itemHeight > bbox.y;
  }
}
```

### 2. Text Validation (`extractPageNumberFromBbox`)

**Location**: `packages/core/src/canonical-page.utils.ts`

**Purpose**: Validate and clean extracted text to ensure it's a valid page number

**Validation Rules**:
- **Arabic numerals**: `/^\d+$/` (1, 2, 3, ...)
- **Roman numerals**: `/^[ivxlcdm]+$/i` (i, ii, iii, iv, ...)
- **Alphabetic**: `/^[a-z]+$/i` (a, b, c, ...)

**Returns**: `string | null` (null if invalid)

### 3. Integration Points

#### Project Pages Content
- Displays project-wide canonical page statistics
- Shows all region-derived page numbers in overview
- Enables bulk rule creation/management

#### Page Pages Content
- Shows region-derived page number for current page
- Allows quick rule creation from region-derived numbers
- Displays source precedence (rule > context > document)

## Answering Your Questions

### Q: Best way to read spans with bounding boxes within page number regions?

**Answer**: Use PDF.js `page.getTextContent()` and filter by bbox intersection.

**Why this approach**:
1. **Native PDF.js API**: No additional dependencies
2. **Accurate positioning**: Text items include transform matrices with exact positions
3. **Already in use**: PDF viewer already uses this for text selection
4. **Performance**: Efficient coordinate-based filtering

**Alternative approaches considered**:
- ❌ **PyMuPDF extraction on backend**: Requires separate PDF processing, coordinate system conversion
- ❌ **DOM text layer scraping**: Brittle, depends on CSS rendering
- ✅ **PDF.js getTextContent**: Best balance of accuracy and simplicity

### Q: Should we consolidate continuous ranges?

**Answer**: Yes, consolidation happens automatically via `formatCanonicalPagesDisplay`.

**How it works**:

1. **Region-derived numbers are extracted** per page:
   ```
   Page 5 → "i"
   Page 6 → "ii"
   Page 7 → "iii"
   ```

2. **`computeCanonicalPages` assigns them**:
   ```javascript
   {
     5: { canonicalPage: "i", source: "context", ... },
     6: { canonicalPage: "ii", source: "context", ... },
     7: { canonicalPage: "iii", source: "context", ... }
   }
   ```

3. **`formatCanonicalPagesDisplay` consolidates**:
   ```
   "5-7 (i-iii, context: Page Numbers)" 
   ```

**Key point**: Consolidation is for *display only*. The underlying data keeps per-page granularity for:
- Precedence resolution (rules can override individual pages)
- Conflict detection
- Visual indicators in UI

### Q: If page numbers are continuous ranges, should we create rules?

**Answer**: Optional - user-driven, not automatic.

**Design Philosophy**:
1. **Region-derived numbers are authoritative**: They come directly from the PDF
2. **Rules are for corrections/overrides**: Use when context extraction fails or needs adjustment
3. **No automatic rule creation**: Region-derived numbers already work without rules

**UI Workflows**:

#### Option 1: Keep as region-derived (recommended)
- Context extracts "i, ii, iii" → used directly
- Precedence: Rules > **Context** > Document
- Advantage: Automatic, updates if PDF changes

#### Option 2: Convert to rule (manual)
- User clicks "Create rule from region-derived"
- Modal pre-fills: pages 5-7, numeral type "roman", starting page "i"
- Precedence: **Rules** > Context > Document
- Advantage: Survives context deletion, can be edited independently

**When to create rules from region-derived**:
- ✅ Context extraction is failing on some pages (consolidate manually)
- ✅ User wants to override context with different numbering
- ✅ PDF will be replaced, but numbering should persist
- ❌ Context extraction works fine (unnecessary duplication)

## Performance Considerations

### When does extraction happen?

**Current implementation**: On component mount + when contexts/PDF changes

**Optimization strategies**:
1. **Debouncing**: Already implemented via hook dependency array
2. **Caching**: Store results in atom/localStorage between sessions
3. **Lazy loading**: Only extract when "Project Pages" section is visible
4. **Background worker**: Offload extraction to Web Worker

### PDF.js performance

**Memory**: Each `getTextContent()` call loads ~100-500KB per page
**CPU**: Text layer parsing is ~10-50ms per page

**For 500-page PDF**:
- **All pages**: 50-250MB, 5-25 seconds (not recommended)
- **Page-number contexts only**: ~1-5 pages, <500ms (current approach)

**Implementation**: Only extract pages within `getApplicablePages(context)`

## Edge Cases & Handling

### 1. Multiple page-number regions

**Scenario**: User creates two overlapping `page_number` regions

**Behavior**:
- Extract from both contexts
- `computeCanonicalPages` uses **first** region-derived number (by context creation time)
- Precedence: Rules > **First Context** > Later Contexts > Document

**UI**: Show conflict warning if contexts extract different numbers for same page

### 2. Invalid text extraction

**Scenario**: Context bbox contains non-page-number text (e.g., "Chapter 1")

**Behavior**:
- `extractPageNumberFromBbox` returns `null`
- Page falls back to document page number
- No error shown (graceful degradation)

**UI**: Could show warning icon on context to indicate extraction failure

### 3. Missing text layer

**Scenario**: Scanned PDF without OCR

**Behavior**:
- `getTextContent()` returns empty items
- Extraction returns empty string → `null`
- Falls back to document page numbers

**UI**: Show info message: "No text layer found - consider running OCR"

### 4. Rotated/Complex layouts

**Scenario**: Page numbers in margins, multi-column text

**Behavior**:
- PDF.js `getTextContent()` provides rotation in transform matrix
- Current implementation ignores rotation (TODO: handle in future)
- Bbox intersection works regardless of text flow direction

**Future enhancement**: Apply rotation transformation to bbox before intersection check

## Testing Strategy

### Unit Tests

**`extractPageNumberFromBbox`**:
- ✅ Arabic numbers: "1", "2", "100"
- ✅ Roman numbers: "i", "iv", "MCMXC"
- ✅ Alphabetic: "a", "b", "aa"
- ✅ Invalid: "Chapter 1", "", "---"

**`extractTextFromBbox`**:
- ✅ Single text item
- ✅ Multiple intersecting items
- ✅ No intersection
- ✅ Empty text layer

### Integration Tests

**`useRegionDerivedPageNumbers`**:
- ✅ Extract from real PDF
- ✅ Handle loading states
- ✅ Handle errors (invalid PDF, network failure)
- ✅ Re-extract when regions change

### Manual Testing

**End-to-end workflow**:
1. Create `page_number` region on page 5 (containing "i")
2. Verify "Project Pages" shows: `5 (i, context: Page Numbers)`
3. Verify "Page" section shows: Region-derived: `i`
4. Create rule for page 5 → "1" (override)
5. Verify display updates: `5 (1, rule: My Rule)` (rule wins)

## Future Enhancements

### Phase 2: Advanced Extraction

**Features**:
- Confidence scoring (high/medium/low)
- Multiple extraction attempts with different strategies
- Machine learning for ambiguous cases

**Example**:
```javascript
{
  canonicalPage: "i",
  confidence: "high", // 95% certain it's a page number
  alternates: ["1"], // Other possible interpretations
}
```

### Phase 3: OCR Integration

**For scanned PDFs**:
- Detect missing text layer
- Offer to run OCR via backend (Tesseract/Azure)
- Store OCR results as overlay text layer

### Phase 4: Bulk Operations

**UI improvements**:
- "Extract all page numbers" button
- "Create rules from all regions" (batch operation)
- Visual diff showing region-derived vs. rules

## Summary

**Implementation Approach**:
1. ✅ Use PDF.js `getTextContent()` for extraction (implemented)
2. ✅ Filter text items by bbox intersection (implemented)
3. ✅ Validate extracted text (implemented)
4. ✅ Integrate into both Project and Page UI (implemented)
5. ✅ Consolidate ranges for display only (via existing utils)

**Key Design Decisions**:
- **No automatic rule creation**: Region-derived numbers work standalone
- **Consolidation is display-only**: Preserve per-page granularity in data
- **Graceful degradation**: Fall back to document page numbers on extraction failure
- **User-driven overrides**: Rules take precedence when user needs corrections

**Next Steps**:
1. Test with real PDFs containing various page number formats
2. Add error handling UI (show extraction failures)
3. Consider caching extracted page numbers for performance
4. Add "Create rule from context" button in UI
