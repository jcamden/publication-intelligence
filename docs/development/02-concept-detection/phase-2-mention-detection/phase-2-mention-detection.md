# Phase 2: Mention Detection & Meaning Resolution

**Duration:** 6-7 days  
**Priority:** P0 (Critical path)  
**Status:** Not Started

## Overview

Integrate OpenRouter to detect mentions with precise char ranges, resolve canonical meanings using WordNet/Wikidata, and optionally rate confidence. Uses two-stage detection (Stage A: text-only LLM → Stage B: local mapping) to reduce costs by ~60%.

## Goals

1. **Pass 1 - Mention Detection**: LLM identifies mentions via char ranges (text-only, cheap)
2. **Pass 2 - Meaning Resolution**: Batch disambiguation with WordNet/Wikidata candidates
3. **Pass 3 - Confidence Rating** (optional): LLM rates Indexability + Specificity
4. Create IndexEntry + IndexMentions with `isSuggestion=true`
5. Store provenance (`detection_runs` table with `extraction_version`)
6. Enable intelligent re-detection merging (by `meaning_id`)
7. Respect suppression rules (don't re-suggest rejected entries)

## Key Architectural Decisions

### Two-Stage Detection (Cost Optimization)

**Stage A: Text-Only Prompt → Char Ranges**
- LLM receives explicit `pageText` field (no bboxes)
- Returns `textQuote` + `charStart` + `charEnd`
- CRITICAL: Validate `pageText.substring(charStart, charEnd) === textQuote`
- If invalid: Retry with stricter prompt
- Cost: ~$0.40-$0.60 for 200-page book

**Stage B: Local Char Range → TextAtom Mapping → BBox**
- Re-extract TextAtoms for primary page (deterministic, ~50-100ms)
- Map `char_range` to TextAtoms using character offsets
- Compute bbox as union of TextAtom bboxes
- No LLM call (pure local computation)
- Cost: $0.00

**Result:** 60% cost savings vs sending full TextAtom payloads.

### Canonical Meanings for Deterministic Merging

**Decision:** Every IndexEntry gets `meaning_type` + `meaning_id` (nullable for custom).

**Meaning Types:**
- `wordnet`: Common words/concepts (e.g., `oewn:faith.n.02`)
- `wikidata`: Named entities (e.g., `wikidata:Q43115` = Athanasius)
- `custom`: No good match (e.g., domain-specific technical terms)

**Merge Key:**
- Primary: `(project_id, index_type, meaning_type, meaning_id)` when `meaning_id IS NOT NULL`
- Fallback: `(project_id, index_type, normalized_label, meaning_type)` when `meaning_type='custom'`

**Benefit:** User can rename label without breaking merge (meaning stays stable).

### Provenance & Reproducibility

**Detection Runs Table:**
- Track job state, model, settings, `extraction_version`
- Enables resumability, audit trail, validation

**Every Mention Stores:**
- `text_quote` (exact matched string)
- `char_range` (offsets in `indexable_text`)
- `bbox` (computed from TextAtoms)
- `run_id` (which detection run created it)

**Invariant:** `indexable_text[char_range] === text_quote` (always reconstructible)

### Suppression Rules

**Decision:** `suppressed_suggestions` table prevents re-suggesting rejected entries.

**Fields:**
- `meaning_id` (primary suppression key)
- `normalized_label` (fallback for custom)
- `scope` (project | chapter | page_range)
- `suppression_mode` (block_suggestion | block_all)

**Check Before Creating:**
```sql
SELECT * FROM suppressed_suggestions
WHERE project_id = ? 
  AND index_type = ?
  AND meaning_id = ?;
```

## Database Schema Changes

### New Table: `detection_runs`

```sql
CREATE TABLE detection_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id),
  status text NOT NULL DEFAULT 'queued',  -- queued|running|completed|failed|cancelled
  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  finished_at timestamptz,
  progress_page integer,                  -- For resumability
  total_pages integer,
  model text NOT NULL,                    -- e.g., "anthropic/claude-3.5-sonnet"
  prompt_version text NOT NULL,           -- e.g., "2024-02-v1"
  settings_hash text NOT NULL,            -- Hash of detection settings
  extraction_version text NOT NULL,       -- Hash of indexable_text state
  index_types text[] NOT NULL,            -- e.g., ["subject", "author"]
  error_message text,
  cost_estimate_usd numeric(10,4),
  actual_cost_usd numeric(10,4),
  entries_created integer DEFAULT 0,
  mentions_created integer DEFAULT 0
);
```

### New Table: `suppressed_suggestions`

```sql
CREATE TABLE suppressed_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id),
  index_type text NOT NULL,
  normalized_label text NOT NULL,
  meaning_type text,                      -- wordnet|wikidata|custom (nullable)
  meaning_id text,                        -- For meaning-based suppression
  scope text DEFAULT 'project',           -- project|chapter|page_range (future-proof)
  suppression_mode text DEFAULT 'block_suggestion',  -- block_suggestion|block_all
  suppressed_at timestamptz NOT NULL DEFAULT now(),
  suppressed_by uuid REFERENCES users(id),
  reason text,                            -- Optional: why suppressed
  UNIQUE(project_id, index_type, normalized_label, meaning_type, meaning_id, scope)
);
```

### Extend `index_entries` (14 new columns)

```sql
ALTER TABLE index_entries 
  -- Suggestion lifecycle
  ADD COLUMN is_suggestion boolean DEFAULT false NOT NULL,
  ADD COLUMN suggestion_status text DEFAULT 'accepted',  -- suggested|accepted|rejected|suppressed
  ADD COLUMN suggested_by_run_id uuid REFERENCES detection_runs(id),
  ADD COLUMN created_source text DEFAULT 'user',         -- llm|user|import
  
  -- Canonical meaning (MVP)
  ADD COLUMN meaning_type text,                          -- wordnet|wikidata|custom
  ADD COLUMN meaning_id text,                            -- e.g., "oewn:faith.n.01", "wikidata:Q43115"
  ADD COLUMN meaning_confidence numeric(3,2),            -- 0-1
  ADD COLUMN meaning_source text,                        -- llm|user
  ADD COLUMN meaning_gloss text,                         -- Cached display text
  ADD COLUMN normalized_label text,                      -- For merge keys
  
  -- Optional confidence rating (Pass 3)
  ADD COLUMN indexability numeric(3,2),                  -- nullable
  ADD COLUMN specificity numeric(3,2),                   -- nullable
  ADD COLUMN overall_confidence numeric(3,2),            -- nullable, avg of above 2
  ADD COLUMN rated_at timestamptz;                       -- When Pass 3 completed

-- Unique constraint: prevent duplicate meanings
CREATE UNIQUE INDEX idx_entries_unique_meaning 
  ON index_entries(project_id, index_type, meaning_type, meaning_id) 
  WHERE meaning_id IS NOT NULL AND deleted_at IS NULL;

-- Fallback constraint: prevent duplicate labels when meaning unknown
CREATE UNIQUE INDEX idx_entries_unique_label_custom 
  ON index_entries(project_id, index_type, normalized_label, meaning_type) 
  WHERE meaning_id IS NULL AND deleted_at IS NULL;
```

### Extend `index_mentions` (5 new columns)

```sql
ALTER TABLE index_mentions
  ADD COLUMN is_suggestion boolean DEFAULT false NOT NULL,
  ADD COLUMN suggested_by_run_id uuid REFERENCES detection_runs(id),
  ADD COLUMN text_quote text NOT NULL,                  -- Exact matched string
  ADD COLUMN char_range int4range NOT NULL,             -- Start/end in indexable_text
  ADD COLUMN validation_status text DEFAULT 'valid';    -- valid|needs_review|invalid

-- Index for reproducibility queries
CREATE INDEX idx_mentions_char_range ON index_mentions USING gist(char_range);

-- Index for merge-key deduplication
CREATE INDEX idx_mentions_merge_key ON index_mentions(entry_id, page_number, text_quote) 
  WHERE deleted_at IS NULL;

-- Index for flagged mentions
CREATE INDEX idx_mentions_needs_review ON index_mentions(validation_status)
  WHERE validation_status != 'valid';
```

## Pass 1: Mention Detection (Stage A + Stage B)

### Stage A: Text-Only Prompt

**Input Structure:**
```json
{
  "pages": [
    {
      "pageNumber": 5,
      "pageText": "The doctrine of divine simplicity holds that God..."
    },
    {
      "pageNumber": 6,
      "pageText": "Critics of divine simplicity argue..."
    }
  ],
  "indexTypes": ["subject", "author"]
}
```

**System Prompt:**
```
You will receive pages as structured objects with explicit text.

For each index entry you identify, return:
- label (the index term)
- pageNumber (which page it appears on)
- textQuote (MUST be an exact substring of pageText)
- charStart (0-indexed position where textQuote starts in pageText)
- charEnd (0-indexed position where textQuote ends in pageText)

CRITICAL: Validate that pageText.substring(charStart, charEnd) === textQuote
If you cannot find an exact substring match, skip that mention.

EXCLUDE:
- Common verbs (do, have, make, get, see)
- Generic nouns (thing, person, way, time)
- Everyday language (very, really, always, never)
- Structural terms (chapter, section, conclusion)
```

**Subject Index Criteria:**
```
Identify KEY CONCEPTS, THEMES, and TECHNICAL TERMS discussed in the text.

INCLUDE:
- Specific concepts (e.g., "divine simplicity", "modal realism")
- Technical terms (e.g., "transubstantiation", "soteriology")
- Philosophical/theological themes (e.g., "free will", "incarnation")
- Abstract ideas discussed substantively (e.g., "virtue", "causation")

EXCLUDE:
- Proper nouns (people, places, organizations) - these belong in Author index
- Common verbs, generic nouns, everyday language
```

**Author Index Criteria:**
```
Identify AUTHORS mentioned or discussed in the text.

INCLUDE:
- Proper names of authors, scholars, thinkers, writers
- Format: "LastName, FirstName" (e.g., "Aquinas, Thomas")
- Both cited sources and authors discussed as subjects
- Historical and contemporary figures

EXCLUDE:
- Fictional characters
- Hypothetical persons used in examples
- The current book's author (unless self-citing)
```

**LLM Response:**
```json
{
  "entries": [
    {
      "label": "divine simplicity",
      "indexType": "subject",
      "mentions": [
        {"pageNumber": 5, "textQuote": "divine simplicity", "charStart": 16, "charEnd": 33},
        {"pageNumber": 6, "textQuote": "divine simplicity", "charStart": 11, "charEnd": 28}
      ]
    }
  ]
}
```

**Post-Processing Validation:**
```typescript
const validateMention = ({ pageText, mention }) => {
  const extracted = pageText.substring(mention.charStart, mention.charEnd);
  
  if (extracted !== mention.textQuote) {
    throw new ValidationError({
      code: 'CHAR_RANGE_MISMATCH',
      expected: mention.textQuote,
      found: extracted,
      mention
    });
  }
  
  return mention;
};
```

### Stage B: Local Char Range → BBox Mapping

```typescript
// For each validated mention from Stage A:

const createMentionWithBBox = async ({ pageNumber, textQuote, charStart, charEnd, runId }) => {
  // 1. Get page data
  const page = await db.documentPages.findFirst({
    where: { pageNumber, document: { projectId } }
  });
  
  // 2. Re-extract TextAtoms for this page (deterministic)
  const textAtoms = await extractTextAtomsForPage({
    pdfPath,
    pageNumber,
    indexableText: page.indexableText
  });
  
  // 3. Validate: textQuote must match pageText substring
  if (page.indexableText.substring(charStart, charEnd) !== textQuote) {
    throw new ValidationError('char_range_mismatch');
  }
  
  // 4. Find TextAtoms within char range
  const atomsInRange = textAtoms.filter(atom => 
    atom.charStart >= charStart && atom.charEnd <= charEnd
  );
  
  // 5. Compute bbox as union of all atom bboxes
  const bbox = computeBBoxUnion(atomsInRange.map(a => a.bbox));
  
  // 6. Create IndexMention
  await db.indexMentions.create({
    data: {
      entryId,
      pageNumber,
      bbox,
      text_quote: textQuote,
      char_range: `[${charStart},${charEnd})`, // PostgreSQL int4range
      is_suggestion: true,
      suggested_by_run_id: runId,
      validation_status: 'valid'
    }
  });
};
```

## Pass 2: Meaning Resolution

### Candidate Retrieval

**WordNet Setup:**
```bash
# Download Open English WordNet
pip install wn
wn download oewn:2023

# Or load into PostgreSQL for faster queries
```

**Wikidata Setup:**
```typescript
// Thin client + local cache
const wikidataClient = {
  async search(label: string, type?: string): Promise<WikidataCandidate[]> {
    // 1. Check cache first
    const cached = await db.wikidataCache.findFirst({
      where: { query: label, type }
    });
    
    if (cached && Date.now() - cached.cached_at < CACHE_TTL) {
      return cached.results;
    }
    
    // 2. Call Wikidata API
    const response = await fetch(
      `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(label)}&language=en`
    );
    
    const results = await response.json();
    
    // 3. Cache results
    await db.wikidataCache.create({
      data: { query: label, type, results, cached_at: new Date() }
    });
    
    return results.search.map(r => ({
      meaning_type: 'wikidata',
      meaning_id: r.id,
      title: r.label,
      gloss: r.description
    }));
  }
};
```

