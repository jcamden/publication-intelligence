# Epic 2: Mention Detection & Indexing

**Status**: Ready for implementation  
**Duration**: 12-15 days (with parallelization) | 15-19 days (sequential)  
**Cost**: $0.50-$0.80 per 200-page book (60% cheaper than original design)

## Goal

Extract text from PDFs and use LLM to detect specific mentions of indexable concepts with precise bounding boxes and canonical meanings, creating suggested IndexEntries and IndexMentions that users can review and accept.

## User Story

As an indexer, I want the AI to find and highlight every mention of important concepts in my PDF with exact positions and stable meanings, so I can review and approve them instead of manually highlighting each occurrence myself.

## Quick Summary

This epic implements **mention-level detection** with:
- **Reproducible mentions**: `text_quote` + `char_range` stored for debugging/validation
- **Canonical meanings**: WordNet/Wikidata IDs prevent homonym collapse
- **Cost-optimized**: Text-only prompts + local bbox mapping (60% savings)
- **Provenance**: Full audit trail via `detection_runs` table
- **Suppression**: Rejected entries never re-appear

**Three passes**:
1. **Detection** ($0.40-$0.60): LLM finds mentions via char ranges
2. **Meaning resolution** ($0.10-$0.20): Batch disambiguation with WordNet/Wikidata
3. **Confidence rating** ($0.05-$0.10, optional): Filter low-quality suggestions

## Phase Documents

This epic is broken into 4 phases for implementation:

- **[Phase 1: Text Extraction](./phase-1-text-extraction/phase-1-text-extraction.md)** (2-3 days, P0)
  - PyMuPDF integration for word-level extraction
  - TextAtom ephemeral pattern (in-memory only)
  - Ignore context filtering + extraction versioning
  - Bbox conversion utilities
  - **Blocks:** Phase 2, Phase 3

- **[Phase 2: Mention Detection](./phase-2-mention-detection/phase-2-mention-detection.md)** (6-7 days, P0)
  - Two-stage detection (Stage A: text-only → Stage B: local mapping)
  - OpenRouter integration with modular prompts
  - Meaning resolution (WordNet + Wikidata)
  - detection_runs table + suppression rules
  - **Depends on:** Phase 1 (needs `indexable_text` + `extraction_version`)
  - **Can parallelize with:** Phase 3 UI components

- **[Phase 3: Mention Review](./phase-3-mention-review/phase-3-mention-review.md)** (4-5 days, P0)
  - Split into 3a (parallel) + 3b (serial) for faster delivery
  - See sub-phases below

- **[Phase 3a: UI Components](./phase-3-mention-review/phase-3a-ui-components.md)** (3-4 days, P0) ⚡
  - Two-column layout with mock data
  - EntryCard, MentionCard, MeaningBadge components
  - Storybook stories + interaction tests
  - **Depends on:** Phase 1 only
  - **Runs in parallel with:** Phase 2 ⚡

- **[Phase 3b: Backend Integration](./phase-3-mention-review/phase-3b-backend-integration.md)** (1-2 days, P0)
  - Replace mock data with real tRPC queries
  - Implement mutations + optimistic updates
  - PDF viewer integration + extraction change detection
  - **Depends on:** Phase 2 + Phase 3a

- **[Phase 4: Optional Enhancements](./phase-4-optional-enhancements/phase-4-optional-enhancements.md)** (2-3 days, P2)
  - Fuzzy matching for similar entries
  - Hierarchy inference via patterns
  - Quality metrics dashboard
  - **Depends on:** Phase 3b (post-MVP)

## Parallelization Strategy

**Sequential (No Parallelization):**
```
Phase 1 (3 days)
    ↓
Phase 2 (7 days)
    ↓
Phase 3a (4 days)
    ↓
Phase 3b (2 days)
    ↓
Phase 4 (3 days, optional)

Total: 19 days MVP (22 days with Phase 4)
```

**Parallel (Optimized):**
```
Phase 1 (3 days)
    ↓
    ├─→ Phase 2 Backend (7 days) ────┐
    │                                 ├─→ Phase 3b Integration (2 days)
    └─→ Phase 3a UI (4 days) ────────┘
                                      ↓
                                 Phase 4 (3 days, optional)

Total: 12 days MVP (15 days with Phase 4)
Savings: 7 days (37% faster!)
```

### What Can Be Parallelized

The key insight: **Phase 3a (UI Components) only needs Phase 1 schema, not Phase 2 backend.**

**Phase 3a (Parallel with Phase 2) - No Backend Needed:**
- ✅ UI component structure (EntryCard, MentionCard, MeaningBadge)
- ✅ Two-column layout skeleton
- ✅ Mock data structures (match Phase 2 schema)
- ✅ Visual design (spacing, colors, interactions)
- ✅ Storybook stories + interaction tests
- ✅ Filter/sort logic (client-side)
- ✅ State management (Jotai atoms)

**Phase 3b (After Phase 2) - Needs Backend:**
- ⏸️ tRPC endpoint integration (needs Phase 2 routers)
- ⏸️ Real data queries (needs detection_runs + suggested entries in DB)
- ⏸️ Accept/reject/suppress mutations (needs Phase 2 endpoints)
- ⏸️ Meaning resolution integration (needs WordNet/Wikidata service)
- ⏸️ PDF viewer highlighting (needs bbox data from Phase 2)

### Team Allocation Examples

**Single Engineer (Sequential):**
```
Phase 1 (3d) → Phase 2 (7d) → Phase 3a (4d) → Phase 3b (2d) = 16 days
```

**Two Engineers (Parallel):**
```
Engineer A: Phase 1 (3d) → Phase 2 (7d) ─────────────┐
                                                      ├─→ Phase 3b (2d)
Engineer B: [Wait 3d] → Phase 3a (4d) [Wait 3d] ────┘

Critical path: 3 + 7 + 2 = 12 days
Engineer B utilization: 4/12 = 33% (7 days idle)
```

**Optimized Two Engineers:**
```
Engineer A: Phase 1 (3d) → Phase 2 (7d) ───────────────┐
                                                        ├─→ Phase 3b (2d)
Engineer B: [Wait 3d] → Phase 3a (4d) → Help Phase 2 (3d)┘

Critical path: 12 days
Engineer B utilization: 7/12 = 58% (5 days idle)
```

**Three Engineers (Maximum Parallelization):**
```
Engineer A: Phase 1 (3d) → Phase 2 Backend (7d) ────────┐
                                                         ├─→ Phase 3b (2d)
Engineer B: [Wait 3d] → Phase 3a Frontend (4d) ─────────┘
Engineer C: [Wait 3d] → Phase 2 Meaning Service (7d) ───┘

Critical path: 12 days
All engineers productive after Phase 1
```

**Time Savings:**
- 1 engineer: 16 days (baseline)
- 2 engineers: 12 days (25% faster)
- 3 engineers: 12 days (no additional savings, bottleneck is Phase 2)

## ⚠️ Architecture Overview

**READ FIRST:** See [ARCHITECTURE-REVISION.md](./ARCHITECTURE-REVISION.md) for detailed architectural decisions and rationale.

### Design Principles

This architecture is built on **5 core principles** for production-ready mention detection:

1. **Reproducibility over Convenience**
   - Every mention stores `text_quote` + `char_range` (not just bbox)
   - Invariant: `indexable_text[char_range] === text_quote`
   - Enables debugging, validation, and trust

2. **Provenance over Simplicity**
   - Every suggestion tracks `run_id`, `created_source`, `model`, `settings_hash`
   - `detection_runs` table enables resumability and audit trail
   - "Which run created this?" is always answerable

3. **Determinism over Fragility**
   - Canonical meaning IDs (WordNet/Wikidata) prevent homonym collapse
   - Merge key: `(meaning_id, normalized_label)` (not just `label`)
   - Same concept across runs = same `meaning_id` = correct merge

4. **Cost-Effectiveness over Gold-Plating**
   - Text-only prompts (Stage A) = 60% cheaper than atom payloads
   - Local mapping (Stage B) = no LLM call unless ambiguous
   - Optional confidence rating (Pass 3) = user chooses cost/quality tradeoff

5. **Robustness over Optimism**
   - Suppression rules prevent re-suggesting rejected junk
   - Page-boundary handling (split or reject, configurable)
   - Resumability after failures (track `progress_page`)
   - Validation on extraction changes (flag invalid `char_range`)

### What Changed from Original Design

