# Concept Detection - Simplified Architecture

**Status:** In Progress  
**Last Updated:** 2026-02-12

## Core Principle: On-Demand Extraction with Sliding Windows

No pre-extraction phase. Extract text on-demand during indexing, keep minimal pages in memory, discard after processing.

## The Flow

### 1. User Initiates Indexing

User clicks "Run Detection" → Selects index types (Subject, Author, Scripture)

### 2. Sliding Window Extraction + Detection

For each page in the document:

```typescript
// Example: Processing page 100
const window = {
  previousContext: extractPage(99, { contextOnly: true }), // 25% of page 99
  currentPage: extractPage(100, { full: true }),            // Full page 100
  nextContext: extractPage(101, { contextOnly: true }),     // 25% of page 101
};

// Keep TextAtoms in memory (only for these 2-3 pages)
const textAtoms = {
  page99: [...], // Word-level with bboxes
  page100: [...],
  page101: [...],
};
```

### 3. Send Text to LLM (No Bboxes)

```typescript
const prompt = {
  pages: [
    { pageNumber: 99, text: "...partial context..." },      // 25% for continuity
    { pageNumber: 100, text: "...full page text..." },      // Primary page
    { pageNumber: 101, text: "...partial context..." },     // 25% for continuity
  ],
  indexTypes: ["subject", "author"],
  instructions: "Return mentions with charAt references for page 100 only",
};

// LLM responds:
{
  entries: [
    {
      label: "divine simplicity",
      indexType: "subject",
      mentions: [
        {
          page: 100,
          textQuote: "divine simplicity",
          charStart: 245,  // Position in page 100's text
          charEnd: 262,
        }
      ]
    }
  ]
}
```

### 4. Map charAt → TextAtoms → BBoxes (In Memory)

```typescript
// For each mention on page 100:
const mention = { charStart: 245, charEnd: 262, textQuote: "divine simplicity" };

// Map to TextAtoms we have in memory
const atomsInRange = textAtoms.page100.filter(
  (atom) => atom.charStart >= 245 && atom.charEnd <= 262,
);

// Compute bbox as union of word bboxes
const bbox = computeBBoxUnion(atomsInRange);
```

### 5. Persist IndexEntry + IndexMention (Suggestions)

```typescript
await db.insert(indexEntries).values({
  projectId,
  label: "divine simplicity",
  indexType: "subject",
  isSuggestion: true,
  suggestionStatus: "suggested",
});

await db.insert(indexMentions).values({
  entryId,
  pageNumber: 100,
  textQuote: "divine simplicity",
  charStart: 245,
  charEnd: 262,
  bbox,  // From TextAtoms
  isSuggestion: true,
});
```

### 6. Discard TextAtoms, Slide Window

```typescript
// Drop page 99 from memory
delete textAtoms.page99;

// Extract page 102 (25% context for next window)
textAtoms.page102 = extractPage(102, { contextOnly: true });

// Continue to next window...
```

## What Gets Stored (Minimal)

### During Indexing (Per Mention)
- ✅ `textQuote` - Exact matched string
- ✅ `charStart/charEnd` - Position in page text
- ✅ `bbox` - Computed from TextAtoms (for rendering)
- ✅ `isSuggestion: true` - User hasn't reviewed yet

### What Does NOT Get Stored
- ❌ TextAtoms (ephemeral, in-memory only)
- ❌ Full page text extraction (extracted on-demand)
- ❌ Extraction versioning (not needed in MVP)
- ❌ Page dimensions (can get from PDF.js if needed)

## Key Design Decisions

### 1. No Pre-Extraction Phase

**Old design:** Extract all pages → Store text → Then detect  
**New design:** Extract on-demand during detection → Discard after use

**Benefits:**
- Simpler flow (one pass instead of two)
- No extraction UI needed (happens automatically)
- No extraction versioning complexity
- Faster time-to-value for users

### 2. Sliding Windows (Not Full Document)

**Window size:**
- 1 full page (primary)
- 25% of previous page (for continuity)
- 25% of next page (for continuity)

**Why 25%?**
- Enough context for LLM to understand cross-page concepts
- Minimal memory footprint
- Fast extraction (~50-100ms per 3-page window)

**Example:** 200-page book = 200 windows, ~10-20 seconds total extraction time (distributed across indexing)

### 3. Text-Only LLM Input (Not Bboxes)

