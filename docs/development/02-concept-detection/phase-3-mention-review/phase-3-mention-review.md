# Phase 3: Mention Review UI

**Duration:** 4-5 days total (3a + 3b)  
**Priority:** P0 (Critical path)  
**Status:** Not Started

## 🚨 Architecture Update (2026-02-12)

This phase remains largely unchanged, but **extraction change detection** has been removed.

**See:** [../SIMPLIFIED-ARCHITECTURE.md](../SIMPLIFIED-ARCHITECTURE.md)

**What changed:**
- ❌ No extraction change detection (no pre-extraction = no version tracking)
- ❌ No validation status badges on mentions
- ✅ Everything else stays the same (accept/reject/suppress, meanings, etc.)

---

## Overview

Two-column interface for reviewing suggested IndexEntries and their IndexMentions, accepting/rejecting at both entry and mention levels. Displays canonical meanings, handles re-detection merging, and supports suppression rules.

**This phase is split into two sub-phases to enable parallelization:**

## Sub-Phases

### [Phase 3a: UI Components](./phase-3a-ui-components.md) (3-4 days)
**Parallelization:** ✅ **Can run in parallel with Phase 2**

Build all UI components with mock data:
- Two-column layout skeleton
- EntryCard, MentionCard, MeaningBadge components
- Filters panel and action buttons
- Storybook stories and interaction tests
- State management with Jotai
- Visual design and interactions

**Depends on:** Phase 1 complete (for schema types)

### [Phase 3b: Backend Integration](./phase-3b-backend-integration.md) (1-2 days)
**Parallelization:** ❌ **Must wait for Phase 2 to complete**

Integrate Phase 3a components with backend:
- Replace mock data with real tRPC queries
- Implement accept/reject/suppress mutations
- Add meaning resolution integration
- Wire up PDF viewer highlighting
- Add extraction change detection
- Implement optimistic updates

**Depends on:** Phase 2 complete (needs backend API)

## Parallelization Benefit

**Sequential:**
```
Phase 1 (3 days) → Phase 2 (7 days) → Phase 3 (5 days) = 15 days
```

**Parallel:**
```
Phase 1 (3 days) → [Phase 2 (7 days) || Phase 3a (4 days)] → Phase 3b (2 days) = 12 days
```

**Savings: 3 days** (20% faster)

## Combined Success Criteria

### Phase 3a (UI Components)
- [ ] All UI components built with Storybook docs
- [ ] Mock data matches Phase 2 schema
- [ ] Interaction tests cover key workflows
- [ ] Visual design complete

### Phase 3b (Integration)
- [ ] Real tRPC queries and mutations work
- [ ] Meaning resolution integrated
- [ ] PDF preview highlights mentions
- [ ] Extraction change detection works
- [ ] Re-detection merging works
- [ ] Optimistic updates smooth

### Overall Phase 3
- [ ] Two-column interface fully functional
- [ ] Accept/reject/suppress workflows complete
- [ ] Meaning badges + "Change meaning..." work
- [ ] Suppression rules prevent re-suggestions
- [ ] Extraction changes flagged
- [ ] Ready for production use

## Dependencies

- **Phase 2**: Only Phase 3b depends on it (3a can be built with mock data)
- **Phase 3a → Phase 3b**: Sequential (integration needs components)

**Note:** With simplified architecture, Phase 3a can start immediately (no Phase 1 dependency).

## Next Steps

After Phase 3 is complete:
1. **Test full pipeline**: Extract → Detect → Review → Accept
2. **Test re-detection**: Merge logic + suppression rules
3. **Performance testing**: Large documents
4. **User acceptance testing**: Real indexers
5. **Move to Phase 4** (Optional): Fuzzy matching and hierarchy inference