**Candidate Selection Heuristics:**
```typescript
const getMeaningCandidates = async ({ label, indexType, context }) => {
  // Rule 1: Index type hints
  if (indexType === 'author') {
    return await wikidata.search(label, { type: 'person' });
  }
  
  // Rule 2: Capitalization patterns
  const isTitleCase = /^[A-Z][a-z]+(?: [A-Z][a-z]+)*$/.test(label);
  if (isTitleCase) {
    // Try Wikidata first (likely named entity)
    const candidates = await wikidata.search(label);
    if (candidates.length >= 3) {
      return candidates.slice(0, 8);
    }
  }
  
  // Rule 3: Multi-word technical phrases
  const wordCount = label.split(/\s+/).length;
  if (wordCount >= 3) {
    const candidates = await wikidata.search(label);
    if (candidates.length > 0) {
      return [...candidates, { meaning_type: 'custom', meaning_id: null }];
    }
    return [{ meaning_type: 'custom', meaning_id: null }];
  }
  
  // Rule 4: Default to WordNet for common words
  const wordnetCandidates = await wordnet.getSynsets(label);
  if (wordnetCandidates.length > 0) {
    return wordnetCandidates.slice(0, 8);
  }
  
  // Fallback: Try Wikidata, then custom
  const wikidataCandidates = await wikidata.search(label);
  if (wikidataCandidates.length > 0) {
    return [...wikidataCandidates, { meaning_type: 'custom', meaning_id: null }];
  }
  
  return [{ meaning_type: 'custom', meaning_id: null }];
};
```