| Aspect | Original Design ❌ | Final Design ✅ |
|--------|-------------------|-----------------|
| **What we detect** | Concept labels + page numbers | Mentions with char ranges + bboxes |
| **LLM input** | Plain text strings | Text-only with page markers |
| **LLM output** | `{term, pages: [5,12]}` | `{label, charRange, textQuote}` |
| **Local mapping** | N/A | char range → TextAtoms → bbox |
| **Storage** | Separate `suggestions` table | `isSuggestion` + provenance fields |
| **Reproducibility** | Only bbox stored | `text_quote` + `char_range` + `run_id` |
| **Homonyms** | Parentheticals only | Canonical meaning IDs (WordNet/Wikidata) |
| **Merge key** | `label + index_type` | `meaning_id + normalized_label` |
| **User review** | Accept concepts → create entry | Review suggested entries/mentions |
| **Mentions** | User highlights after accepting | LLM creates, user accepts/rejects each |
| **Duplicates** | Need deduplication | No duplicates (primary page + meaning IDs) |
| **Suppression** | Soft delete only | Suppression rules (don't re-suggest) |
| **Jobs** | In-memory state | `detection_runs` table (resumable) |
| **Confidence** | 3 scores in detection pass | Optional 3rd pass (Indexability + Specificity) |
| **Project:Document** | 1:many | 1:1 (one PDF per project) |
| **New tables** | 6 new tables | 2 new tables (detection_runs, suppressed_suggestions) |

**Why This Is Better:**
- **Reproducible**: Every mention reconstructible from stored text
- **Auditable**: Full provenance (which run, which model, which settings)
- **Deterministic**: Meaning IDs prevent homonym collapse
- **Cost-effective**: Text-only prompts are ~60% cheaper than full atom payloads
- **Robust**: Suppression rules + merge keys handle re-detection intelligently
- **Resumable**: Jobs table enables pause/resume across deploys

## Critical Improvements from Review

Based on deep architectural review, we made **9 critical changes** that prevent future pain:

### Quick Fixes Summary

1. **✅ Fixed contradiction**: Removed "no detection_jobs persistence" (we DO persist via `detection_runs` table)
2. **✅ Clarified Stage B**: Re-extract TextAtoms for primary page (deterministic, ~50-100ms)
3. **✅ Added Stage A validation**: LLM must return exact `textQuote` substring of `pageText` + post-validation retry
4. **✅ Fixed "every entry gets meaning_id"**: Every entry gets `meaning_type` (required), `meaning_id` nullable for custom
5. **✅ Fixed merge key**: Use `meaning_id` alone (not + label) when present; label only for custom fallback
6. **✅ Added suppression scope**: `scope` (project/chapter/page_range) + `suppression_mode` (block_suggestion/block_all)
7. **✅ Added cost caveat**: "Cost depends on concept density and chosen model" (prevents support issues)
8. **✅ Added extraction_version**: Hash of `indexableText` for detecting changes + validating `char_range`
9. **✅ Fixed unique constraint**: Cover suggestions too, include `meaning_type` in fallback constraint

### Detailed Explanations

### 1. **Reproducibility: text_quote + char_range on Every Mention**

**Problem**: Original design stored only bbox. If user asks "why did LLM highlight this?", we can't reconstruct the exact input.

**Solution**: Store `text_quote` (exact string) + `char_range` (offsets in `indexable_text`) on every mention.

**Invariant**: `indexable_text[char_range] === text_quote` (always reconstructible)

**Benefits**:
- Debugging: Show exact text that LLM saw
- Merge keys: Use `text_quote` for deduplication (bbox can shift)
- Re-validation: Check if `char_range` still valid after extraction changes

### 2. **Provenance: detection_runs Table + Metadata**

**Problem**: Original design had "no detection_jobs persistence" (in-memory/cache). Jobs fail, deploys happen, state is lost.

**Solution**: Minimal `detection_runs` table with job state, settings, model, prompt version.

**Benefits**:
- Resumability: Track `progress_page`, continue after failures
- Audit trail: Answer "which run created this entry?"
- Cancellation: Update status to 'cancelled'
- Support: Full history of detection jobs

### 3. **Canonical Meanings: WordNet/Wikidata IDs (MVP, Not Post-MVP)**

**Problem**: Original design had meaning IDs as "Task 4 nice-to-have". Homonyms would collapse or proliferate.

**Solution**: Every IndexEntry gets `meaning_id` in Pass 2 (required, not optional).

**Merge key**:
- When `meaning_id IS NOT NULL`: `(project_id, index_type, meaning_type, meaning_id)` (label irrelevant)
- When `meaning_type='custom'`: `(project_id, index_type, normalized_label)`

**Benefits**:
- "Bank (financial)" vs "Bank (river)" stay separate (different `meaning_id`)
- User can rename label ("Bank institution" → "Financial banks") without breaking merge (same `meaning_id`)
- Re-detection merges by stable `meaning_id`, not label variations
- User can change meaning if wrong ("Change meaning..." action)

### 4. **Suppression Rules: Don't Re-Suggest Rejected Junk**

**Problem**: Original design had soft delete only. User rejects "the" as an entry → next detection run suggests it again.

**Solution**: `suppressed_suggestions` table with `meaning_id` + `normalized_label`.

**Check before creating**: If `meaning_id` in suppression table → skip entry creation.

**Benefits**:
- User rejects once → never see it again
- Survives re-detection with different models/settings
- Per-project scoped

### 5. **Two-Stage Detection: Text-Only → Local Mapping (60% Cost Savings)**

**Problem**: Original design sent full TextAtom payloads (word, bbox, seq, ID) to LLM. Very expensive.

**Solution**:
- **Stage A**: LLM receives text-only → returns `char_range` or `text_quote`
- **Stage B**: System maps `char_range` to TextAtoms locally → computes bbox

**Ambiguous fallback**: If phrase appears multiple times on page → send atoms for that page only (rare).

**Benefits**:
- **Cost**: $0.40-$0.60 (text-only) vs $0.90-$1.10 (atom payloads) = ~60% savings
- **Speed**: Smaller prompts = faster responses
- **Quality**: Same precision (bbox from atoms either way)

---

### Core Concept: We Detect Mentions, Not Just Terms

Unlike a simple "concept extraction" tool, we're building a **mention detection system**:

- **Input**: PDF text as TextAtoms (word + bbox + sequence)
- **Output**: IndexEntries + IndexMentions with precise bounding boxes
- **Review**: User accepts/rejects suggested mentions (not just entry labels)
- **Result**: Fully linked index with highlights positioned exactly where concepts appear

### Key Architectural Decisions

1. **Two-Stage Mention Detection (Cost-Optimized)**
   - **Stage A**: LLM receives text-only with page markers → returns char ranges + quoted text
   - **Stage B**: Re-extract TextAtoms for primary page → map char ranges to atoms → compute bboxes
   - TextAtom re-extraction is deterministic (same `indexable_text` → same atoms)
   - Only call LLM for invalid mappings (e.g., `textQuote` not found in `pageText`)
   - Reduces token costs by ~60% vs sending full TextAtom payloads
   - System creates IndexEntry + IndexMentions with `isSuggestion=true`

2. **Canonical Meanings for Every Entry (MVP)**
   - Every IndexEntry resolves to a stable meaning type:
     - **WordNet/OEWN synset ID** for common words (e.g., `meaning_type='wordnet', meaning_id='oewn:faith.n.01'`)
     - **Wikidata QID** for named entities (e.g., `meaning_type='wikidata', meaning_id='wikidata:Q43115'`)
     - **Custom** fallback when neither fits (e.g., `meaning_type='custom', meaning_id=null`)
   - **Batch disambiguation**: 10-30 entries per LLM call with candidate lists
   - **Hard-case retry**: Re-run low-confidence (<0.65) entries individually
   - Prevents homonym collapse: "Bank (financial)" ≠ "Bank (river)" (different `meaning_id`)
   - Makes merge keys deterministic:
     - Primary: `(index_type, meaning_type, meaning_id)` when `meaning_id IS NOT NULL`
     - Fallback: `(index_type, normalized_label)` when `meaning_type='custom'`

3. **Reproducible Mentions with Text Anchors**
   - Store on every IndexMention:
     - `text_quote` (exact matched string)
     - `char_range` (start/end offsets in `indexable_text`)
     - `run_id` (which detection run created it)
     - `bbox` (computed from TextAtoms, for rendering)
   - **Invariant**: Every mention is reconstructible from `indexable_text` + `char_range`
   - Enables debugging ("why did LLM highlight this?")
   - Enables robust merge-key comparison across runs

4. **Provenance & Lifecycle Tracking**
   - **detection_runs table**: Track job state, settings, model, prompt version
   - **Provenance fields**: `suggested_by_run_id`, `created_source` (llm/user/import)
   - **Suggestion status**: `suggested | accepted | rejected | suppressed`
   - **Suppression rules**: Prevent re-suggesting rejected junk (by meaning_id or label)
   - Enables audit trail, resumability, and intelligent merging

5. **No Separate Suggestion Tables**
   - Use `isSuggestion` boolean + `suggestion_status` enum on existing tables
   - Suggested entries/mentions filtered by queries: `WHERE is_suggestion = false`
   - Much simpler than parallel suggestion tables
   - Provenance fields provide the metadata previously in separate tables

6. **Sliding Windows for Context Only**
   - Each page indexed once (when it's the primary page in window)
   - Surrounding pages provide context for understanding
   - **Edge case handling**: Mentions spanning page boundaries:
     - Option A: Persist only the portion on primary page
     - Option B: Strict validation (reject cross-page mentions)
   - No duplicates generated → no deduplication needed

7. **Project:Document is 1:1**
   - One project = one PDF document
   - Multi-document projects are post-MVP
   - Simpler schema and UI

8. **Exclude Regions with Auto-Actions**
   - **Pre-extraction**: Don't send non-indexable text to LLM
   - **Post-acceptance**: Configurable action:
     - **Warn** (default): Show warning, let user decide
     - **Auto-reject**: Automatically suppress overlapping mentions
   - Ignored pages skipped entirely in sliding windows
   - User can set per-region auto-action rules

## Dependencies

- Epic 1: PDF Viewer (document upload + storage)
- Epic 1: Phase 6 (Region system for exclude regions)
- Infrastructure: PyMuPDF, OpenRouter API, WordNet DB, Wikidata API

## Meaning Resolution Strategy

### Why Both WordNet AND Wikidata?

Different index entry types need different knowledge bases:

**WordNet** (for common concepts):
- Subject index terms: "faith", "justice", "causation", "virtue"
- Conceptual language: nouns, adjectives, verbs with abstract meanings
- **Example**: "faith" → `oewn:faith.n.02` (belief in supernatural power) vs `oewn:faith.n.01` (confidence/trust)

**Wikidata** (for named entities):
- Author index: "Athanasius", "Thomas Aquinas", "Plantinga, Alvin"
- Historical events: "Council of Trent", "Reformation"
- Books/documents: "Summa Theologica", "De Trinitate"
- Places: "Alexandria", "Rome"
- **Example**: "Athanasius" → `wikidata:Q43115` (Bishop of Alexandria, 296-373)

**Custom** (for domain-specific terms):
- Technical theological terms without WordNet synsets
- Neologisms, specialized phrases
- Multiword expressions that don't fit either KB

### Heuristics for Candidate Selection

```typescript
const getCandidates = async ({ label, indexType, context }) => {
  // Rule 1: Index type hints
  if (indexType === 'author') {
    return await getWikidataCandidates(label, { type: 'person' });
  }
  
  if (indexType === 'scripture') {
    return await getWikidataCandidates(label, { type: 'religious_text' });
  }
  
  // Rule 2: Capitalization patterns
  const isTitleCase = /^[A-Z][a-z]+(?: [A-Z][a-z]+)*$/.test(label);
  const isAllCaps = /^[A-Z]+$/.test(label);
  
  if (isTitleCase || isAllCaps) {
    // Try Wikidata first (likely a named entity)
    const wikidataCandidates = await getWikidataCandidates(label);
    if (wikidataCandidates.length >= 3) {
      return wikidataCandidates;
    }
  }
  
  // Rule 3: Multi-word technical phrases
  const wordCount = label.split(/\s+/).length;
  if (wordCount >= 3) {
    // Likely a technical phrase or proper noun phrase
    const wikidataCandidates = await getWikidataCandidates(label);
    if (wikidataCandidates.length > 0) {
      return [...wikidataCandidates, { meaning_type: 'custom', meaning_id: null }];
    }
    return [{ meaning_type: 'custom', meaning_id: null }];
  }
  
  // Rule 4: Default to WordNet for common words
  const wordnetCandidates = await getWordNetCandidates(label);
  if (wordnetCandidates.length > 0) {
    return wordnetCandidates;
  }
  
  // Fallback: Try Wikidata, then custom
  const wikidataCandidates = await getWikidataCandidates(label);
  if (wikidataCandidates.length > 0) {
    return [...wikidataCandidates, { meaning_type: 'custom', meaning_id: null }];
  }
  
  return [{ meaning_type: 'custom', meaning_id: null }];
};
```

### Batch Disambiguation Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Get Candidates (local/fast)                             │
├─────────────────────────────────────────────────────────────┤
│ For each detected entry:                                    │
│ • Apply heuristics → get 5-8 candidates                     │
│ • Cache Wikidata results locally                            │
│ • WordNet queries are local (fast)                          │
│ Result: [{entry, context, candidates}]                      │
│ Time: ~10-20ms per entry = ~2-5s for 234 entries            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Batch LLM Disambiguation (10-30 entries/call)            │
├─────────────────────────────────────────────────────────────┤
│ Prompt:                                                     │
│ "For each item, select the best meaning candidate:          │
│  Item 1: faith (context: '...trust in divine revelation')   │
│    A) oewn:faith.n.01 - confidence in person or plan        │
│    B) oewn:faith.n.02 - belief in supernatural power ✓      │
│    C) custom - none fit                                      │
│                                                             │
│  Item 2: Athanasius (context: '...bishop of Alexandria')    │
│    A) wikidata:Q43115 - Bishop (296-373) ✓                 │
│    B) wikidata:Q123456 - Modern scholar                      │
│    C) custom - none fit"                                     │
│                                                             │
│ Output:                                                     │
│ [                                                           │
│   {itemId: 1, meaning_id: "oewn:faith.n.02", conf: 0.92},  │
│   {itemId: 2, meaning_id: "wikidata:Q43115", conf: 0.95}   │
│ ]                                                           │
│                                                             │
│ Time: ~8-12s per batch = ~2-3min for 234 entries (8 batches)│
│ Cost: ~$0.10-$0.20                                          │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Hard-Case Retry (confidence < 0.65)                      │
├─────────────────────────────────────────────────────────────┤
│ For ambiguous entries:                                      │
│ • Re-run individually with larger context window            │
│ • Provide more candidate details (full descriptions)        │
│ • Allow LLM to request "more context" if still unclear      │
│                                                             │
│ Example: "faith" in abstract philosophical discussion       │
│ → May need full paragraph, not just sentence                │
│                                                             │
│ Time: ~5-10s per entry = ~30s for ~5 hard cases            │
└─────────────────────────────────────────────────────────────┘
```

### Meaning Display in UI

**Entry Card (Review):**
```
┌─────────────────────────────────────────────────────────────┐
│ ☐ Faith                                                     │
│   [WordNet] Belief in supernatural power or control        │
│   Confidence: 89% (I:90/S:85) • 6 mentions                  │
│   [Change meaning...]                                        │
└─────────────────────────────────────────────────────────────┘
```

**Entry Card (Accepted):**
```
┌─────────────────────────────────────────────────────────────┐
│ ▼ Athanasius                                                │
│   [Wikidata] Bishop of Alexandria (296-373 AD)             │
│     • Life and writings                                      │
│     • Contra Arianos                                         │
└─────────────────────────────────────────────────────────────┘
```

Hover over badge → Show full gloss + link to WordNet/Wikidata entry.

## User Journey

### 1. **Upload PDF** (Epic 1)
User uploads manuscript PDF to project.

### 2. **Set Up Exclude Regions** (Epic 1, Phase 6)
User marks headers, footers, page numbers as exclude regions.

### 3. **Extract Text** (Task 1)
```
Project Settings → Text Extraction Panel
[Extract Text Button]

