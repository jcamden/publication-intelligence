# Epic 2: Architecture Revision

**Date:** February 11, 2026  
**Status:** Critical Changes Required Before Implementation

## Executive Summary

Based on detailed review, the original architecture had fundamental misunderstandings about the detection task. This document outlines required changes before implementation begins.

## Critical Misunderstandings Corrected

### 1. **We're Detecting Mentions, Not Just Concepts**

**Wrong Assumption:**
- LLM detects "divine simplicity appears on pages 5, 12, 18"
- User accepts concept
- User manually highlights text to create IndexMentions

**Correct Understanding:**
- LLM detects specific text spans (via TextAtom IDs) for each mention
- System immediately creates IndexEntry + IndexMentions (both with `isSuggestion=true`)
- User reviews suggested mentions, accepts/rejects/edits them
- Accepted mentions: flip `isSuggestion=false`

**Why This Matters:**
- Saves user from manually highlighting every mention
- LLM does the heavy lifting of finding all occurrences
- User just reviews and approves
- Much faster workflow

### 2. **No Separate Suggestion Tables**

**Wrong Approach:**
- Separate `index_entry_suggestions` table
- Separate `detection_jobs` table
- Complex migration from suggestions → entries

**Correct Approach:**
- Just add `isSuggestion: boolean` to existing tables:
  - `index_entries.is_suggestion`
  - `index_mentions.is_suggestion`
- Suggested entries don't show in main index until accepted
- Suggested mentions don't render on PDF until accepted
- Much simpler!

### 3. **TextAtoms Must Be Sent to LLM**

**Wrong Approach:**
- Send plain text strings to LLM
- LLM returns page numbers
- Later figure out bboxes somehow

**Correct Approach:**
- Send TextAtoms (word + bbox + sequence) in prompt
- LLM returns TextAtom IDs for each mention
- Immediately have precise bboxes for IndexMentions
- No guessing or text searching needed

**Prompt Format:**
```json
{
  "textAtoms": [
    { "id": "atom_123", "word": "The", "page": 5, "sequence": 1 },
    { "id": "atom_124", "word": "doctrine", "page": 5, "sequence": 2 },
    { "id": "atom_125", "word": "of", "page": 5, "sequence": 3 },
    { "id": "atom_126", "word": "divine", "page": 5, "sequence": 4 },
    { "id": "atom_127", "word": "simplicity", "page": 5, "sequence": 5 },
    ...
  ]
}
```

**LLM Response:**
```json
{
  "entries": [
    {
      "term": "divine simplicity",
      "mentions": [
        {
          "pageNumber": 5,
          "textAtomIds": ["atom_126", "atom_127"],
          "startSequence": 4,
          "endSequence": 5
        },
        {
          "pageNumber": 12,
          "textAtomIds": ["atom_892", "atom_893"],
          "startSequence": 23,
          "endSequence": 24
        }
      ]
    }
  ]
}
```

### 4. **Sliding Window Overlap is ONLY for Context**

**Wrong Understanding:**
- Windows overlap by 500 tokens
- Create mentions from overlapping text
- Deduplicate mentions across windows