### Batch Disambiguation

**Prompt Structure:**
```json
{
  "items": [
    {
      "itemId": "entry_1",
      "label": "faith",
      "indexType": "subject",
      "context": "The author discusses faith as trust in divine revelation...",
      "candidates": [
        {"meaning_type": "wordnet", "meaning_id": "oewn:faith.n.01", "gloss": "complete confidence in a person or plan"},
        {"meaning_type": "wordnet", "meaning_id": "oewn:faith.n.02", "gloss": "a strong belief in a supernatural power"},
        {"meaning_type": "custom", "meaning_id": null, "gloss": "None of these fit"}
      ]
    },
    {
      "itemId": "entry_2",
      "label": "Athanasius",
      "indexType": "author",
      "context": "Athanasius, bishop of Alexandria, defended...",
      "candidates": [
        {"meaning_type": "wikidata", "meaning_id": "wikidata:Q43115", "gloss": "Bishop of Alexandria (296-373)"},
        {"meaning_type": "wikidata", "meaning_id": "wikidata:Q123456", "gloss": "Modern theologian"},
        {"meaning_type": "custom", "meaning_id": null, "gloss": "None of these fit"}
      ]
    }
  ]
}
```

**LLM Response:**
```json
{
  "results": [
    {
      "itemId": "entry_1",
      "meaning_type": "wordnet",
      "meaning_id": "oewn:faith.n.02",
      "confidence": 0.92,
      "reason_code": "clear_match"
    },
    {
      "itemId": "entry_2",
      "meaning_type": "wikidata",
      "meaning_id": "wikidata:Q43115",
      "confidence": 0.95,
      "reason_code": "clear_match"
    }
  ]
}
```