→ Progress: "Extracting text... 45/200 pages"
→ Completion: "Extracted 45,230 words (3,120 filtered by contexts)"
```

**What Happens:**
- PyMuPDF extracts text from each page
- Word-level bounding boxes captured (TextAtoms in memory)
- Text within exclude region bboxes filtered out
- Only `indexable_text` persisted per page
- `extraction_version` computed (hash of all `indexableText`)
- Takes ~1-2 minutes for 200-page book

### 4. **Configure Detection Settings** (Task 2)
```
Project Settings → Concept Detection Panel
[Run Detection Button]

→ Modal: Detection Settings
   • Select index types (Subject, Author, Scripture)
   • Choose LLM model (Claude 3.5 Sonnet)
   • Set min occurrences (Subject: 2, Author: 1)

→ Modal: Cost Estimate
   • Estimated cost: $0.50 - $0.70
   • Pass 1 (Detection): $0.40 - $0.60
   • Pass 2 (Meaning Resolution): $0.10 - $0.20
   • Pass 3 (Confidence Rating): $0.05 - $0.10 (optional)
   
   Note: Cost depends on concept density and model choice
   ☐ Don't show this warning again
   [Start Detection]
```

**What Happens:**
- User controls which index types to detect
- Sees cost estimate before starting (with variability note)
- Can enable optional confidence rating pass

### 5. **LLM Processing - Pass 1: Mention Detection** (Task 2)
```
Progress: "Detecting mentions... Page 12/200"

→ Background processing:
   - Sliding windows (each page processed once)
   - Stage A: LLM receives text-only with page markers
   - LLM returns char ranges + textQuote for each mention
   - Stage B: Re-extract TextAtoms for primary page
   - Map char ranges → TextAtoms → compute bboxes
   - Create IndexEntry + IndexMentions with isSuggestion=true
   - Store text_quote + char_range + bbox for reproducibility
```

**What Happens:**
- Takes ~8-12 minutes for 200-page book
- User can pause/resume or cancel
- Creates suggested entries with precise mentions
- Each mention has text_quote + char_range (reproducible)

### 6. **LLM Processing - Pass 2: Meaning Resolution** (Task 2)
```
Progress: "Resolving meanings... 123/234 entries"

→ Background processing:
   - For each entry, retrieve candidates (WordNet or Wikidata)
   - Batch disambiguation: 10-30 entries per LLM call
   - Hard-case retry: Re-run low-confidence individually
   - Update entries with meaning_type + meaning_id
```

**What Happens:**
- Takes ~2-3 minutes
- Every entry gets canonical meaning ID
- Prevents homonym collapse across runs

### 7. **LLM Processing - Pass 3: Confidence Rating** (Task 2, Optional)
```
Progress: "Rating suggestions... 123/234 entries"

→ Background processing:
   - Batch entries (term list only, no context)
   - LLM rates Indexability + Specificity
   - Update entries with confidence scores
```

**What Happens:**
- Takes ~1-2 minutes
- Only if user enabled confidence rating
- Allows filtering by quality in review UI

### 8. **Review Suggestions** (Task 3)
```
Two-Column Interface:

SUGGESTED ENTRIES (156)      |  →  |  ACCEPTED ENTRIES (89)
                              |  ←  |
                              |  🔗 |
                              | 🚫 |
☐ Divine Simplicity           |     |  ▼ Christology
  [WordNet] quality, state... |     |    ▸ Incarnation
  Confidence: 89% (I:90/S:85) |     |    ▸ Hypostatic Union
  6 mentions                  |     |
  [Change meaning...]         |     |  ▼ Soteriology
  ▼ Show mentions:            |     |    ▸ Atonement
    • Page 5: "doctrine..."   |     |
      [Accept] [Reject]       |     |  ▼ Trinity
    • Page 12: "critics..."   |     |    ▸ Persons
      [Accept] [Reject]       |     |
    ... 4 more                |     |
  [Accept All] [Reject] [Suppress]  |

[Select All] [Batch Accept]  |     |  [+ Create Entry]

Filters: [Confidence ▼] [Meaning ▼] [Pages ▼]
```

**Actions:**
- **Accept (→)**: Move suggestion to entries (sets `isSuggestion=false`)
- **Demote (←)**: Move entry back to suggestions (with validation warning)
- **Make Child (🔗)**: Accept suggestion as child of selected entry
- **Suppress (🚫)**: Add to `suppressed_suggestions` (never suggest again)
- **Change meaning**: Re-run disambiguation with different candidates
- **Batch operations**: Accept/reject/suppress multiple at once
- **Preview**: Click mention to see highlighted on PDF

**What Happens:**
- User reviews AI suggestions with canonical meanings
- Mentions flagged if `extraction_version` changed since detection
- High-confidence suggestions likely accurate
- Suppressed entries won't re-appear in future runs
- Accepted suggestions become real IndexEntries

### 9. **Re-Detection (Future Runs)**
```
User clicks "Run Detection" again

→ System checks:
   - Compare current extraction_version to previous runs
   - Query existing suggested entries
   - Check suppressed_suggestions table