**Correct Understanding:**
- Windows overlap ONLY to give context
- Each page indexed ONCE (when it's the primary page in window)
- NO mentions created from overlap text
- NO deduplication needed (no duplicates generated)

**Example:**
```
Window 1: Pages 1-3 (page 2-3 is context for page 1)
  → Create mentions for page 1 only

Window 2: Pages 2-4 (page 2 again, but now as primary)
  → Create mentions for page 2 only (page 1 was already done)

Window 3: Pages 3-5
  → Create mentions for page 3 only
```

**Implementation:**
- Track which pages have been indexed
- Mark primary page in each window
- Only create mentions for primary page
- Use surrounding pages for context only

### 5. **Project:Document is 1:1**

**Wrong Schema:**
- Projects can have multiple documents
- Detection runs across all documents

**Correct Schema:**
- One project = one document
- 1:1 relationship
- Multi-document projects are post-MVP

**Schema Fix Needed:**
```typescript
// projects table - add unique constraint
unique_project_document: unique(document_id)

// Or simpler: merge into one table
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey(),
  userId: uuid("user_id").notNull(),
  name: text("name").notNull(),
  documentPath: text("document_path").notNull(), // PDF file path
  // No separate source_documents table needed for MVP
});
```

### 6. **Exclude Regions Filter at TWO Stages**

**Stage 1: Pre-Extraction (TextAtom Creation)**
- When PyMuPDF extracts TextAtoms
- Check if TextAtom bbox is within exclude region bbox
- Set `isIndexable: false` if within exclude region
- Don't send non-indexable TextAtoms to LLM

**Stage 2: Post-Acceptance (IndexMention Creation)**
- When user accepts suggested mention
- Check if IndexMention bbox is within exclude region bbox
- Warn user: "This mention overlaps with exclude region 'Header'"
- Allow user to proceed or reject

**Ignored Pages:**
- Don't create TextAtoms for ignored pages
- Skip ignored pages in sliding windows entirely
- Much simpler than bbox checking

### 7. **Homonym Handling via Parentheticals**

**Problem:**
- "Bank" (financial) vs "Bank" (river)
- "Grace" (theological) vs "Grace" (elegance)

**Solution:**
- LLM generates: "Bank (financial)", "Bank (river)"
- Store in IndexEntry.label with parenthetical
- User can edit label later
- User can make one a child of the other if desired

**Later (Optional Pass): Canonical Sense Anchoring**

For professional-grade indexing, add semantic IDs:

```typescript
type IndexEntryMeaning = 
  | { type: "wordnet", id: string }      // e.g., "bank.n.01"
  | { type: "wikidata", id: string }     // e.g., "Q16397"  
  | { type: "custom", id: uuid }         // Domain-specific

export const indexEntries = pgTable("index_entries", {
  // ... existing fields
  label: text("label").notNull(),        // Display text: "Bank (financial)"
  meaningType: text("meaning_type"),     // "wordnet" | "wikidata" | "custom"
  meaningId: text("meaning_id"),         // Canonical sense ID
});
```

**Benefits:**
- Prevents accidental conflation of distinct concepts
- Enables semantic merging across sources
- Maintains conceptual precision
- Post-MVP enhancement

### 8. **Confidence Rating is Optional Pass 3**

**Flow:**
1. **Pass 1: Detection** (Required)
   - Send TextAtoms to LLM
   - Get back IndexEntries + IndexMentions
   - Create with `isSuggestion=true`

2. **Pass 2: Canonicalization** (Optional, Post-MVP)
   - Add WordNet/Wikidata sense IDs
   - Disambiguate homonyms
   - Enable semantic operations

3. **Pass 3: Confidence Rating** (Optional)
   - Rate suggestions by Indexability + Specificity
   - Help user prioritize review
   - Cheap (just term list, no full text)

### 9. **TextAtoms Are Ephemeral (Don't Persist)**

**Current Plan (Wrong):**
- Extract TextAtoms
- Store in `text_atoms` table
- Query later for preview

**Correct Plan:**
- Extract TextAtoms in memory
- Send to LLM immediately
- LLM returns IndexMentions with bboxes (from TextAtom data)
- Store bboxes in IndexMentions
- **Discard TextAtoms** (no persistence needed)

**Why:**
- TextAtoms are just intermediate representation
- Final IndexMentions have all bbox data needed
- Saves storage (45k rows per document eliminated)
- Simpler architecture

**Exception:**
- May want to cache TextAtoms briefly (Redis?) during detection
- Allows resume if job fails mid-process
- Expire after 24 hours

### 10. **Merge Old/New Suggestions**

**Problem:**
- User runs detection
- Gets 200 suggestions
- Accepts 50
- Runs detection again with different settings
- Gets 180 suggestions (some overlap with previous 200)

**Solution:**
- Before creating new suggestions, query existing:
  ```sql
  SELECT * FROM index_entries 
  WHERE project_id = ? 
  AND is_suggestion = true
  ```
- For each new suggestion:
  - If exact match exists (same label, same index type): Skip
  - If similar match exists (fuzzy): Merge mentions, update confidence
  - If no match: Create new
- Don't delete old suggestions unless user explicitly re-runs with "Replace all"

### 11. **Demote Entry = Move Back to Suggestions**

**Clarification:**
- "Demote" means: flip `isSuggestion` from false → true
- Entry/Mentions become suggestions again
- NOT the same as "make child of another entry"

**If User Edited Label:**
- Warn: "This entry's label has been edited. Original suggestion was 'divine simplicity', current label is 'Divine Simplicity (Aquinas)'. Demoting will keep current label."
- Actually, we DON'T need to revert label - just flip the flag!
- User's edits are preserved

### 12. **Index Types Are Completely Separate**

**Validation:**
- Can't make Author suggestion a child of Subject entry
- Can't link Author mention to Subject entry
- Enforce: `suggestion.projectIndexTypeId === entry.projectIndexTypeId`

### 13. **Detection Job Queue**

**Implementation:**
- Allow 1 active job + 1 queued job per project
- If job running: Show "Detection in progress..."
- If user starts another: Queue it, show "Queued (will start when current job completes)"
- If 2nd job tries to queue: Reject, show "Job already queued. Cancel existing job to queue new one."

**Parallel Execution:**
- If processing different projects: Can run in parallel
- If same project: Must serialize (avoid duplicate IndexEntries/Mentions)

### 14. **No Batch Operation Limits Needed**

**User feedback:** If user selects 1000 suggestions and clicks "Batch Accept", let them!

**Implementation:**
- Process in chunks of 100 (for DB performance)
- Show progress: "Accepting suggestions: 342/1000"
- No client-side limit

### 15. **Abort Detection if No TextAtoms**

**Scenario:**
- User tries to run detection
- Document has no text (all pages ignored, or all text filtered)

**Response:**
- Don't start job
- Show error: "No indexable text found. Please check exclude regions or add text to document."
- Return: `{ success: false, error: "no_indexable_text" }`

## Implementation Impact Summary

### Tasks That Need Major Rewrites

**Task 1: Text Extraction**
- ✅ Keep most of the implementation
- ❌ Remove TextAtom table persistence (keep in memory only)
- ✅ Add page dimensions storage
- ✅ Keep exclude region filtering

**Task 2: LLM Integration**
- ❌ Complete rewrite of prompt format (send TextAtoms, not text)
- ❌ Complete rewrite of response parsing (get TextAtom IDs back)
- ❌ Remove detection_jobs table
- ❌ Remove index_entry_suggestions table
- ✅ Add isSuggestion flag to existing tables
- ❌ Change window processing (track primary page, no overlap indexing)
- ✅ Keep two-pass approach (detection + optional rating)
- ➕ Add optional Pass 2: Canonicalization (WordNet/Wikidata)

**Task 3: Suggestion Management**
- ✅ Keep two-column UI concept
- ❌ Change from separate suggestion table to isSuggestion flag queries
- ✅ Keep accept/reject/demote operations
- ➕ Add mention-level review (not just entry-level)
- ➕ Add merge old/new suggestion logic

**Task 4: Post-Processing**
- ❌ Remove deduplication (no duplicates generated)
- ✅ Keep fuzzy matching for similar concepts
- ✅ Keep hierarchy inference
- ➕ Add canonicalization pass (WordNet/Wikidata)

### New Schema Requirements

```typescript
// Add to index_entries table
is_suggestion: boolean("is_suggestion").default(false).notNull(),
meaning_type: text("meaning_type"), // "wordnet" | "wikidata" | "custom" (optional)
meaning_id: text("meaning_id"),     // Canonical sense ID (optional)

// Add to index_mentions table  
is_suggestion: boolean("is_suggestion").default(false).notNull(),

// Remove these tables (no longer needed)
// - detection_jobs
// - index_entry_suggestions
// - duplicate_suggestions
// - similarity_matches
// - hierarchy_inferences
```

### Simplified Data Flow

**Before (Complex):**
```
Extract text → 
Send to LLM → 
Store in suggestions table → 
User reviews → 
Create entries → 
User manually highlights → 
Create mentions
```

**After (Simple):**
```
Extract TextAtoms (memory) → 
Send TextAtoms to LLM → 
Create IndexEntries + IndexMentions (isSuggestion=true) → 
User reviews → 
Flip isSuggestion=false or delete
```

## Next Steps

1. ✅ Create revised task documents with corrected architecture
2. ✅ Update schema diagrams
3. ✅ Revise cost estimates (sending TextAtoms = more tokens)
4. ✅ Update UI mockups to show mention-level review
5. ✅ Add canonicalization pass documentation
6. ✅ Remove unnecessary deduplication logic

---

**Bottom Line:**
This is a simpler, more powerful architecture that matches how professional indexers actually work. The LLM does the tedious work of finding every mention, the user reviews and approves. Much better!