**Batch Size:** 10-30 entries per call (adjust based on token limit)

**Hard-Case Retry:**
```typescript
const disambiguateWithRetry = async ({ entries }) => {
  // First pass: Batch all entries
  const results = await llm.disambiguate({ items: entries });
  
  // Identify hard cases (confidence < 0.65)
  const hardCases = results.filter(r => r.confidence < 0.65);
  
  if (hardCases.length > 0) {
    // Second pass: Re-run hard cases individually with more context
    for (const entry of hardCases) {
      const retryResult = await llm.disambiguate({
        items: [entry],
        context: getLargerContext(entry), // More surrounding text
        candidates: getMoreCandidates(entry) // Fetch additional candidates
      });
      
      // Update with retry result
      Object.assign(entry, retryResult[0]);
    }
  }
  
  return results;
};
```

## Pass 3: Confidence Rating (Optional)

**Input:** Term list only (no context)
```json
{
  "terms": [
    {"termId": "entry_1", "label": "divine simplicity", "indexType": "subject"},
    {"termId": "entry_2", "label": "faith", "indexType": "subject"},
    {"termId": "entry_3", "label": "Aquinas, Thomas", "indexType": "author"}
  ]
}
```

**Prompt:**
```
For each term, rate:
- Indexability (0-1): Would a reader look this up?
- Specificity (0-1): Concrete/specific vs generic/vague?

Return overall confidence as average of the two.
```