→ For each new detected entry:
   - Primary merge key: meaning_id (if present)
   - Fallback merge key: normalized_label (for custom)
   - If match: Merge mentions (dedupe by page + text_quote + bbox_iou)
   - If suppressed: Skip (don't create)
   - If new: Create suggested entry
```

**What Happens:**
- Intelligent merging prevents duplicate suggestions
- Suppressed entries stay suppressed
- User only sees new suggestions

### 10. **Link Additional Mentions** (Epic 1)
User can manually highlight text in PDF → link to accepted entries (existing workflow).

### 11. **Export Index** (Epic 4)
Final index with accepted entries, meanings, hierarchy, and page numbers.

## Implementation Phases

### Phase 1: Text Extraction (Task 1) - 2-3 days
**Status:** Not Started  
**Priority:** P0 (Critical path)

**Deliverables:**
- [ ] PyMuPDF integration for word-level text extraction
- [ ] TextAtom in-memory structure (word, bbox, sequence, page)
- [ ] Ignore context filtering (mark `isIndexable=false`)
- [ ] Store only `indexable_text` per page (no TextAtom table)
- [ ] Store page dimensions for bbox conversion
- [ ] Compute `extraction_version` (hash of all `indexableText`)
- [ ] tRPC endpoints: `document.extractText`, `getExtractionStatus`
- [ ] UI: Extraction trigger button + progress indicator
- [ ] Bbox conversion utilities (PyMuPDF ↔ PDF.js)

**Checkpoint:** User can extract text from PDF, respecting exclude regions. TextAtoms can be re-extracted deterministically.

### Phase 2: Mention Detection (Task 2) - 6-7 days
**Status:** Not Started  
**Priority:** P0 (Critical path)

**Deliverables:**
- [ ] OpenRouter API client with rate limiting
- [ ] **Stage A**: Text-only prompt with explicit `pageText` + validation
- [ ] **Stage B**: Re-extract TextAtoms for primary page → map char ranges → bboxes
- [ ] Modular prompt system (composable per index type)
- [ ] Sliding window processing (primary page only)
- [ ] Create IndexEntry + IndexMentions with `text_quote` + `char_range` + `bbox`
- [ ] **Meaning resolution service**:
  - [ ] WordNet local DB setup + candidate retrieval
  - [ ] Wikidata API client + cache
  - [ ] Batch disambiguation (10-30 entries/call)
  - [ ] Hard-case retry (<0.65 confidence)
- [ ] Optional confidence rating pass (Indexability + Specificity)
- [ ] `detection_runs` table with `extraction_version`
- [ ] Cost estimation modal with variability note
- [ ] tRPC endpoints: `detection.start`, `detection.status`, `detection.rateConfidence`
- [ ] UI: Detection settings modal + progress tracking

**Checkpoint:** User can run detection, get suggested entries with canonical meanings and precise mentions.

### Phase 3a: UI Components - 3-4 days
**Status:** Not Started  
**Priority:** P0 (Critical path)  
**Parallelization:** ✅ Can run in parallel with Phase 2

**Deliverables (Frontend Only, Mock Data):**
- [ ] Two-column layout component with responsive design
- [ ] EntryCard component (selection, expand/collapse, actions)
- [ ] MentionCard component (page number, text preview, actions)
- [ ] MeaningBadge component (WordNet/Wikidata/Custom with tooltips)
- [ ] ConfidenceDisplay component (bar + breakdown)
- [ ] ActionButtons component (→, ←, 🔗, 🚫 with disabled states)
- [ ] FiltersPanel component (confidence, meaning type, search, validation status)
- [ ] Mock data generator matching Phase 2 schema
- [ ] Jotai atoms for state (selection, filters, expanded)
- [ ] Storybook documentation stories for all components
- [ ] Interaction tests for key workflows
- [ ] Visual design complete (spacing, colors, transitions)
- [ ] Empty states for both columns
- [ ] Loading states for async operations

**Checkpoint:** All UI components complete with Storybook docs, ready for backend integration.

### Phase 3b: Backend Integration - 1-2 days
**Status:** Not Started  
**Priority:** P0 (Critical path)  
**Parallelization:** ❌ Must wait for Phase 2 + Phase 3a

**Deliverables (Backend Integration):**
- [ ] Replace mock data with real tRPC queries:
  - [ ] `entry.listSuggestions` with filters
  - [ ] `entry.listAccepted` for accepted column
  - [ ] `detection.validateExtractionVersion` for warnings
- [ ] Implement mutations with optimistic updates:
  - [ ] `entry.acceptSuggestion` (flip `is_suggestion=false`)
  - [ ] `entry.rejectSuggestion` (soft delete)
  - [ ] `entry.suppressSuggestion` (add to `suppressed_suggestions`)
  - [ ] `mention.acceptSuggestion` (individual mention accept)
  - [ ] `mention.rejectSuggestion` (individual mention reject)
  - [ ] `entry.changeMeaning` (re-run disambiguation)
  - [ ] `entry.makeChild` (set parentId)
  - [ ] `entry.demoteEntry` (flip `is_suggestion=true`)
- [ ] Meaning resolution integration:
  - [ ] "Change meaning..." fetches candidates
  - [ ] Meaning picker modal with WordNet/Wikidata results
- [ ] PDF viewer integration:
  - [ ] Preview mention navigates to PDF viewer
  - [ ] Mention highlights render using stored bbox
- [ ] Extraction change detection:
  - [ ] Show warning banner if `extraction_version` mismatch
  - [ ] Flag mentions with `validation_status='needs_review'`
- [ ] Re-detection merge preview:
  - [ ] Show conflicts before re-running detection
- [ ] Error handling and rollback for failed mutations
- [ ] Toast notifications for user actions
- [ ] Batch operations (accept/reject/suppress multiple entries)

**Checkpoint:** User can review suggestions with meanings, accept/reject at entry or mention level, suppress unwanted entries.

### Phase 4: Optional Enhancements (Task 4) - 2-3 days
**Status:** Not Started  
**Priority:** P2 (Nice to have, post-MVP)

**Deliverables:**
- [ ] Fuzzy matching for similar entries
- [ ] Merge suggestions with confidence scores
- [ ] Hierarchy inference via pattern matching
- [ ] Quality metrics dashboard:
  - [ ] Coverage (% pages with suggestions)
  - [ ] Confidence distribution
  - [ ] Meaning resolution success rate
  - [ ] Suppression rate by index type

**Checkpoint:** Suggestions are automatically refined with fuzzy matching and hierarchy inference.

### Testing Strategy

**Unit Tests:**
- Text extraction with exclude regions
- TextAtom re-extraction determinism
- Stage A validation (textQuote substring check)
- Stage B char range mapping
- Meaning candidate retrieval (WordNet + Wikidata)
- Batch disambiguation logic
- Merge key logic (meaning_id vs normalized_label)
- Suppression checks
- Mention deduplication (bbox IoU)

**Integration Tests:**
- Full pipeline: Extract → Detect → Review → Accept
- Re-detection with existing suggestions (merge logic)
- Re-detection with suppressed entries (skip logic)
- Extraction change → validation_status flagging
- Cost estimation accuracy (actual vs estimated)

**Manual QA:**
- Test with real theological books (domain accuracy)
- Test with dense vs sparse documents (cost variability)
- Test WordNet coverage for common terms
- Test Wikidata coverage for proper nouns
- Test suppression persistence across runs
- Test extraction_version detection after exclude region changes

**Performance Tests:**
- Extraction: < 3min for 200-page book
- Detection Pass 1: < 15min for 200-page book
- Detection Pass 2: < 5min for 200-page book
- Detection Pass 3: < 3min for 200-page book (optional)
- Single-page TextAtom re-extraction: < 100ms

## Success Metrics

### Quantitative Targets

**Performance:**
- ✅ **Extraction Speed**: < 3 min for 200-page book
- ✅ **Detection Speed**: < 15 min for 200-page book (all 3 passes)
- ✅ **Cost Accuracy**: Estimated within 20% of actual
- ✅ **Single-page re-extraction**: < 100ms (Stage B)

**Quality:**
- 🎯 **Suggestion Acceptance Rate**: > 60% (user accepts > 60% of suggestions)
- 🎯 **False Positive Rate**: < 20% (< 20% are generic/irrelevant)
- 🎯 **Meaning Resolution Success**: > 80% (> 80% get wordnet/wikidata ID, not custom)
- 🎯 **Suppression Effectiveness**: 0% (suppressed entries never re-appear)

**Reliability:**
- ✅ **Reproducibility**: 100% (text_quote === indexableText[char_range])
- ✅ **Extraction Change Detection**: 100% (extraction_version mismatch → flagged)
- ✅ **Merge Accuracy**: > 95% (homonyms stay separate, same concepts merge)

### Qualitative Goals

**User Trust:**
- User trusts AI suggestions (canonical meanings provide confidence)
- User understands why suggestions were made (text_quote shows exact context)
- High confidence scores correlate with quality (if Pass 3 enabled)

**User Control:**
- User feels in control of costs (estimate + actual tracking + variability note)
- User can customize quality (confidence thresholds, min occurrences, suppression)
- User can correct mistakes (change meaning, demote, suppress)

**Workflow Efficiency:**
- Two-column UI feels intuitive (suggestions → entries flow)
- Batch operations save time (multi-select accept/reject/suppress)
- Re-detection is smart (merges by meaning_id, respects suppressions)
- Extraction changes are handled gracefully (validation_status flags affected mentions)

**Architecture Quality:**
- Reproducible mentions enable debugging (text_quote + char_range)
- Provenance enables audit trail (detection_runs + suggested_by_run_id)
- Deterministic merging prevents chaos (meaning_id as stable key)
- Extraction versioning prevents stale data (extraction_version comparison)

## Edge Cases & Error Handling

### Page-Boundary Mentions

**Problem**: Phrase spans page break (e.g., "divine sim-\nplicity" across pages 5-6).

**Option A (Recommended)**: Split into two mentions
```typescript
// LLM returns: {textQuote: "divine simplicity", pages: [5, 6]}
// Stage B processing:
if (mention.pages.length > 1) {
  // Create separate mention for each page
  for (const page of mention.pages) {
    const textOnPage = extractTextOnPage(mention.textQuote, page);
    const charRange = findCharRange(textOnPage, page);
    await createMention({ page, textQuote: textOnPage, charRange });
  }
}
```

**Option B (Strict)**: Reject cross-page mentions
```typescript
if (mention.pages.length > 1) {
  await logDiscardedMention({
    reason: 'spans_page_boundary',
    mention,
    action: 'rejected'
  });
}
```

**Configuration**: User setting per project: `page_boundary_handling: 'split' | 'reject'`

### Ambiguous Char Range Mapping

**Problem**: "faith" appears 3 times on page 5. LLM returned `{textQuote: "faith", charStart: 156}`, but extraction changed slightly.

**Solution**: Fuzzy match with context window
```typescript
const findBestMatch = ({ pageText, textQuote, expectedCharStart, contextWindow = 50 }) => {
  // Find all occurrences of textQuote
  const occurrences = findAllOccurrences(pageText, textQuote);
  
  if (occurrences.length === 1) {
    return occurrences[0]; // Unambiguous
  }
  
  // Find closest to expected position
  const closest = occurrences.reduce((best, curr) => {
    const dist = Math.abs(curr.charStart - expectedCharStart);
    return dist < best.dist ? { ...curr, dist } : best;
  }, { dist: Infinity });
  
  if (closest.dist < contextWindow) {
    return closest;
  }
  
  // Still ambiguous → ask LLM with TextAtoms for this page
  return await resolveMentionWithLLM({ pageText, textQuote, occurrences });
};
```

### Extraction Changes After Detection

**Problem**: User adds new exclude region → `indexable_text` changes → `char_range` no longer valid.

**Detection**:
```sql
-- Find mentions with invalid char_ranges
SELECT m.*, p.indexable_text
FROM index_mentions m
JOIN document_pages p ON p.page_number = m.page_number AND p.document_id = m.document_id
WHERE m.deleted_at IS NULL
  AND substring(p.indexable_text FROM lower(m.char_range) FOR upper(m.char_range) - lower(m.char_range)) != m.text_quote;
```

**Resolution Options**:
1. **Warn in review UI**: "This mention may overlap ignored text. Verify on PDF."
2. **Auto-flag**: Set `mention.validation_status = 'needs_review'`
3. **Auto-suppress**: If `ignore_context.auto_action = 'auto_suppress'`, soft-delete mention

### LLM Returns Invalid JSON

**Handling**:
```typescript
try {
  const result = JSON.parse(llmResponse);
  validateSchema(result, mentionDetectionSchema);
  return result;
} catch (error) {
  // Attempt 1: Ask LLM to repair
  const repairPrompt = `
    The following JSON is invalid: ${llmResponse}
    Error: ${error.message}
    Please return a corrected version.
  `;
  const repairedResponse = await llm.call(repairPrompt);
  
  try {
    return JSON.parse(repairedResponse);
  } catch {
    // Attempt 2: Partial recovery
    const partialResults = extractValidItems(llmResponse);
    if (partialResults.length > 0) {
      await logPartialFailure({ original: llmResponse, recovered: partialResults });
      return partialResults;
    }
    
    // Failure: Log and skip this window
    await logDetectionFailure({ window, error, response: llmResponse });
    throw new Error(`Could not parse LLM response for window ${window.id}`);
  }
}
```

### Detection Job Interrupted

**Resumability**:
```typescript
const resumeDetectionRun = async ({ runId }) => {
  const run = await db.detectionRuns.findUnique({ where: { id: runId } });
  
  if (run.status !== 'running') {
    throw new Error(`Cannot resume run with status: ${run.status}`);
  }
  
  // Resume from last completed page
  const startPage = run.progress_page + 1;
  const windows = createSlidingWindows({ 
    pages: project.pages.slice(startPage), 
    windowSize: 3 
  });
  
  await processWindows({ windows, runId });
  
  await db.detectionRuns.update({
    where: { id: runId },
    data: { 
      status: 'completed', 
      finished_at: new Date(),
      entries_created: await countEntriesForRun(runId),
      mentions_created: await countMentionsForRun(runId)
    }
  });
};
```

### No Indexable Text Found

**Early abort**:
```typescript
const startDetection = async ({ projectId, indexTypes }) => {
  const pages = await getDocumentPages(projectId);
  
  const totalIndexableChars = pages.reduce(
    (sum, p) => sum + (p.indexableText?.length ?? 0), 
    0
  );
  
  if (totalIndexableChars < 100) {
    throw new UserError({
      code: 'NO_INDEXABLE_TEXT',
      message: 'No indexable text found. Check exclude regions or document content.',
      actions: [
        { label: 'Review exclude regions', href: '/contexts' },
        { label: 'Re-extract text', action: 'reExtract' }
      ]
    });
  }
  
  // Proceed with detection...
};
```

### Meaning Disambiguation Fails

**Fallback to custom**:
```typescript
const resolveMeaning = async ({ label, context, candidates }) => {
  try {
    const result = await llm.disambiguate({ label, context, candidates });
    
    if (result.confidence < 0.50) {
      // Very low confidence → fallback to custom
      return { 
        meaning_type: 'custom', 
        meaning_id: null, 
        meaning_confidence: 0.0,
        meaning_source: 'llm_fallback'
      };
    }
    
    return result;
  } catch (error) {
    // LLM call failed → fallback to custom
    await logMeaningResolutionFailure({ label, error });
    return { 
      meaning_type: 'custom', 
      meaning_id: null, 
      meaning_confidence: 0.0,
      meaning_source: 'error_fallback'
    };
  }
};
```

## Key Features

### Core Capabilities
- **Reproducible Mention Detection**: Every mention stores `text_quote` + `char_range` for reconstruction
- **Two-Stage Detection**: Text-only prompts (Stage A) + local mapping (Stage B) = 60% cost savings
- **Canonical Meanings**: WordNet/Wikidata IDs prevent homonym collapse and enable stable merging
- **Context-Aware Extraction**: Respects exclude regions with configurable auto-actions
- **Multi-Index Type Support**: Separate detection for Subject, Author, Scripture, etc.
- **Sliding Window Context**: Cross-page understanding without duplicate mentions

### Intelligence
- **Batch Disambiguation**: 10-30 entries per LLM call with hard-case retry
- **Smart Merge Keys**: `meaning_id` primary, `normalized_label` fallback, bbox IoU deduplication
- **Suppression Rules**: Rejected entries never re-appear in future runs
- **Provenance Tracking**: Full audit trail (which run, model, settings created each entry)

### User Experience
- **Two-Column Review UI**: Suggested vs. accepted entries with mention-level controls
- **Meaning Display**: Show canonical meaning with gloss tooltip + "Change meaning..." action
- **Cost Transparency**: Accurate estimation + tracking for 3 optional passes
- **Resumable Jobs**: Detection survives failures, deploys, and cancellations
- **Optional Confidence Rating**: Pay extra ($0.05-$0.10) to filter low-quality suggestions

### Production-Ready
- **Edge Case Handling**: Page-boundary mentions, ambiguous mappings, extraction changes
- **Validation**: Check if `char_range` still valid after exclude region updates
- **Error Recovery**: Partial JSON parsing, LLM repair attempts, graceful fallbacks
- **Performance**: 12-18 min end-to-end for 200-page book ($0.50-$0.70 baseline)

## Tasks

### Task 1: Text Extraction ([task-1-text-extraction.md](./task-1-text-extraction.md))
**Status:** ⚪ Not Started  
**Duration:** 2-3 days  
**Priority:** P0 (Critical path)

Extract text from PDF using PyMuPDF, create TextAtoms in memory, filter by exclude regions, prepare for LLM processing.

**Key Deliverables:**
- Python service with PyMuPDF integration
- In-memory TextAtom extraction (word, bbox, sequence, page)
- Context-aware filtering (mark `isIndexable` based on exclude regions)
- Store only `indexableText` per page (for re-filtering without re-extraction)
- Store page dimensions for bbox conversion
- API: `document.extractText`, `getExtractionStatus`

**Database Schema:**
- Extend `document_pages`: add `indexable_text`, `dimensions` (no TextAtom table)
- Add `extraction_status` enum to `projects` table
- **No TextAtom persistence** (ephemeral, in-memory only)

**Note:** TextAtoms are created during detection, sent to LLM, then discarded. Only final IndexMentions with bboxes are persisted.

### Task 2: Mention Detection & Meaning Resolution ([task-2-llm-integration.md](./task-2-llm-integration.md))
**Status:** ⚪ Not Started  
**Duration:** 6-7 days  
**Priority:** P0 (Critical path)

Two-stage mention detection with canonical meaning resolution using OpenRouter, WordNet, and Wikidata.

**Key Deliverables:**
- OpenRouter API client with rate limiting
- **Stage A**: Text-only prompt (with page markers) → char ranges/quoted mentions
- **Stage B**: Local char range → TextAtom mapping → bbox computation
- Modular prompt system (composable per index type)
- Sliding window processing (context only, no overlap mentions)
- **Meaning resolution service**: WordNet + Wikidata candidate retrieval
- **Batch disambiguation**: 10-30 entries per LLM call
- **Hard-case retry**: Low-confidence (<0.65) entries re-run individually
- Create IndexEntry (with meaning_id) + IndexMentions (with text_quote/char_range)
- Cost estimation modal (before starting)
- Optional Pass 3: Confidence rating (Indexability + Specificity)
- API: `detection.start`, `detection.status`, `detection.rateConfidence`, `meaning.resolve`

**Database Schema:**
- New `detection_runs` table (job state, settings, model, prompt version)
- New `suppressed_suggestions` table (rejected entries by meaning_id/label)
- Extend `index_entries`:
  - `is_suggestion` boolean
  - `suggestion_status` enum (suggested/accepted/rejected/suppressed)
  - `suggested_by_run_id` uuid (nullable)
  - `created_source` enum (llm/user/import)
  - `meaning_type` text (wordnet/wikidata/custom)
  - `meaning_id` text (e.g., "oewn:faith.n.01", "wikidata:Q43115")
  - `meaning_confidence` numeric (0-1)
  - `meaning_source` enum (llm/user)
  - `meaning_gloss` text (cached display text)
  - `normalized_label` text (for merge keys)
  - `indexability`, `specificity`, `overall_confidence` (nullable, if rated)
- Extend `index_mentions`:
  - `is_suggestion` boolean
  - `suggested_by_run_id` uuid (nullable)
  - `text_quote` text (exact matched string)
  - `char_range` int4range (start/end in indexable_text)
  - `validation_status` text (valid | needs_review | invalid, for extraction changes)

**Stage A Prompt (Text-Only with Validation):**
```
You will receive pages as structured objects with explicit text:

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
  ]
}

