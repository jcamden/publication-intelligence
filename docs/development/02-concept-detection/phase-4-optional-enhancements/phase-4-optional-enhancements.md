# Phase 4: Optional Enhancements

**Duration:** 2-3 days  
**Priority:** P2 (Nice to have, post-MVP)  
**Status:** Not Started

## Overview

Optional semantic enhancements: fuzzy matching for similar entries, hierarchy inference via pattern matching, and quality metrics dashboard. These features improve suggestion quality and user experience but are not required for core functionality.

## Goals

1. Fuzzy matching for similar entries (suggest merges)
2. Hierarchy inference via pattern matching
3. Quality metrics dashboard
4. Homonym disambiguation suggestions

## Key Features

### Fuzzy Matching

**Purpose:** Identify similar entries that might be duplicates or variants.

**Examples:**
- "soteriology" vs "doctrine of salvation"
- "Aquinas, Thomas" vs "Thomas Aquinas"
- "free will" vs "freedom of the will"

**Implementation:**
- Use Levenshtein distance or Jaro-Winkler similarity
- Set threshold (e.g., > 0.8 similarity)
- Suggest merges to user (don't auto-merge)

### Hierarchy Inference

**Purpose:** Suggest parent-child relationships based on patterns.

**Pattern Examples:**
- "X doctrine" → child of "X"
- "X, Y" (appositive) → Y is parent
- Capitalization patterns (specific → general)

**Implementation:**
- Pattern matching rules
- Optional: LLM-based hierarchy suggestions (post-MVP)
- User reviews and applies suggestions

### Quality Metrics Dashboard

**Purpose:** Show detection quality statistics.

**Metrics:**
- Coverage: % of pages with suggestions
- Confidence distribution: Histogram of scores
- Meaning resolution success: % wordnet/wikidata vs custom
- Suppression rate by index type
- Acceptance rate over time

## Success Criteria

- [ ] Fuzzy matching suggests merges for similar entries
- [ ] Hierarchy inference suggests parent-child relationships
- [ ] Optional: WordNet/Wikidata sense ID assignment (already in Phase 2)
- [ ] Homonym disambiguation suggestions
- [ ] Quality metrics dashboard shows statistics

## Dependencies

- Phase 3: Mention Review UI (must be complete)
- All core functionality working

## Next Steps

After Phase 4 is complete:
1. **Evaluate user feedback**: Are enhancements valuable?
2. **Consider additional features**: LLM-based hierarchy, embeddings for similarity
3. **Move to Epic 3**: Index Editor enhancements