**Response:**
```json
{
  "ratings": [
    {"termId": "entry_1", "indexability": 0.90, "specificity": 0.95, "overallConfidence": 0.93},
    {"termId": "entry_2", "indexability": 0.85, "specificity": 0.70, "overallConfidence": 0.78},
    {"termId": "entry_3", "indexability": 0.95, "specificity": 0.90, "overallConfidence": 0.93}
  ]
}
```

## tRPC Routers

### New Router: `detection`

```typescript
export const detectionRouter = router({
  start: protectedProcedure
    .input(z.object({
      projectId: z.string().uuid(),
      indexTypes: z.array(z.enum(['subject', 'author', 'scripture'])),
      model: z.string(),
      enableConfidenceRating: z.boolean().default(false),
      minOccurrences: z.record(z.number()), // Per index type
    }))
    .mutation(async ({ input, ctx }) => {
      // 1. Compute extraction_version
      // 2. Create detection_run record (status: 'queued')
      // 3. Queue detection job
      // 4. Return runId
      return { runId };
    }),
  
  status: protectedProcedure
    .input(z.object({ runId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const run = await ctx.db.detectionRuns.findUnique({
        where: { id: input.runId }
      });
      
      return {
        status: run.status,
        progress: run.progress_page,
        total: run.total_pages,
        entries_created: run.entries_created,
        mentions_created: run.mentions_created,
        actual_cost: run.actual_cost_usd
      };
    }),
  
  rateConfidence: protectedProcedure
    .input(z.object({ runId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      // Optional Pass 3: Rate confidence for all suggested entries
      return { jobId };
    }),
});
```

## Success Criteria

- [ ] OpenRouter API integrated with rate limiting
- [ ] **Stage A**: Text-only prompt with explicit `pageText` field → char ranges + `textQuote` validation
- [ ] **Stage A validation**: Post-process validates `pageText.substring(charStart, charEnd) === textQuote`
- [ ] **Stage A retry**: If validation fails, retry with stricter prompt
- [ ] **Stage B**: Re-extract TextAtoms for primary page → map char range → bbox computation (deterministic)
- [ ] Modular prompts work for all index types (composable)
- [ ] Sliding windows track primary page (no overlap mentions created)
- [ ] Page-boundary mentions handled (split or reject, configurable)
- [ ] System creates IndexMention with `text_quote` + `char_range` + `bbox` + `run_id`
- [ ] `extraction_version` computed and stored on detection run
- [ ] **Meaning resolution**:
  - [ ] WordNet candidate retrieval works (local DB)
  - [ ] Wikidata candidate retrieval works (API + cache)
  - [ ] Batch disambiguation (10-30 entries/call) works
  - [ ] Hard-case retry (<0.65 confidence) works
  - [ ] Every entry gets `meaning_type` (wordnet|wikidata|custom)
  - [ ] `meaning_id` required for wordnet/wikidata, null for custom
- [ ] `detection_runs` table tracks job state + `extraction_version` + resumability
- [ ] Merge logic uses meaning_id when present, normalized_label fallback for custom
- [ ] Suppression rules checked before creating entries
- [ ] Cost estimation modal shows before starting (accurate ±20%, with variability note)
- [ ] User can queue/cancel detection jobs
- [ ] Detection completes in < 15min for 200-page book
- [ ] **Pass 1** (detection): $0.40-$0.60 (text-only)
- [ ] **Pass 2** (meaning): $0.10-$0.20 (batch)
- [ ] **Pass 3** (confidence): $0.05-$0.10 (optional)

## Dependencies

- Phase 1: Text Extraction (must be complete)
- OpenRouter API key
- WordNet database (Open English WordNet)
- Wikidata API access

## Next Steps

After Phase 2 is complete:
1. **Test Pass 1**: Verify Stage A validation + Stage B mapping works
2. **Test Pass 2**: Verify meaning resolution with WordNet/Wikidata
3. **Test re-detection**: Verify merge logic with meaning_id
4. **Test suppression**: Verify rejected entries don't re-appear
5. **Move to Phase 3**: Mention Review UI