For each index entry you identify, return:
- label (the index term)
- pageNumber (which page it appears on)
- textQuote (MUST be an exact substring of pageText)
- charStart (0-indexed position where textQuote starts in pageText)
- charEnd (0-indexed position where textQuote ends in pageText)

CRITICAL: Validate that pageText.substring(charStart, charEnd) === textQuote
If you cannot find an exact substring match, skip that mention.
```

**Post-Processing Validation:**
```typescript
const validateMention = ({ pageText, mention }) => {
  const extracted = pageText.substring(mention.charStart, mention.charEnd);
  
  if (extracted !== mention.textQuote) {
    // Invalid mention - re-request with stricter prompt
    throw new ValidationError({
      code: 'CHAR_RANGE_MISMATCH',
      expected: mention.textQuote,
      found: extracted,
      mention
    });
  }
  
  return mention;
};

// If validation fails for multiple mentions in a window, retry:
const retryPrompt = `
Previous response had invalid char ranges. 
Return ONLY mentions where textQuote is an EXACT substring of pageText.
Skip any ambiguous or uncertain mentions.
`;
```

**Stage A Output:**
```json
{
  "entries": [
    {
      "label": "divine simplicity",
      "indexType": "subject",
      "mentions": [
        {"page": 5, "textQuote": "divine simplicity", "charStart": 16, "charEnd": 33},
        {"page": 6, "textQuote": "divine simplicity", "charStart": 11, "charEnd": 28}
      ]
    }
  ]
}
```

**Meaning Disambiguation (Batch):**
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
    }
  ]
}
```

**Disambiguation Output:**
```json
{
  "results": [
    {
      "itemId": "entry_1",
      "meaning_type": "wordnet",
      "meaning_id": "oewn:faith.n.02",
      "confidence": 0.92,
      "reason_code": "clear_match"
    }
  ]
}
```

### Phase 3: Mention Review UI
**Status:** ⚪ Not Started  
**Duration:** 4-5 days total (3a + 3b)  
**Priority:** P0 (Critical path)

Two-column interface for reviewing suggested IndexEntries and their IndexMentions, accepting/rejecting at both levels.

**Split into sub-phases for parallelization:**
- **[Phase 3a: UI Components](./phase-3-mention-review/phase-3a-ui-components.md)** (3-4 days) - Can run parallel with Phase 2
- **[Phase 3b: Backend Integration](./phase-3-mention-review/phase-3b-backend-integration.md)** (1-2 days) - After Phase 2

**Key Deliverables:**
- Two-column layout: Suggested Entries (left) ↔ Accepted Entries (right)
- Expandable entry cards showing all suggested mentions for that entry
- Mention-level review: accept/reject individual mentions
- Entry-level review: accept all mentions or reject entry entirely
- Action buttons: `→` Accept, `←` Demote, `🔗` Make Child
- Filtering by confidence (if rated), mention count, search
- PDF preview highlights all mentions for selected entry
- Merge old/new suggestions on re-detection
- API: `entry.acceptSuggestion`, `entry.rejectSuggestion`, `mention.acceptSuggestion`, `mention.rejectSuggestion`

**UI Components:**
- EntryCard (with expandable mention list)
- MentionCard (page number, text preview, accept/reject)
- Confidence indicators (if Pass 2 was run)
- Batch operations (accept all mentions, reject low-confidence)

### Task 4: Optional Enhancements ([task-4-post-processing.md](./task-4-post-processing.md))
**Status:** ⚪ Not Started  
**Duration:** 2-3 days  
**Priority:** P2 (Nice to have, post-MVP)

Optional refinements for power users: fuzzy matching, hierarchy inference, quality metrics.

**Key Deliverables:**
- Fuzzy matching for similar entries (e.g., "soteriology" vs "doctrine of salvation")
- Suggest merges with confidence scores
- Hierarchy inference via pattern matching:
  - "X doctrine" → child of "X"
  - "X, Y" (appositive) → Y is parent
  - Capitalization patterns (specific → general)
- Quality metrics dashboard:
  - Coverage (% of pages with suggestions)
  - Confidence distribution
  - Meaning resolution success rate
  - Suppression rate by index type

**Note:** Canonical meaning IDs (WordNet/Wikidata) are in **Task 2 (MVP)**, not Task 4.

## Success Criteria