**Prompt format:**
```json
{
  "pages": [
    { "pageNumber": 99, "pageText": "...last 25% of page..." },
    { "pageNumber": 100, "pageText": "...full page text..." },
    { "pageNumber": 101, "pageText": "...first 25% of page..." }
  ],
  "instruction": "Detect mentions on page 100 only. Reference text by charAt position."
}
```

**LLM response:**
```json
{
  "entries": [
    {
      "label": "Christology",
      "indexType": "subject",
      "mentions": [
        {
          "page": 100,
          "textQuote": "doctrine of Christ",
          "charStart": 156,
          "charEnd": 174
        }
      ]
    }
  ]
}
```

### 4. In-Memory TextAtom Mapping

**Keep in memory:**
- Previous page TextAtoms (25% tail)
- Current page TextAtoms (100%)
- Next page TextAtoms (25% head)

**Map charAt → bbox:**
```typescript
const mapMentionToBBox = ({ mention, textAtoms }) => {
  const atomsInRange = textAtoms.filter(
    atom => atom.charStart >= mention.charStart && 
            atom.charEnd <= mention.charEnd
  );
  
  return computeBBoxUnion(atomsInRange);
};
```

**Discard after:** Once we finish processing a page, drop its TextAtoms from memory.

### 5. Exclude Regions Filter During Extraction

**When extracting:** Mark TextAtoms as `isIndexable: false` if they overlap exclude regions.

**When building prompt:** Only send indexable text to LLM (filter out non-indexable words).

```typescript
const buildPromptText = ({ textAtoms, pageNumber }) => {
  return textAtoms
    .filter(atom => atom.pageNumber === pageNumber && atom.isIndexable)
    .map(atom => atom.word)
    .join(' ');
};
```

**Result:** LLM never sees headers/footers/ignored content → No wasted tokens.

## Implementation Tasks

### Task 1: On-Demand PyMuPDF Extraction

**Goal:** Extract text atoms for a single page or page range on-demand.

**Implementation:**
```typescript
const extractPageWindow = async ({ 
  pdfPath, 
  centerPage,
  includeContext = true 
}: {
  pdfPath: string;
  centerPage: number;
  includeContext?: boolean;
}) => {
  // Call Python extractor for 1-3 pages
  const pagesToExtract = includeContext 
    ? [centerPage - 1, centerPage, centerPage + 1].filter(p => p > 0)
    : [centerPage];
  
  const result = await callPythonExtractor({ 
    pdfPath, 
    pages: pagesToExtract 
  });
  
  // Convert PyMuPDF words to TextAtoms
  const textAtoms = convertWordsToTextAtoms(result);
  
  // Apply exclude region filtering
  const filteredAtoms = applyRegionFiltering({ textAtoms, excludeRegions });
  
  return {
    previousContext: extractContextText(filteredAtoms, centerPage - 1, 'tail'),
    currentPage: extractFullText(filteredAtoms, centerPage),
    nextContext: extractContextText(filteredAtoms, centerPage + 1, 'head'),
    textAtoms: filteredAtoms, // Keep in memory for bbox mapping
  };
};
```

**Status:** Partially complete (full extraction works, need to add page range support)

---

### Task 2: Sliding Window Detection Loop

**Goal:** Process document page-by-page with sliding windows.

**Implementation:**
```typescript
const runDetection = async ({ projectId, indexTypes }) => {
  const sourceDoc = await getSourceDocument({ projectId });
  const excludeRegions = await getExcludeRegions({ projectId });
  
  for (let pageNum = 1; pageNum <= sourceDoc.pageCount; pageNum++) {
    // Extract window (previous 25% + current + next 25%)
    const window = await extractPageWindow({
      pdfPath: sourceDoc.storagePath,
      centerPage: pageNum,
      includeContext: true,
    });
    
    // Build prompt with page text (no bboxes)
    const prompt = buildDetectionPrompt({
      pages: [
        { pageNumber: pageNum - 1, text: window.previousContext },
        { pageNumber: pageNum, text: window.currentPage },
        { pageNumber: pageNum + 1, text: window.nextContext },
      ],
      indexTypes,
      primaryPage: pageNum,
    });
    
    // Call LLM (Stage A: text-only)
    const llmResponse = await callLLM({ prompt });
    
    // Validate responses
    const validatedMentions = validateCharRanges({
      mentions: llmResponse.mentions,
      pageText: window.currentPage,
    });
    
    // Map charAt → TextAtoms → bboxes (Stage B: local)
    const mentionsWithBboxes = validatedMentions.map(mention => ({
      ...mention,
      bbox: mapMentionToBBox({ mention, textAtoms: window.textAtoms }),
    }));
    
    // Persist as suggestions
    await createSuggestedEntries({ 
      entries: llmResponse.entries,
      mentions: mentionsWithBboxes,
    });
    
    // Discard TextAtoms for previous page (no longer needed)
    // Next iteration will extract new context page
  }
};
```

