# Phase 3: Mention Review UI

**Duration:** 4-5 days  
**Priority:** P0 (Critical path)  
**Status:** Not Started

## Overview

Two-column interface for reviewing suggested IndexEntries and their IndexMentions, accepting/rejecting at both entry and mention levels. Displays canonical meanings, handles re-detection merging, supports suppression rules, and detects extraction changes.

## Goals

1. Two-column layout: Suggested Entries (left) ↔ Accepted Entries (right)
2. Display canonical meanings with badges + gloss tooltips
3. Expandable entry cards showing all mentions
4. Accept/reject at entry level or mention level
5. Suppression with configurable scope/mode
6. PDF preview with bbox highlighting
7. Re-detection merging using meaning_id
8. Extraction change detection and validation

## Success Criteria

- [ ] Two-column layout displays suggested vs. accepted entries
- [ ] Entry cards show: label + meaning badge + gloss tooltip
- [ ] "Change meaning..." action triggers re-disambiguation
- [ ] Entry cards expandable to show all mentions
- [ ] Mention-level accept/reject controls
- [ ] Entry-level actions: Accept all | Reject | Suppress
- [ ] Arrow buttons accept/demote between columns
- [ ] Make Child button establishes parent-child relationships
- [ ] Suppress button adds to `suppressed_suggestions` with `scope` + `suppression_mode`
- [ ] Filtering by: confidence (if rated), meaning_type, mention count, search, validation_status
- [ ] PDF preview highlights all mentions on PDF (from bbox)
- [ ] Re-detection merging works with meaning_id as primary key
- [ ] Extraction change detection flags affected mentions
- [ ] Validation: can't make child across different index types
- [ ] Optimistic updates for smooth UX

## Dependencies

- Phase 2: Mention Detection (must be complete)
- PDF Viewer with highlight support (Epic 1)
- Bbox conversion utilities (Phase 1)

## Next Steps

After Phase 3 is complete:
1. **Test two-column interface**: Verify accept/demote/suppress flows
2. **Test meaning display**: Verify badges + tooltips + change meaning action
3. **Test re-detection**: Verify merge logic + suppression rules
4. **Test extraction changes**: Verify validation_status flagging
5. **Move to Phase 4** (Optional): Fuzzy matching and hierarchy inference