### Task 1: Text Extraction
- [ ] PyMuPDF extracts TextAtoms in memory (word, bbox, sequence, page)
- [ ] TextAtom extraction is deterministic (same `indexableText` → same atoms)
- [ ] Ignore contexts filter TextAtoms (`isIndexable=false` if within ignore bbox)
- [ ] Ignored pages skipped entirely (not included in TextAtoms)
- [ ] Only `indexableText` persisted per page (for re-filtering + Stage B re-extraction)
- [ ] Page dimensions stored in `document_pages.dimensions`
- [ ] `extraction_version` computed as hash of all `indexableText`
- [ ] User can trigger extraction manually with progress indicator
- [ ] Extraction completes in < 3min for 200-page book
- [ ] Bbox conversion utilities created (PyMuPDF ↔ PDF.js)
- [ ] TextAtom re-extraction for single page takes < 100ms

### Task 2: Mention Detection & Meaning Resolution
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

### Phase 3a: UI Components (Parallel with Phase 2)
- [ ] Two-column layout component with mock data
- [ ] EntryCard component complete (all states)
- [ ] MentionCard component complete (validation badges)
- [ ] MeaningBadge component (WordNet/Wikidata/Custom)
- [ ] ConfidenceDisplay component (bar + breakdown)
- [ ] ActionButtons component (disabled states)
- [ ] FiltersPanel component (all filter types)
- [ ] Mock data generator (matches Phase 2 schema)
- [ ] Jotai atoms for state management
- [ ] Storybook stories for all components
- [ ] Interaction tests for workflows
- [ ] Visual design complete

### Phase 3b: Backend Integration (After Phase 2)
- [ ] Real tRPC queries replace mock data
- [ ] Accept/reject/suppress mutations with optimistic updates
- [ ] "Change meaning..." action integrated
- [ ] PDF preview highlights mentions (from bbox)
- [ ] Extraction change warning (version mismatch)
- [ ] Mentions with `validation_status='needs_review'` flagged
- [ ] Re-detection merging works:
  - [ ] Primary key: `meaning_id`
  - [ ] Fallback key: `normalized_label + meaning_type`
  - [ ] Mention deduplication: `page + text_quote + bbox_iou > 0.8`
  - [ ] Suppression check before creating
- [ ] Batch operations work
- [ ] Validation: can't make child across index types
- [ ] Error handling + rollback
- [ ] Toast notifications

### Phase 4: Optional Enhancements
- [ ] Fuzzy matching suggests merges for similar entries
- [ ] Hierarchy inference suggests parent-child relationships
- [ ] Optional: WordNet/Wikidata sense ID assignment
- [ ] Homonym disambiguation suggestions
- [ ] Quality metrics dashboard

### Overall Epic Success
- [ ] User extracts text respecting exclude regions and ignored pages
- [ ] `extraction_version` computed and stored for validation
- [ ] User manually initiates detection with cost warning (including variability note)
- [ ] **Pass 1**: AI detects mentions with validated char ranges (text-only, cheap)
  - [ ] Stage A validates `textQuote` is exact substring of `pageText`
  - [ ] Stage B re-extracts TextAtoms for primary page (deterministic)
- [ ] **Pass 2**: AI resolves canonical meanings (WordNet/Wikidata)
  - [ ] Every entry gets `meaning_type` (required)
  - [ ] `meaning_id` required for wordnet/wikidata, null for custom
- [ ] **Pass 3** (optional): AI rates confidence (Indexability/Specificity)
- [ ] Every mention is reproducible: `text_quote` + `char_range` → exact text
- [ ] Every entry has stable merge key: `meaning_id` or `normalized_label`
- [ ] User reviews suggested entries (with meanings) AND mentions
- [ ] Mentions render on PDF at exact positions (from bbox)
- [ ] Mentions flagged if extraction changed (`validation_status='needs_review'`)
- [ ] User accepts/rejects/suppresses at entry or mention level
- [ ] Suppression rules support `scope` + `suppression_mode`
- [ ] Suppressed entries don't re-appear in future runs
- [ ] Re-detection merges intelligently:
  - Primary: `(meaning_type, meaning_id)` when `meaning_id IS NOT NULL`
  - Fallback: `(normalized_label, meaning_type)` for custom
  - Dedupe: mentions by `page + text_quote + bbox_iou > 0.8`
  - Suppression: check before creating entries
- [ ] `detection_runs` table provides audit trail + `extraction_version` + resumability
- [ ] Full workflow: Extract → Detect (validate) → Resolve Meanings → (Rate) → Review → Accept → Indexed Document

## Technical Notes

### Text Extraction (Phase 1)
- **PyMuPDF over PDF.js**: More reliable extraction, better bbox support, industry standard
- **TextAtoms are ephemeral**: Created in memory during detection, then discarded (not persisted)
- **Store indexable text only**: Allows re-filtering when exclude regions change (no re-extraction needed)
- **Page dimensions stored**: Required for PyMuPDF ↔ PDF.js bbox conversion
- **Two-stage ignore filtering**:
  - Pre-extraction: Mark TextAtoms `isIndexable=false` if within ignore bbox
  - Post-acceptance: Warn if accepted mention overlaps exclude region
- **Ignored pages skipped**: Don't create TextAtoms, don't include in sliding windows

### Mention Detection (Phase 2)
- **OpenRouter for MVP**: Single API for multiple providers, transparent pricing, no vendor lock-in
- **Two-stage detection (cost-optimized)**:
  - **Stage A**: Text-only prompt with explicit `pageText` field → char ranges + `textQuote` validation (~60% cheaper)
  - **Stage B**: Re-extract TextAtoms for primary page via PyMuPDF → map char range → compute bbox
  - TextAtom re-extraction is deterministic (same `indexable_text` → same atoms)
  - Invalid case: `textQuote` not substring of `pageText` → retry with stricter prompt