**Status:** Not started

---

### Task 3: Meaning Resolution (Batch)

**Goal:** Resolve canonical meanings for all detected entries.

**Implementation:**
```typescript
const resolveMeanings = async ({ detectedEntries }) => {
  // Get candidates for each entry
  const entriesWithCandidates = await Promise.all(
    detectedEntries.map(async (entry) => ({
      entry,
      candidates: await getCandidates({ 
        label: entry.label,
        indexType: entry.indexType,
        context: entry.firstMentionContext,
      }),
    }))
  );
  
  // Batch disambiguation (10-30 entries per LLM call)
  const batches = chunk(entriesWithCandidates, 20);
  
  for (const batch of batches) {
    const disambiguationResults = await llm.batchDisambiguate({ batch });
    
    // Update entries with meaning_type + meaning_id
    await Promise.all(
      disambiguationResults.map(result => 
        db.update(indexEntries)
          .set({
            meaningType: result.meaningType,
            meaningId: result.meaningId,
            meaningConfidence: result.confidence,
            meaningGloss: result.gloss,
          })
          .where({ id: result.entryId })
      )
    );
  }
  
  // Retry low-confidence entries (<0.65) individually
  const lowConfidence = disambiguationResults.filter(r => r.confidence < 0.65);
  for (const entry of lowConfidence) {
    const retry = await llm.disambiguateIndividual({ entry });
    await updateEntryMeaning({ entryId: entry.id, ...retry });
  }
};
```

**Status:** Not started

---

### Task 4: Review UI with Accept/Reject

**Goal:** Two-column interface for reviewing suggestions.

**Implementation:**
- Left column: Suggested entries (with meanings)
- Right column: Accepted entries
- Actions: Accept, Reject, Suppress, Make Child
- Mention-level controls (accept/reject individual mentions)

**Status:** Not started (Phase 3)

---

## Comparison: Old vs. New Architecture

| Aspect | Old (Over-Engineered) | New (Simplified) |
|--------|----------------------|------------------|
| **Pre-extraction** | ✅ Yes (Phase 1) | ❌ No - extract on-demand |
| **TextAtom storage** | ✅ Store indexableText | ❌ In-memory only |
| **Extraction versioning** | ✅ Hash all text | ❌ Not needed |
| **Extraction UI** | ✅ Separate panel | ❌ Not needed |
| **Detection flow** | Two phases | One pass (sliding windows) |
| **Memory usage** | Low (text only) | Low (2-3 pages of atoms) |
| **Extraction time** | 1-2 min upfront | Distributed (~10-20s total) |
| **Complexity** | High | Low |
| **Time to value** | Slower (extract → detect) | Faster (detect immediately) |

## Database Schema (Minimal)

### What We Actually Need

**IndexEntries (suggestions):**
```sql
ALTER TABLE index_entries
  ADD COLUMN is_suggestion boolean DEFAULT false,
  ADD COLUMN suggestion_status text DEFAULT 'suggested',  -- suggested|accepted|rejected|suppressed
  ADD COLUMN meaning_type text,                           -- wordnet|wikidata|custom
  ADD COLUMN meaning_id text,                             -- e.g., "oewn:faith.n.02"
  ADD COLUMN meaning_confidence numeric(3,2),
  ADD COLUMN normalized_label text;
```

**IndexMentions (with charAt references):**
```sql
ALTER TABLE index_mentions
  ADD COLUMN is_suggestion boolean DEFAULT false,
  ADD COLUMN text_quote text,      -- Exact matched string
  ADD COLUMN char_start integer,   -- Position in page text
  ADD COLUMN char_end integer;     -- Position in page text
```

**DetectionRuns (job tracking):**
```sql
CREATE TABLE detection_runs (
  id uuid PRIMARY KEY,
  project_id uuid REFERENCES projects(id),
  status text,                     -- running|completed|failed|cancelled
  progress_page integer,           -- For resumability
  total_pages integer,
  model text,
  index_types text[],
  created_at timestamptz,
  finished_at timestamptz,
  entries_created integer,
  mentions_created integer
);
```

