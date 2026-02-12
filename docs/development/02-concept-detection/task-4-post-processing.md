# Task 4: Post-Processing & Refinement

**Status:** ⚪ Not Started  
**Dependencies:** Task 2 (LLM Integration), Task 3 (Suggestion Management)  
**Duration:** 2-3 days  
**Priority:** P1 (Nice to have, not critical path)

## Overview

Apply post-processing to AI-generated suggestions to deduplicate, merge similar concepts, and infer hierarchical relationships. This polishes the raw LLM output into a more structured and useful set of suggestions.

**Note:** This task is optional for MVP. The core workflow (Tasks 1-3) is functional without it, but this adds significant quality improvements.

## Requirements

### 1. Deduplication Across Windows

**Problem:**
Sliding window processing generates duplicate suggestions:
- Same term suggested in multiple windows
- Slight variations (capitalization, plurals)
- Different page numbers

**Solution:**
Merge duplicates after all windows processed.

```typescript
type DuplicateCluster = {
  canonical: string;          // Chosen primary term
  variants: string[];         // Alternative spellings
  suggestions: string[];      // IDs of duplicate suggestions
  combinedConfidence: number; // Max or average confidence
  combinedPages: number[];    // Union of all page numbers
};

function detectDuplicates({
  suggestions,
}: {
  suggestions: IndexEntrySuggestion[];
}): DuplicateCluster[] {
  const clusters: DuplicateCluster[] = [];
  
  // Group by normalized term
  const grouped = groupBy(suggestions, s => normalize(s.term));
  
  for (const [normalized, group] of Object.entries(grouped)) {
    if (group.length > 1) {
      // Multiple suggestions for same term
      clusters.push({
        canonical: pickCanonicalTerm(group),
        variants: group.map(s => s.term),
        suggestions: group.map(s => s.id),
        combinedConfidence: Math.max(...group.map(s => s.confidence)),
        combinedPages: union(...group.map(s => s.pageNumbers)),
      });
    }
  }
  
  return clusters;
}

function normalize(term: string): string {
  return term
    .toLowerCase()
    .trim()
    .replace(/[.,;:!?]$/g, '') // Remove trailing punctuation
    .replace(/\s+/g, ' ');     // Normalize whitespace
}

function pickCanonicalTerm(suggestions: IndexEntrySuggestion[]): string {
  // Prefer:
  // 1. Highest confidence
  // 2. Most common capitalization
  // 3. Longest version (e.g., prefer "Free Will" over "Free will")
  
  const sorted = suggestions.sort((a, b) => {
    if (a.confidence !== b.confidence) {
      return b.confidence - a.confidence;
    }
    return b.term.length - a.term.length;
  });
  
  return sorted[0].term;
}
```