- **Sliding windows for context**: Each page indexed once (when it's primary page)
- **No overlap mentions**: Surrounding pages provide context, not additional mentions
- **Page-boundary handling**: Mentions spanning page breaks either split or rejected (configurable)
- **Immediate IndexMention creation**: Store bbox + `text_quote` + `char_range` for reproducibility
- **Meaning resolution**:
  - Candidate retrieval: WordNet for concepts, Wikidata for entities
  - Batch disambiguation: 10-30 entries per call
  - Hard-case retry: Low-confidence (<0.65) re-run individually
  - Result: `meaning_type` + `meaning_id` on every entry
- **Three-pass approach**:
  - Pass 1: Mention detection (required) - $0.40-$0.60 (text-only)
  - Pass 2: Meaning resolution (required) - $0.10-$0.20 (batch disambiguation)
  - Pass 3: Confidence rating (optional) - $0.05-$0.10 (term-list only)

### Schema Simplification
- **No separate suggestion tables**: Just add `is_suggestion` boolean to existing tables
- **Minimal job persistence**: Single `detection_runs` table (not separate tables per job phase)
- **Suggested entities filtered by queries**: `WHERE is_suggestion = false` for main index
- **Project:Document is 1:1**: One project = one PDF (multi-document is post-MVP)

### Mention Review (Phase 3a + 3b)
- **Phase 3a (UI Components)**: Build all components with mock data in parallel with Phase 2
  - Two-column layout skeleton
  - EntryCard, MentionCard, MeaningBadge components
  - Filters, action buttons, state management
  - Storybook stories + interaction tests
- **Phase 3b (Backend Integration)**: Wire up real data and mutations after Phase 2
  - Replace mock data with tRPC queries
  - Implement accept/reject/suppress mutations
  - PDF preview with bbox highlighting
  - Extraction change detection
  - Re-detection merging with `meaning_id`
  - Suppression rules enforcement
  - Batch operations

### Optional Enhancements (Phase 4)
- **Fuzzy matching**: Suggest merges for similar terms (user decides)
- **Hierarchy inference**: Pattern-based parent-child suggestions
- **Semantic IDs**: Optional WordNet/Wikidata sense IDs for meaning precision
- **No deduplication**: Not needed (sliding windows don't create duplicates)

### Performance Expectations
- **Extraction**: ~0.3s per page = ~1-2 min for 200-page book (in-memory only)
- **Pass 1 - Detection**: ~8-12 min for 200-page book (text-only prompts)
- **Pass 2 - Meaning resolution**: ~2-3 min (batch disambiguation)
- **Pass 3 - Confidence rating** (if enabled): ~1-2 min (term list only)
- **Total workflow**: ~12-18 min from upload to reviewed mentions
- **Cost savings**: ~60% cheaper than full TextAtom payloads ($0.50-$0.70 vs $0.90-$1.10)

**Cost variability note**: Actual costs depend on:
- Density of indexable concepts (philosophical theology has more concepts per page than narrative)
- Chosen model (Claude 3.5 Sonnet vs GPT-4 Turbo)
- Number of index types selected
- Document complexity (technical terms may need more disambiguation)

A dense theological text might cost $0.80-$1.00 vs $0.50-$0.60 for sparse content.

## Workflow Diagram

### Complete Detection Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. USER SETUP                                                   │
├─────────────────────────────────────────────────────────────────┤
│ • Upload PDF (Epic 1)                                           │
│ • Configure index types (Subject, Author, Scripture)            │
│ • Mark exclude regions (headers, footers)                       │
│ • Mark ignored pages (title pages, TOC)                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. TEXT EXTRACTION (Task 1)                                     │
├─────────────────────────────────────────────────────────────────┤
│ PyMuPDF extracts text:                                          │
│ • For each page (except ignored):                               │
│   → Extract word-level TextAtoms (word, bbox, sequence)         │
│   → Filter by exclude region bboxes → mark isIndexable         │
│   → Store indexableText per page                                │
│   → Store page dimensions                                       │
│ • TextAtoms kept in memory (not persisted)                      │
│ • Time: ~1-2 min for 200 pages                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. MENTION DETECTION - Pass 1 (Task 2)                          │
├─────────────────────────────────────────────────────────────────┤
│ User clicks "Detect Concepts" → Settings modal:                 │
│ • Select index types (Subject ✓, Author ✓)                     │
│ • Set min occurrences (Subject: 2, Author: 1)                   │
│ • Choose model (Claude 3.5 Sonnet)                              │
│ • See cost estimate: $0.50 - $0.70                              │
│ • Start detection                                               │
│                                                                 │
│ System creates detection_run record (status: 'running')         │
│                                                                 │
│ System creates sliding windows:                                 │
│ • Window 1 (Primary: Page 1, Context: Pages 2-3)                │
│ • Window 2 (Primary: Page 2, Context: Pages 1,3-4)             │
│ • Window 3 (Primary: Page 3, Context: Pages 2,4-5)             │
│                                                                 │
│ For each window:                                                │
│ • Build text-only prompt with page markers: "--- Page N ---"    │
│ • Call OpenRouter API (Stage A)                                 │
│ • LLM returns: {label, mentions: [{page, textQuote, charStart}]}│
│ • For primary page only:                                        │
│   → Stage B: Map charStart/charEnd to TextAtoms → compute bbox │
│   → Create IndexEntry (isSuggestion=true, no meaning yet)      │
│   → Create IndexMentions (textQuote + charRange + bbox)        │
│                                                                 │
│ Result: IndexEntries + IndexMentions (all with isSuggestion=true)│
│ Time: ~8-12 min for 200 pages                                   │
│ Cost: $0.40 - $0.60 (60% cheaper with text-only!)               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. MEANING RESOLUTION - Pass 2 (Task 2)                         │
├─────────────────────────────────────────────────────────────────┤
│ System automatically continues (no user action needed):         │
│ • Extract all suggested entry labels (234 entries)              │
│                                                                 │
│ For each entry, get candidates:                                 │
│ • If Title Case → Query Wikidata API (top 5 entities)          │
│ • Else → Query local WordNet DB (top 8 synsets)                 │
│                                                                 │
│ Batch disambiguation (10-30 entries per call):                  │
│ • Batch 1: Entries 1-30 → Pick meaning_id for each             │
│ • Batch 2: Entries 31-60 → Pick meaning_id                      │
│ • ...                                                            │
│ • Batch 8: Entries 211-234 → Pick meaning_id                    │
│                                                                 │
│ Hard-case retry (confidence < 0.65):                            │
│ • Re-run ambiguous entries individually with more context       │
│                                                                 │
│ Update index_entries with meaning_type/meaning_id/confidence    │
│                                                                 │
│ Result: All entries have canonical meaning IDs                  │
│ Time: ~2-3 min                                                  │
│ Cost: $0.10 - $0.20                                             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. CONFIDENCE RATING - Pass 3 (Task 2, Optional)                │
├─────────────────────────────────────────────────────────────────┤
│ User clicks "Rate Suggestions" → Modal:                         │
│ • Shows count: 234 suggested entries                            │
│ • Cost estimate: $0.05 - $0.10                                  │
│ • Start rating                                                  │
│                                                                 │
│ System batches terms (term list only, no context):              │
│ • Batch 1: Terms 1-100 → Rate Indexability + Specificity       │
│ • Batch 2: Terms 101-200 → Rate                                 │
│ • Batch 3: Terms 201-234 → Rate                                 │
│ • Update index_entries with confidence scores                   │
│                                                                 │
│ Result: Suggestions now have confidence scores for filtering    │
│ Time: ~1-2 min                                                  │
│ Cost: $0.05 - $0.10                                             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. REVIEW SUGGESTIONS (Task 3)                                  │
├─────────────────────────────────────────────────────────────────┤
│ Two-column interface:                                           │
│                                                                 │
│ SUGGESTED ENTRIES          |  →  |  ACCEPTED ENTRIES            │
│ (is_suggestion=true)       |  ←  |  (is_suggestion=false)       │
│                            |  🔗 |                              │
│                            | 🚫 |                              │
│ ☐ Divine Simplicity        |     |  ▼ Christology              │
│   [WordNet] quality...     |     |    ▸ Incarnation            │
│   Confidence: 89% (I:90/S:85)     |    ▸ Hypostatic Union       │
│   6 mentions                |     |                             │
│   [Change meaning...]       |     |  ▼ Soteriology              │
│   ▼ Show mentions:          |     |    ▸ Atonement              │
│     • Page 5: "doctrine..." |     |                             │
│       [Accept] [Reject]     |     |                             │
│     • Page 12: "critics..." |     |                             │
│       [Accept] [Reject]     |     |                             │
│     ... 4 more              |     |                             │
│   [Accept All] [Reject] [Suppress]  |                             │
│                            |     |                             │
│ User actions:                                                   │
│ • Accept entry → All mentions flip isSuggestion=false          │
│   → status='accepted', entry appears in main index              │
│ • Accept specific mentions → Only those flip                    │
│ • Reject entry → status='rejected', soft delete                 │
│ • Suppress entry → status='suppressed', add to suppression table│
│   → Won't re-appear in future detection runs                    │
│ • Make child → Set parentId on accepted entry                   │
│ • Demote entry → Flip isSuggestion back to true                │
│ • Change meaning → Re-run disambiguation with new candidates    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7. INDEXED DOCUMENT                                             │
├─────────────────────────────────────────────────────────────────┤
│ • Accepted entries appear in main index tree with meanings      │
│ • Accepted mentions render as highlights on PDF (from bbox)     │
│ • User can manually add more mentions (Epic 1 workflow)         │
│ • User can edit entry labels (meaning stays stable)             │
│ • User can change meaning if wrong (re-run disambiguation)      │
│ • Suppressed entries won't re-appear in future runs             │
│ • detection_run record shows: model, cost, entries created      │
│ • Ready for export (Epic 4)                                     │
└─────────────────────────────────────────────────────────────────┘
```

## Common Questions

### Why store text_quote + char_range on every mention?

**Answer:** **Reproducibility is critical for trust and debugging.**
- User asks "why did LLM highlight this?" → We can show exact `indexable_text` slice
- Re-detection merging needs stable keys → `text_quote` provides that (not bbox, which can shift)
- Extraction changes → We can validate mentions against new extraction
- Cost: ~20 bytes per mention (tiny compared to value)

**Invariant**: Every mention is reconstructible from `indexable_text[char_range]`

### How do meaning IDs prevent homonym collapse?

**Answer:** **Canonical IDs make merge keys deterministic.**

Without meaning IDs:
- Run 1: LLM creates "Bank (financial institution)"
- Run 2: LLM creates "Bank (river)" 
- System merges them (same label `"bank"`) → Wrong!

With meaning IDs:
- Run 1: `meaning_id = "wikidata:Q22687"` (financial institution)
- Run 2: `meaning_id = "wikidata:Q4022"` (river bank)
- System keeps them separate → Correct!

Merge key becomes: `(project_id, index_type, meaning_id)` → No homonym collisions.

### What if exclude regions change after detection?

**Answer:** **Reproducibility + extraction versioning enables re-validation.**

1. **During extraction**: Re-compute `indexableText` from raw PDF + new contexts
2. **Compute new extraction version**: Hash of all `indexableText` concatenated
3. **Compare to detection run's extraction_version**: 
   ```typescript
   const currentVersion = await computeExtractionVersion({ projectId });
   const run = await getDetectionRun({ runId });
   
   if (run.extraction_version !== currentVersion) {
     // Extraction changed since this run
     await flagMentionsForReview({ runId });
   }
   ```
4. **Validate affected mentions**: Check if `char_range` still maps to valid (non-ignored) text
5. **Flag invalid mentions**: Show warning in review UI ("This mention now overlaps ignored text")
6. **User options**: Keep mention, delete mention, or re-run detection

### How do we handle re-detection intelligently?

**Answer:** **Meaning-based merging with mention deduplication.**

```typescript
// For each new detected entry:

// Step 1: Try to find existing entry by meaning (if meaning_id present)
let existing;
if (newEntry.meaning_id) {
  existing = await db.indexEntries.findFirst({
    where: {
      project_id: projectId,
      index_type: newEntry.indexType,
      meaning_type: newEntry.meaningType,
      meaning_id: newEntry.meaningId,
      deleted_at: null  // checks both suggestions AND accepted
    }
  });
}

// Step 2: Fallback to label match (if meaning_type='custom')
if (!existing && newEntry.meaningType === 'custom') {
  existing = await db.indexEntries.findFirst({
    where: {
      project_id: projectId,
      index_type: newEntry.indexType,
      normalized_label: normalize(newEntry.label),
      meaning_type: 'custom',
      deleted_at: null
    }
  });
}

if (existing) {
  // Step 3: Merge mentions, dedupe by: page + text_quote + bbox_iou > 0.8
  await mergeMentions({ entryId: existing.id, newMentions });
} else {
  // Step 4: Check suppression rules
  const suppressed = await db.suppressedSuggestions.findFirst({
    where: {
      project_id: projectId,
      index_type: newEntry.indexType,
      scope: 'project',
      OR: [
        // Check by meaning_id if present
        newEntry.meaning_id ? {
          meaning_type: newEntry.meaningType,
          meaning_id: newEntry.meaningId
        } : null,
        // Check by label if custom
        newEntry.meaningType === 'custom' ? {
          meaning_type: 'custom',
          normalized_label: normalize(newEntry.label)
        } : null
      ].filter(Boolean)
    }
  });
  
  if (!suppressed || suppressed.suppression_mode !== 'block_suggestion') {
    // Step 5: Create new suggested entry
    await createEntry({ entry: newEntry, mentions: newMentions });
  } else {
    // Skipped: suppressed by user
    await logSuppression({ entry: newEntry, suppressionRule: suppressed });
  }
}
```

### Can detection run in parallel with other work?

**Answer:** **Yes, with `detection_runs` table for coordination.**
- Allow 1 active run per project (status = 'running')
- If run active: Queue new run (status = 'queued')
- Different projects run in parallel
- Jobs table enables:
  - Pause/resume (track `progress_page`)
  - Cancellation (update status to 'cancelled')
  - Audit trail (which run created which entries)
  - Resumability across deploys (jobs persist in DB)

### What happens if detection finds no indexable text?

**Answer:** **Abort early, don't incur cost.**
```typescript
const totalIndexableChars = pages.reduce(
  (sum, p) => sum + p.indexableText.length, 0
);

if (totalIndexableChars < 100) {
  throw new Error(
    "No indexable text found. Check exclude regions or document content."
  );
}
```

### Why three passes instead of two?

**Answer:** **Unbundled cost = user control.**
- **Pass 1** (required): Mention detection - $0.40-$0.60 (text-only, cheap!)
- **Pass 2** (required): Meaning resolution - $0.10-$0.20 (batch disambiguation)
- **Pass 3** (optional): Confidence rating - $0.05-$0.10 (term-list only)

**Total**: $0.50-$0.80 baseline, $0.90 with confidence.
**Savings**: Text-only prompts are ~60% cheaper than sending full TextAtom payloads.

User who doesn't need confidence scores saves ~10%.
User who doesn't need canonicalization could skip Pass 2 (but we recommend it for MVP).

### How does Stage B (local mapping) work?

**Answer:** **Re-extract TextAtoms for the primary page, then map char ranges.**

```typescript
// Stage A returned: {pageNumber: 5, textQuote: "divine simplicity", charStart: 16, charEnd: 33}

// Stage B: Re-extract TextAtoms for this page
const page = await getDocumentPage({ pageNumber: 5 });
const textAtoms = await extractTextAtoms({ 
  pdfPath, 
  pageNumber: 5,
  indexableText: page.indexableText  // For validation
});

// Validate: textQuote must match pageText substring
if (page.indexableText.substring(charStart, charEnd) !== textQuote) {
  throw new ValidationError('char_range_mismatch');
}

// Find TextAtoms within char range
const atomsInRange = textAtoms.filter(atom => 
  atom.charStart >= charStart && atom.charEnd <= charEnd
);

// Compute bbox as union of all atom bboxes
const bbox = computeBBoxUnion(atomsInRange);

await createMention({
  pageNumber: 5,
  bbox,
  textQuote,
  charRange: int4range(charStart, charEnd),
  runId
});
```

**Performance**: Re-extracting atoms for one page takes ~50-100ms (PyMuPDF is fast).  
**Cost**: Zero (no LLM call, pure local computation).  
**Determinism**: Same `indexable_text` always produces same TextAtoms.

### How precise are the bounding boxes?

**Answer:** **Word-level precision from PyMuPDF.**
- PyMuPDF extracts word-level bboxes (x0, y0, x1, y1)
- Stage B maps char range → word spans → bbox union
- Result: Same precision as manual highlighting
- If char range spans multiple words: bbox = union of all word bboxes
- Stored as `bbox` field for fast rendering

## Database Schema Changes

### New Tables (Minimal, Essential)

**detection_runs** (job tracking + provenance):
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
  extraction_version text NOT NULL,       -- Hash of indexable_text state (for char_range validation)
  index_types text[] NOT NULL,            -- e.g., ["subject", "author"]
  error_message text,
  cost_estimate_usd numeric(10,4),
  actual_cost_usd numeric(10,4),
  entries_created integer DEFAULT 0,
  mentions_created integer DEFAULT 0
);
```

**Extraction versioning:**
```typescript
// Compute hash of all indexable_text for the project
const computeExtractionVersion = async ({ projectId }) => {
  const pages = await db.documentPages.findMany({
    where: { project: { id: projectId } },
    orderBy: { pageNumber: 'asc' }
  });
  
  const concatenated = pages.map(p => p.indexableText ?? '').join('\n');
  return crypto.createHash('sha256').update(concatenated).digest('hex').slice(0, 16);
};

// Validate mentions against current extraction
const validateMentionsAfterExtractionChange = async ({ runId }) => {
  const run = await db.detectionRuns.findUnique({ where: { id: runId } });
  const currentVersion = await computeExtractionVersion({ projectId: run.projectId });
  
  if (run.extraction_version !== currentVersion) {
    // Flag all mentions from this run as needing validation
    await db.indexMentions.updateMany({
      where: { suggested_by_run_id: runId },
      data: { validation_status: 'needs_review' }
    });
    
    return { changed: true, oldVersion: run.extraction_version, newVersion: currentVersion };
  }
  
  return { changed: false };
};
```

**suppressed_suggestions** (prevent re-suggesting rejected junk):
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

**Suppression modes:**
- `block_suggestion`: Prevent LLM from creating as suggestion (default)
- `block_all`: Prevent both LLM suggestions AND manual creation (rare)

**Scope values** (for future enhancements):
- `project`: Suppress across entire project (MVP)
- `chapter`: Suppress only in specific chapter (post-MVP)
- `page_range`: Suppress only in page range (post-MVP)

### Extended Existing Tables

**index_entries** (add 14 fields):
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

-- Unique constraint: prevent duplicate meanings (across both suggestions and accepted)
CREATE UNIQUE INDEX idx_entries_unique_meaning 
  ON index_entries(project_id, index_type, meaning_type, meaning_id) 
  WHERE meaning_id IS NOT NULL AND deleted_at IS NULL;

-- Fallback constraint: prevent duplicate labels when meaning unknown
-- Applies to both suggestions and accepted entries
CREATE UNIQUE INDEX idx_entries_unique_label_custom 
  ON index_entries(project_id, index_type, normalized_label, meaning_type) 
  WHERE meaning_id IS NULL AND deleted_at IS NULL;

-- Note: This allows the same normalized_label with different meaning_types,
-- e.g., "faith (custom)" vs "faith (wordnet)" if wordnet lookup failed initially.
-- Within same meaning_type, no duplicates allowed.
```

**index_mentions** (add 5 fields):
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

**document_pages** (add 2 fields):
```sql
ALTER TABLE document_pages
  ADD COLUMN indexable_text text,                -- Filtered text (for re-filtering + reproducibility)
  ADD COLUMN dimensions json;                    -- {width, height} for bbox conversion
```

**projects** (add 1 field):
```sql
ALTER TABLE projects
  ADD COLUMN extraction_status text DEFAULT 'not_started';  -- not_started|in_progress|completed|failed
```

### Tables Removed from Original Plan

- ❌ `text_atoms` table (TextAtoms are extraction-time only, not persisted)
- ❌ `index_entry_suggestions` table (use `is_suggestion` flag instead)
- ❌ `duplicate_suggestions` table (no duplicates with meaning IDs)
- ❌ `similarity_matches` table (optional, Task 4 only)
- ❌ `hierarchy_inferences` table (optional, Task 4 only)

**Result:** Epic 2 adds **2 new tables** + **22 new columns** (vs. original plan of 6 new tables).

**Column count breakdown**:
- `detection_runs`: 1 new table (16 columns including `extraction_version`)
- `suppressed_suggestions`: 1 new table (10 columns including `scope` + `suppression_mode`)
- `index_entries`: 14 new columns
- `index_mentions`: 5 new columns
- `document_pages`: 2 new columns
- `projects`: 1 new column

**Optional supporting tables** (not counted in core schema):
- `wordnet_synsets` (for local WordNet lookup)
- `wikidata_cache` (for cached Wikidata results)

### Key Query Patterns

**Suggested entries (review UI):**
```sql
SELECT 
  e.*,
  COUNT(m.id) as mention_count,
  ARRAY_AGG(DISTINCT m.page_number ORDER BY m.page_number) as pages
FROM index_entries e
LEFT JOIN index_mentions m ON m.entry_id = e.id AND m.deleted_at IS NULL
WHERE e.project_id = ? 
  AND e.is_suggestion = true
  AND e.suggestion_status = 'suggested'
  AND e.deleted_at IS NULL
GROUP BY e.id
ORDER BY e.overall_confidence DESC NULLS LAST, mention_count DESC;
```

**Accepted entries (main index):**
```sql
SELECT * FROM index_entries 
WHERE project_id = ? 
  AND is_suggestion = false
  AND deleted_at IS NULL
ORDER BY normalized_label;
```

**Check for existing entry before creating (merge logic):**
```sql
-- Primary: Check by meaning_id (when present)
SELECT * FROM index_entries
WHERE project_id = ?
  AND index_type = ?
  AND meaning_type = ?
  AND meaning_id = ?
  AND deleted_at IS NULL;  -- Note: checks both suggestions AND accepted

-- Fallback: Check by normalized_label (when meaning_type='custom')
SELECT * FROM index_entries
WHERE project_id = ?
  AND index_type = ?
  AND normalized_label = ?
  AND meaning_type = 'custom'
  AND deleted_at IS NULL;  -- Note: checks both suggestions AND accepted

-- If match found:
--   - Same entry exists → merge mentions (dedupe by page + text_quote + bbox_iou)
-- If no match found:
--   - Check suppression table
--   - If not suppressed → create new entry
```

**Check suppression before creating:**
```sql
SELECT * FROM suppressed_suggestions
WHERE project_id = ?
  AND index_type = ?
  AND scope = 'project'  -- MVP: only project-level suppression
  AND (
    -- If we have a meaning_id, check by meaning
    (meaning_id IS NOT NULL AND meaning_type = ? AND meaning_id = ?) OR
    -- If custom, check by normalized_label
    (meaning_type = 'custom' AND normalized_label = ?)
  );

-- If found and suppression_mode = 'block_suggestion':
--   Skip creating this suggested entry
-- If found and suppression_mode = 'block_all':
--   Block both suggestions and manual creation (rare)
```

**Deduplicate mentions during merge:**
```sql
-- Check if mention already exists for entry
SELECT * FROM index_mentions
WHERE entry_id = ?
  AND page_number = ?
  AND text_quote = ?
  AND deleted_at IS NULL;

-- Alternative: Use bbox IoU for fuzzy matching
SELECT *,
  ST_Area(ST_Intersection(bbox::geometry, ?::geometry)) / 
  ST_Area(ST_Union(bbox::geometry, ?::geometry)) as iou
FROM index_mentions
WHERE entry_id = ?
  AND page_number = ?
  AND deleted_at IS NULL
HAVING iou > 0.8;  -- 80% overlap threshold
```

**Rendering on PDF (only accepted):**
```sql
SELECT m.*
FROM index_mentions m
JOIN index_entries e ON e.id = m.entry_id
WHERE m.document_id = ? 
  AND m.page_number = ?
  AND m.is_suggestion = false
  AND m.deleted_at IS NULL
  AND e.deleted_at IS NULL;
```

**Reconstruct mention text (debugging/validation):**
```sql
SELECT 
  m.*,
  substring(p.indexable_text FROM lower(m.char_range) FOR upper(m.char_range) - lower(m.char_range)) as reconstructed_text
FROM index_mentions m
JOIN document_pages p ON p.page_number = m.page_number AND p.document_id = m.document_id
WHERE m.id = ?;

-- Validate: reconstructed_text should equal m.text_quote
```

**Detection run audit trail:**
```sql
-- Which runs created entries for this project?
SELECT 
  dr.*,
  COUNT(DISTINCT e.id) as entries_created,
  COUNT(DISTINCT m.id) as mentions_created
FROM detection_runs dr
LEFT JOIN index_entries e ON e.suggested_by_run_id = dr.id
LEFT JOIN index_mentions m ON m.suggested_by_run_id = dr.id
WHERE dr.project_id = ?
GROUP BY dr.id
ORDER BY dr.created_at DESC;

-- Which entries came from a specific run?
SELECT * FROM index_entries
WHERE suggested_by_run_id = ?
  AND deleted_at IS NULL;
```

### Migration Strategy

**For MVP (fresh start):**
- Run migrations to add new columns
- All existing entries/mentions default to `is_suggestion=false`

**If data exists:**
- Migrate existing entries: `SET is_suggestion = false`
- Confidence fields remain NULL (can be rated later)

## Implementation Checklist

### Before Starting Task 1
- [ ] Understand text_quote + char_range reproducibility pattern
- [ ] Set up OpenRouter API key
- [ ] Run database migrations (see schema section)
- [ ] Verify Project:Document 1:1 constraint
- [ ] Set up WordNet database (SQLite or Postgres)
- [ ] Set up Wikidata API client + caching

### Before Starting Task 2
- [ ] Confirm Task 1 bbox conversion works (PyMuPDF ↔ PDF.js)
- [ ] Test PyMuPDF TextAtom extraction
- [ ] Understand two-stage detection (Stage A: text → Stage B: mapping)
- [ ] Design text-only prompt format with page markers
- [ ] Implement WordNet candidate retrieval
- [ ] Implement Wikidata candidate retrieval + caching
- [ ] Design batch disambiguation prompt (10-30 entries)
- [ ] Plan merge strategy: `meaning_id` primary, `normalized_label` fallback
- [ ] Implement suppression check before creating entries

### Before Starting Task 3
- [ ] Test IndexEntry/IndexMention with full provenance fields
- [ ] Design meaning display UI (badge + gloss tooltip)
- [ ] Design "Change meaning..." action flow
- [ ] Design suppression UI (button + confirmation)
- [ ] Plan mention deduplication: `page + text_quote + bbox_iou > 0.8`
- [ ] Design exclude region auto-actions (warn | auto-reject | auto-suppress)
- [ ] Design PDF preview with bbox highlighting (from stored bbox or reconstructed)

### Before Starting Task 4 (Optional)
- [ ] Evaluate if additional canonicalization is needed
- [ ] Consider fuzzy matching for similar entries
- [ ] Consider hierarchy inference patterns