### What We DON'T Need

- ❌ `document_pages.indexable_text` (no pre-extraction)
- ❌ `document_pages.dimensions` (get from PDF.js if needed)
- ❌ `projects.extraction_status` (no pre-extraction phase)
- ❌ `projects.extraction_version` (no versioning needed)
- ❌ `text_atoms` table (never persisted)

## Cost & Performance

### Extraction Cost
- **Per page:** ~50-100ms to extract + filter
- **1008-page book:** ~84-168 seconds total extraction (distributed across detection)
- **Memory:** 2-3 pages of TextAtoms at a time (~5-10MB)

### Detection Cost (LLM)
- **Text-only prompts:** ~60% cheaper than full atom payloads
- **200-page book:** $0.40-$0.60 (detection only)
- **With meaning resolution:** +$0.10-$0.20 (batch disambiguation)
- **Total:** $0.50-$0.80 per book

### Total Time
- **200-page book:** ~12-15 minutes end-to-end
- **1008-page book:** ~60-75 minutes end-to-end

## Implementation Order

1. ✅ **Python extractor** - Already works (`get_text("words")`)
2. ⏳ **Sliding window extraction** - Extract 1 page + context (25% before/after)
3. ⏳ **Context text extraction** - Get first/last 25% of page text
4. ⏳ **LLM integration** - Send text-only prompts, receive charAt references
5. ⏳ **charAt → bbox mapping** - Use in-memory TextAtoms
6. ⏳ **Persist suggestions** - IndexEntries + IndexMentions
7. ⏳ **Meaning resolution** - Batch WordNet/Wikidata disambiguation
8. ⏳ **Review UI** - Two-column accept/reject interface

## Questions & Answers

### Q: What about exclude regions?

**A:** Filter during extraction, before sending to LLM.

```typescript
const textAtoms = extractPage(100);
const indexableAtoms = textAtoms.filter(
  atom => !overlapsExcludeRegion(atom.bbox, excludeRegions)
);

// Only send indexable text to LLM
const pageText = indexableAtoms.map(a => a.word).join(' ');
```

### Q: What if LLM returns invalid charAt positions?

**A:** Validate and retry (or skip).

```typescript
const isValid = pageText.substring(charStart, charEnd) === textQuote;
if (!isValid) {
  // Log error, skip this mention
  // TODO: Post-MVP could retry with stricter prompt
}
```

### Q: What about page-boundary mentions?

**A:** MVP approach - reject them (too complex for now).

```typescript
if (mention.charStart < 0 || mention.charEnd > pageText.length) {
  // Mention spans page boundary - skip for MVP
  logDiscardedMention({ reason: 'spans_page_boundary' });
}
```

**Post-MVP:** Could split into multiple mentions (one per page).

### Q: How do we handle errors (page extraction fails)?

**A:** Flag for post-MVP - fail the entire detection run for now.

```typescript
try {
  const window = await extractPageWindow({ pdfPath, centerPage });
} catch (error) {
  // TODO: Post-MVP - skip page and continue
  // For MVP: fail entire run
  await markDetectionFailed({ runId, error });
  throw error;
}
```

### Q: What about meaning resolution?

**A:** Same as before - batch WordNet/Wikidata disambiguation after detection completes.

This part doesn't change - still runs after all mentions are detected.

## Next Steps

1. Update Python extractor to support page range extraction
2. Implement sliding window loop
3. Implement 25% context extraction (first/last N words of page)
4. Wire up LLM integration
5. Implement charAt → bbox mapping
6. Test with real PDF

## Files to Update

- ✅ `apps/index-pdf-extractor/extract_pdf.py` - Add page range support
- ⏳ `apps/index-pdf-backend/src/modules/source-document/text-extraction.service.ts` - Remove pre-extraction
- ⏳ `apps/index-pdf-backend/src/modules/detection/detection.service.ts` - NEW: Sliding window detection
- ⏳ `apps/index-pdf-backend/src/modules/detection/meaning-resolution.service.ts` - NEW: Batch disambiguation
- ⏳ Frontend: Remove extraction UI (happens automatically during detection)

## Files to Delete

- ❌ `phase-1-text-extraction.md` (obsolete - no pre-extraction)
- ❌ Text extraction panel UI (not needed - happens during detection)
- ❌ Extraction status tracking (not needed)