**Merge Strategy:**
1. Detect duplicate clusters
2. Keep suggestion with highest confidence as primary
3. Mark others as duplicates (don't delete)
4. Combine page numbers
5. Update UI to show: "Divine Simplicity (merged 3 duplicates)"

### 2. Fuzzy Matching for Similar Concepts

**Problem:**
LLM may suggest closely related but distinct terms:
- "Free Will" vs. "Freedom of the Will"
- "Incarnation" vs. "Incarnation of Christ"
- "Trinity" vs. "Trinitarian Theology"

**Solution:**
Use fuzzy matching to suggest merges (user decides).

```typescript
import { distance } from 'fastest-levenshtein';

type SimilarityMatch = {
  term1: string;
  term2: string;
  similarityScore: number; // 0-1 scale
  suggestionIds: [string, string];
  recommendedAction: 'merge' | 'keep_separate';
};

function detectSimilarConcepts({
  suggestions,
  threshold = 0.8,
}: {
  suggestions: IndexEntrySuggestion[];
  threshold?: number;
}): SimilarityMatch[] {
  const matches: SimilarityMatch[] = [];
  
  // Compare all pairs (O(n²), but n is typically < 500 per type)
  for (let i = 0; i < suggestions.length; i++) {
    for (let j = i + 1; j < suggestions.length; j++) {
      const term1 = suggestions[i].term;
      const term2 = suggestions[j].term;
      
      const score = calculateSimilarity(term1, term2);
      
      if (score >= threshold) {
        matches.push({
          term1,
          term2,
          similarityScore: score,
          suggestionIds: [suggestions[i].id, suggestions[j].id],
          recommendedAction: score >= 0.9 ? 'merge' : 'keep_separate',
        });
      }
    }
  }
  
  return matches;
}

function calculateSimilarity(term1: string, term2: string): number {
  const normalized1 = normalize(term1);
  const normalized2 = normalize(term2);
  
  // Exact match after normalization
  if (normalized1 === normalized2) return 1.0;
  
  // Levenshtein distance
  const maxLen = Math.max(normalized1.length, normalized2.length);
  const dist = distance(normalized1, normalized2);
  const levenshteinScore = 1 - (dist / maxLen);
  
  // Substring check (one contains the other)
  const isSubstring = normalized1.includes(normalized2) || 
                      normalized2.includes(normalized1);
  const substringBonus = isSubstring ? 0.2 : 0;
  
  // Token overlap (word-level similarity)
  const tokens1 = new Set(normalized1.split(' '));
  const tokens2 = new Set(normalized2.split(' '));
  const intersection = new Set([...tokens1].filter(t => tokens2.has(t)));
  const tokenOverlap = intersection.size / Math.min(tokens1.size, tokens2.size);
  
  // Weighted combination
  return Math.min(1.0, (
    levenshteinScore * 0.5 +
    tokenOverlap * 0.3 +
    substringBonus * 0.2
  ));
}
```

**UI for Merge Suggestions:**

```
┌─────────────────────────────────────────┐
│ Merge Suggestions (12)                  │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ "Free Will" ↔ "Freedom of the Will" │ │
│ │ Similarity: 87%                     │ │
│ │                                     │ │
│ │ Free Will:                          │ │
│ │ • Confidence: 0.92                  │ │
│ │ • Pages: 8, 14, 22 (+7)            │ │
│ │                                     │ │
│ │ Freedom of the Will:                │ │
│ │ • Confidence: 0.78                  │ │
│ │ • Pages: 12, 18, 25 (+3)           │ │
│ │                                     │ │
│ │ [Merge] [Keep Separate] [Preview]  │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [Accept All Merges] [Dismiss All]      │
└─────────────────────────────────────────┘
```

**Merge Action:**
- Combines page numbers
- Uses higher confidence score
- Keeps longer term as canonical
- Marks one suggestion as duplicate

### 3. Hierarchy Inference

**Problem:**
Suggestions are flat, but indexes need hierarchy.

**Solution:**
Use heuristics + optional LLM call to infer parent-child relationships.

**Heuristic Rules:**

```typescript
type HierarchyRule = {
  parentPattern: RegExp;
  childPattern: RegExp;
  confidence: number;
};

const HIERARCHY_RULES: HierarchyRule[] = [
  // "X" is parent of "X of Y"
  {
    parentPattern: /^(.+)$/,
    childPattern: /^(.+) of .+$/,
    confidence: 0.8,
  },
  
  // "X" is parent of "Y X" (e.g., "Trinity" → "Economic Trinity")
  {
    parentPattern: /^(.+)$/,
    childPattern: /^.+ (.+)$/,
    confidence: 0.7,
  },
  
  // Author names: "LastName, FirstName" → "LastName, FirstName - WorkTitle"
  {
    parentPattern: /^([A-Z][a-z]+, [A-Z][a-z]+)$/,
    childPattern: /^([A-Z][a-z]+, [A-Z][a-z]+) - .+$/,
    confidence: 0.9,
  },
];

function inferHierarchy({
  suggestions,
}: {
  suggestions: IndexEntrySuggestion[];
}): HierarchyInference[] {
  const inferences: HierarchyInference[] = [];
  
  for (const rule of HIERARCHY_RULES) {
    for (const child of suggestions) {
      const childMatch = child.term.match(rule.childPattern);
      if (!childMatch) continue;
      
      const extractedParentTerm = childMatch[1];
      
      // Find matching parent suggestion
      const parent = suggestions.find(s =>
        s.term.match(rule.parentPattern) &&
        s.term.toLowerCase() === extractedParentTerm.toLowerCase()
      );
      
      if (parent) {
        inferences.push({
          parentId: parent.id,
          childId: child.id,
          parentTerm: parent.term,
          childTerm: child.term,
          confidence: rule.confidence,
          rule: rule.parentPattern.source,
        });
      }
    }
  }
  
  return inferences;
}
```

**LLM-Assisted Hierarchy (Optional Enhancement):**

For complex domains, use LLM to infer hierarchy:

```typescript
async function inferHierarchyWithLLM({
  suggestions,
  indexType,
}: {
  suggestions: IndexEntrySuggestion[];
  indexType: IndexType;
}): Promise<HierarchyInference[]> {
  const prompt = `
You are organizing index entries into a hierarchy.

Index Type: ${indexType}

Terms:
${suggestions.map((s, i) => `${i + 1}. ${s.term}`).join('\n')}

Identify parent-child relationships. For each child, specify its parent.

Output JSON format:
[
  { "child": 1, "parent": 3 },
  { "child": 5, "parent": 3 },
  ...
]

Only include confident relationships. Omit if unsure.
`;

  const response = await callOpenRouter({
    model: 'openai/gpt-4-turbo',
    messages: [{ role: 'user', content: prompt }],
  });
  
  const relationships = JSON.parse(response.content);
  
  return relationships.map(rel => ({
    parentId: suggestions[rel.parent - 1].id,
    childId: suggestions[rel.child - 1].id,
    parentTerm: suggestions[rel.parent - 1].term,
    childTerm: suggestions[rel.child - 1].term,
    confidence: 0.8, // LLM-inferred
    rule: 'llm-assisted',
  }));
}
```

**UI for Hierarchy Suggestions:**

```
┌─────────────────────────────────────────┐
│ Suggested Hierarchy (8)                 │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Trinity (parent)                    │ │
│ │   └─ Economic Trinity (child)       │ │
│ │   Confidence: 85%                   │ │
│ │   [Apply] [Ignore]                  │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Aquinas, Thomas (parent)            │ │
│ │   └─ Aquinas, Thomas - Summa... │   │ │
│ │   Confidence: 92%                   │ │
│ │   [Apply] [Ignore]                  │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [Apply All] [Ignore All]                │
└─────────────────────────────────────────┘
```

**Apply Action:**
- Sets `parentId` on child suggestion
- When both accepted, child entry appears under parent in tree

### 4. Confidence Boosting

**Problem:**
Some valid suggestions have artificially low confidence due to:
- Appearing many times (increases relevance)
- Consistent capitalization (proper noun)
- Near citations (for Author index)

**Solution:**
Boost confidence scores based on additional signals.

```typescript
function boostConfidence({
  suggestion,
  documentText,
  indexType,
}: {
  suggestion: IndexEntrySuggestion;
  documentText: string;
  indexType: IndexType;
}): number {
  let boostedConfidence = suggestion.confidence;
  
  // Boost for high occurrence count
  if (suggestion.occurrences >= 10) {
    boostedConfidence += 0.05;
  }
  if (suggestion.occurrences >= 20) {
    boostedConfidence += 0.05;
  }
  
  // Boost for consistent capitalization (proper nouns)
  const allOccurrences = extractAllOccurrences(documentText, suggestion.term);
  const capitalizedCount = allOccurrences.filter(isCapitalized).length;
  const capitalizationRatio = capitalizedCount / allOccurrences.length;
  
  if (capitalizationRatio > 0.9 && indexType === 'author') {
    boostedConfidence += 0.1;
  }
  
  // Boost for appearing near citations (Author index)
  if (indexType === 'author') {
    const nearCitations = countOccurrencesNearCitations(documentText, suggestion.term);
    if (nearCitations / suggestion.occurrences > 0.5) {
      boostedConfidence += 0.1;
    }
  }
  
  // Cap at 1.0
  return Math.min(1.0, boostedConfidence);
}
```

### 5. Quality Metrics Dashboard

Show post-processing results to user:

```
┌─────────────────────────────────────────┐
│ Post-Processing Results                 │
│                                         │
│ ✅ Deduplication                        │
│ • Merged 23 duplicate suggestions       │
│ • Final suggestions: 211                │
│                                         │
│ ✅ Similarity Detection                 │
│ • Found 12 similar concept pairs        │
│ • 8 recommended merges                  │
│ • 4 kept separate                       │
│                                         │
│ ✅ Hierarchy Inference                  │
│ • Detected 34 parent-child relationships│
│ • High confidence: 28                   │
│ • Medium confidence: 6                  │
│                                         │
│ ✅ Confidence Boosting                  │
│ • Boosted 45 suggestions                │
│ • Average boost: +0.08                  │
│                                         │
│ [Review Suggestions] [Apply All]        │
└─────────────────────────────────────────┘
```

## Implementation

### Processing Pipeline

```typescript
async function postProcessSuggestions({
  detectionJobId,
}: {
  detectionJobId: string;
}) {
  // 1. Fetch all suggestions from job
  const suggestions = await db.query.indexEntrySuggestions.findMany({
    where: eq(indexEntrySuggestions.detectionJobId, detectionJobId),
  });
  
  // 2. Detect and merge duplicates
  const duplicates = detectDuplicates({ suggestions });
  await mergeDuplicates({ duplicates });
  
  // 3. Find similar concepts
  const similarPairs = detectSimilarConcepts({ 
    suggestions, 
    threshold: 0.75 
  });
  await storeSimilarityMatches({ similarPairs });
  
  // 4. Infer hierarchy
  const hierarchyInferences = inferHierarchy({ suggestions });
  await storeHierarchyInferences({ hierarchyInferences });
  
  // 5. Boost confidence scores
  const documentText = await fetchDocumentText({ detectionJobId });
  for (const suggestion of suggestions) {
    const boostedConfidence = boostConfidence({
      suggestion,
      documentText,
      indexType: suggestion.indexType,
    });
    
    if (boostedConfidence !== suggestion.confidence) {
      await updateSuggestionConfidence({
        suggestionId: suggestion.id,
        newConfidence: boostedConfidence,
      });
    }
  }
  
  // 6. Update job with post-processing stats
  await updateDetectionJob({
    jobId: detectionJobId,
    postProcessingComplete: true,
    stats: {
      duplicatesMerged: duplicates.length,
      similarPairsFound: similarPairs.length,
      hierarchyInferences: hierarchyInferences.length,
      confidenceBoosted: /* count */,
    },
  });
}
```

### Database Schema Extensions

**DuplicateSuggestion Table:**
```typescript
export const duplicateSuggestions = pgTable("duplicate_suggestions", {
  id: uuid("id").primaryKey().defaultRandom(),
  canonicalSuggestionId: uuid("canonical_suggestion_id")
    .references(() => indexEntrySuggestions.id, { onDelete: "cascade" })
    .notNull(),
  duplicateSuggestionId: uuid("duplicate_suggestion_id")
    .references(() => indexEntrySuggestions.id, { onDelete: "cascade" })
    .notNull(),
  similarityScore: numeric("similarity_score", { precision: 3, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
```

**SimilarityMatch Table:**
```typescript
export const similarityMatches = pgTable("similarity_matches", {
  id: uuid("id").primaryKey().defaultRandom(),
  suggestion1Id: uuid("suggestion_1_id")
    .references(() => indexEntrySuggestions.id, { onDelete: "cascade" })
    .notNull(),
  suggestion2Id: uuid("suggestion_2_id")
    .references(() => indexEntrySuggestions.id, { onDelete: "cascade" })
    .notNull(),
  similarityScore: numeric("similarity_score", { precision: 3, scale: 2 }).notNull(),
  recommendedAction: text("recommended_action"), // 'merge' | 'keep_separate'
  userAction: text("user_action"), // 'merged' | 'kept_separate' | 'ignored'
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
```

**HierarchyInference Table:**
```typescript
export const hierarchyInferences = pgTable("hierarchy_inferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  parentSuggestionId: uuid("parent_suggestion_id")
    .references(() => indexEntrySuggestions.id, { onDelete: "cascade" })
    .notNull(),
  childSuggestionId: uuid("child_suggestion_id")
    .references(() => indexEntrySuggestions.id, { onDelete: "cascade" })
    .notNull(),
  confidence: numeric("confidence", { precision: 3, scale: 2 }).notNull(),
  rule: text("rule"), // Which rule inferred this
  userAction: text("user_action"), // 'applied' | 'ignored'
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
```

## Testing Requirements

### Backend Tests

- [ ] **Deduplication**
  - Detects exact duplicates
  - Detects case variations
  - Merges correctly
  - Combines page numbers

- [ ] **Fuzzy matching**
  - Calculates similarity correctly
  - Threshold filtering works
  - Recommends merges appropriately

- [ ] **Hierarchy inference**
  - Pattern matching works
  - Finds valid parent-child pairs
  - Confidence scoring accurate

- [ ] **Confidence boosting**
  - Boosts high-occurrence terms
  - Boosts proper nouns (Author index)
  - Caps at 1.0

### Frontend Tests

- [ ] **Merge suggestions UI**
  - Displays similar pairs
  - Merge action works
  - Keep separate action works

- [ ] **Hierarchy suggestions UI**
  - Displays parent-child pairs
  - Apply action sets parentId
  - Ignore action dismisses

- [ ] **Quality metrics dashboard**
  - Shows post-processing stats
  - Links to review screens

## Success Criteria

- [x] Duplicates detected and merged automatically
- [x] Similar concepts flagged for user review
- [x] Hierarchy suggestions provided
- [x] Confidence scores boosted based on signals
- [x] Post-processing runs after detection job completes
- [x] User can review and apply suggestions
- [x] Quality metrics displayed

## Next Steps

With all 4 tasks complete, Epic 2 (Concept Detection) is finished. User can now:
1. Extract text from PDF (Task 1)
2. Generate AI concept suggestions (Task 2)
3. Review and accept suggestions (Task 3)
4. Benefit from automatic refinement (Task 4)

Next epic: [Epic 3: Index Editor](../03-index-editor/README.md) - Build the main tree-based editor for managing entries, hierarchy, and cross-references.

## Notes

**Performance Considerations:**
- Deduplication: O(n) with hash map grouping
- Fuzzy matching: O(n²) but n typically < 500 per index type
- Hierarchy inference: O(n × rules) where rules ~= 5-10
- Confidence boosting: O(n × occurrences) but can batch

**User Control:**
- All post-processing suggestions are optional
- User can apply individually or in batch
- Can disable post-processing entirely in settings

**Future Enhancements:**
- Embeddings-based similarity (more accurate than fuzzy matching)
- User feedback loop (learn from accepted/rejected suggestions)
- Multi-level hierarchy inference (grandparent-parent-child)
- Auto-apply merges above confidence threshold
