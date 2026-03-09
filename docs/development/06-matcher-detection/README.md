# Epic 6: Matcher-Based Detection (Scripture + Subject)

## Goal

Detect references without LLMs by:
- matching `IndexMatcher` aliases in page text,
- parsing local reference syntax for scripture and other corpora,
- creating `IndexMention`s linked to `IndexMatcher`s (not directly to `IndexEntry`s),
- creating/reusing scripture child `IndexEntry` + `IndexMatcher` rows when needed.

This should support both:
- `scripture` index type: alias + local citation parsing
- `subject` index type: alias-only matching to existing `IndexMatcher`s

## Guiding Decisions

- Use `@blackglory/aho-corasick` for alias detection.
- Do not use sliding n-gram passes.
- Do not run mega-regexes over full pages.
- Normalize text/matchers once and parse only local windows after alias hits.
- Keep shared matcher-detection infrastructure so scripture and subject flows reuse the same scan pipeline.
- Use predefined citation parser profiles for v1 (not fully user-authored patterns).

## Confirmed Decisions (Current)

1. Scripture detection must emit both chapter-level and verse/range-level child entries when present.
   - Example hierarchy:
     - `Genesis > 1`
     - `Genesis > 1:2`
     - `Genesis > 1:2-4`
     - `Genesis > 1:20-2:4`
2. Canon and extra corpus selection UX belongs in the Scripture index project sidebar.
3. Matcher constraints are DB-enforced:
   - one matcher row maps to exactly one `IndexEntry`,
   - matcher text must be unique per index type context,
   - same matcher text is still allowed across different index types.
4. Canon/corpora persistence uses a dedicated scripture-config table.
5. Scripture bootstrapping is explicit user action from the sidebar (not auto-seeded on enable).
6. If overlapping aliases both match in text, prefer the longer match.
7. For multi-ref sequences, emit one mention per parsed segment.
8. If scripture alias/context passes but structured parse fails, emit a book-level mention.
9. Mention payload keeps the exact original matched text span only.
10. All canons in `packages/core/src/data/texts/bible/canons.ts` are mutually exclusive.
11. Seeded canon/corpus entries are editable after creation.
12. Additional Hebrew Bible / New Testament books outside selected canon can be added to any `IndexEntryGroup`.
13. Detection runs should support:
   - individual `IndexEntryGroup` runs,
   - run-all-groups extraction,
   - project-level triggering,
   - page-level triggering.
14. Duplicate mentions in identical form must not be created across repeated runs.
15. `IndexMention` should attach to `IndexMatcher` so moving a matcher between entries moves mention affiliation.
16. Track matcher-page run coverage directly (not entry versions); matcher text is immutable.
17. Enforce unique mention constraints per index type at the database layer.
18. Pre-MVP migration can be destructive (DB reset); no backward compatibility path is required.
19. If punctuation is part of a matcher, it must be preserved in match span/dedupe logic.
20. Compound parsed refs should produce segmented child entries and one mention per segment (for example, `Gen 1:1-3, 2:4-5, 27` => three children + three mentions).
21. Scripture child matcher labels default to emitted citation text from parsing (no automatic normalized-canonical alias expansion in v1).
22. Split by index type for core index tables (`IndexEntries`, `IndexMatchers`, `IndexMentions`, and `IndexEntryGroups`) to enforce type-local constraints.
23. DB-level dedupe should prevent duplicate `matcher + bbox` combinations within an index type.
24. Multiple mentions may share the same bbox when they have different matchers/segments.
25. Frontend should group identical-bbox mentions into one highlight with paging UI (`1 of N`).

## New Concept: IndexEntryGroups + Layout Blocks

`IndexEntryGroup` replaces "TextGroup" and is shared across scripture + subject indexes.

Two responsibilities:
- Detection scope: each group defines a matcher set and parser profile for extraction.
- Index rendering: groups are referenced inside draggable layout blocks for structured presentation.

Planned layout block model (Index page sidebar):
- block types: `H1`, `H2`, `H3`, `GroupRef`
- example:
  - `H1: Classified Index of the Book of Job`
  - `H2: A. The Supernatural World`
  - `H3: God`
  - `GroupRef: GodEntryGroupName (sort A-Z)`
  - `H3: Underworld`
  - `GroupRef: UnderworldEntryGroupName (sort A-Z)`
- scripture example:
  - `H1: Scripture and Extrabiblical Index`
  - `H2: Old Testament`
  - `GroupRef: HebrewBibleEntryGroupName (sort Protestant Canon)`

## Current Architecture Constraints (Observed)

- Detection today is LLM-only in `apps/index-pdf-backend/src/modules/detection/detection.service.ts`.
- Mentions/entries persist through `detection.repo` into `index_entries` / `index_mentions`.
- `index_mentions` currently attach to `index_entries` (must be migrated to matcher-attached mentions).
- Project-level configurable matchers already exist via `index_matchers` linked to `index_entries`.
- Static scripture alias source exists in `packages/core/src/data/texts/matcher-dictionary.ts` and can be generated by `packages/core/src/data/texts/utils/generate-matcher-dictionary.ts`.
- Canon display labels are provided in `packages/core/src/data/texts/bible/text-labels-per-canon.ts`.

## Target End State

1. Detection run API supports mode + scope selection:
- `mode`: `llm` | `matcher`
- run target: one group, many groups, or all groups in an index type
- run scope: project or specific page

2. Shared matcher engine:
- normalized alias index
- Aho scan + boundary filtering + overlap resolution
- optional profile-level context prechecks

3. Profile-based local parsers:
- predefined parser profiles for scripture/corpus citation styles
- profile chosen per `IndexEntryGroup`
- parsers run on short local windows only

4. Persist behavior:
- mentions attach to `IndexMatcher`
- entry association is derived from matcher -> entry relation
- scripture child entry strategy still applies, but emitted mentions reference the matcher used for that child entry

5. Matcher-aware run coverage:
- store per-page coverage by matcher id
- unchanged matcher ids for a page can be skipped when building matcher snapshot for new runs

6. IndexEntryGroup configuration:
- group CRUD + memberships + parser profile assignment
- group-aware detection targeting
- draggable/collapsible layout blocks in Index page sidebar for render order/structure

## Clarified Defaults

1. Run scope and API contract
- Matcher run accepts `scope: "project" | "page"`.
- Matcher run accepts `indexEntryGroupIds[]` and `runAllGroups` (mutually exclusive).
- Project sidebar can trigger project-level runs.
- Page sidebar can trigger page-level runs.

2. Normalization contract
- Always apply NFKC -> lowercase -> dash normalization -> whitespace collapse.
- Do not strip punctuation that is part of matcher text.
- Offset spans use half-open intervals: `[start, end)`.

3. Offset-map contract
- `normalizeWithOffsetMap(text)` maps normalized indices/spans back to original indices/spans.
- Collapse case: map to first original index in the collapsed group.
- Expansion case: each expanded normalized char maps to the same original index.

4. Match candidate resolution
- Boundary rule: reject hits where adjacent characters are alphanumeric on either side.
- Overlap tie-breakers: longest match first, then earliest start index.
- Deterministic output ordering: page -> start offset -> alias length desc.

5. Scripture parsing + fallback mention behavior
- Precheck window defaults to 24 chars after alias hit.
- Parser window defaults to 120 chars (hard cap 200 chars).
- Verse lists emit atomic refs.
- Multi refs emit one mention per parsed segment.
- If parse fails after valid alias/context, emit a book-level mention using the maximum available local match span.
- If punctuation exists in the matcher span, include it in the persisted mention span.

6. Dedupe/idempotency scope
- In-memory dedupe removes duplicate candidates within a run.
- DB dedupe prevents insertion of identical mentions across runs via unique `matcher + bbox` constraint per index type.
- Same bbox can appear multiple times when matcher differs.
- Frontend collapses same-bbox mentions into one visual highlight with `1 of N` mention paging.
- Dedupe key should be matcher-anchored and bbox anchored, not run-id anchored.

7. Matcher coverage skip contract
- Track coverage by `(page, matcher)` for matcher runs.
- If matcher/page coverage already exists, skip that matcher for that page run.

## Phased, Executable Tasks

### Phase 0: Detection API Contract Expansion

**Task 0.1: Split detection endpoints (shared internal orchestration)** — Completed 2025-03
- Files: `apps/index-pdf-backend/src/modules/detection/detection.types.ts`, `apps/index-pdf-backend/src/modules/detection/detection.router.ts`, `apps/index-pdf-backend/src/modules/detection/detection.service.ts`
- Introduce separate endpoints:
  - `detection.runLlm`
  - `detection.runMatcher`
- Input contracts:
  - `runLlm`: keep current LLM input shape (no matcher-specific targeting fields).
  - `runMatcher`:
    - `scope: "project" | "page"`
    - `pageId?` (required when scope is `page`)
    - `indexEntryGroupIds?: string[]`
    - `runAllGroups?: boolean`
- Validate mutual exclusivity (`indexEntryGroupIds` vs `runAllGroups`) in `runMatcher`.
- Refactor service so both endpoints call a shared orchestration layer for run creation, eventing, and lifecycle handling.

**Task 0.2: Persist run metadata**
- DB migration for matcher run metadata in `detection_runs`:
  - `run_type` (`llm` | `matcher`)
  - `scope` (`project` | `page`) nullable for existing llm rows
  - `page_id` nullable
  - group-selection snapshot (`index_entry_group_ids`, `run_all_groups`)
- No backward-compatibility required in pre-MVP; apply schema changes directly and reset DB.
- Update `detection.repo` mappings and serializers for both run types.

**Acceptance**
- Existing LLM flow remains unchanged via `detection.runLlm`.
- Matcher flow is isolated under `detection.runMatcher` with page/project and group subset/all targeting.
- Shared internals are reused (no duplicated run creation/lifecycle logic).

### Phase 1: Shared Text Normalization + Offset Mapping

**Task 1.1: Build normalization utility**
- New module suggestion: `packages/core/src/text/normalization.ts`.
- Behavior:
  - Unicode NFKC
  - lowercase/casefold
  - dash normalization to `-`
  - whitespace collapse
  - preserve punctuation that is part of matcher text

**Task 1.2: Add normalized-to-original offset map**
- Expose helper:
  - `normalizeWithOffsetMap(text) -> { normalizedText, mapNormalizedIndexToOriginalIndex, mapNormalizedSpanToOriginalSpan }`

**Acceptance**
- Deterministic tests for punctuation/dash/whitespace normalization.
- Offset map verified with mixed Unicode/punctuation examples.

### Phase 2: Shared Aho Alias Engine

**Task 2.1: Install and wire `@blackglory/aho-corasick`**
- Add dependency where matcher scan executes (likely `apps/index-pdf-backend`).

**Task 2.2: Build alias index builder**
- Input: array of `{ alias, matcherId, entryId, indexType, groupId }`.
- Output:
  - normalized alias lookup
  - compiled Aho automaton

**Task 2.3: Candidate filtering + overlap resolution**
- boundary check to reject mid-word hits
- overlap resolution: longest-match-first
- output matcher-anchored match objects with normalized/original offsets

**Acceptance**
- Unit tests for boundary false positives and overlap behavior.

### Phase 3: Parser Profile Framework + Scripture Parser

**Task 3.1: Parser profile contract**
- Define profile interface for local parsing:
  - context precheck
  - local parse
  - parsed segment emission

**Task 3.2: Scripture parser profile (baseline)**
- New module suggestion: `packages/core/src/scripture/ref-parser.ts`.
- Parse local window (default 120 chars, max 200 chars).
- Minimum support:
  - `ch`, `ch-ch`
  - `ch:v`, `ch.v`
  - `ch:v-v`
  - verse lists
  - multi refs via `,` / `;`
  - cross-chapter refs
  - suffixes (`3a`, `3b`)

**Task 3.3: Predefined profiles registry**
- Register predefined profile ids for v1 (exact set pending citation examples for non-biblical corpora).

**Acceptance**
- Parser matrix tests for supported syntax.
- Negative tests for false positives.

### Phase 4: Split-by-Type Schema + Matcher-Linked Mentions

**Task 4.1: Schema migration**
- Split core tables by index type (`entries`, `matchers`, `mentions`, `entry_groups`) and migrate write/read paths.
- Ensure mention tables reference type-local matcher tables.
- Add unique `matcher + bbox` constraints per index type mention table.

**Task 4.2: Pre-MVP destructive cutover**
- No backfill/dual-read path required.
- Regenerate schema and seed flows for clean DB initialization.
- Update repos/services to read/write type-local matcher/mention/entry/group tables only.

**Task 4.3: Cleanup**
- Remove legacy unified table paths and mention->entry write path.

**Acceptance**
- New mention writes are matcher-linked.
- DB uniqueness prevents duplicate per-index-type `matcher + bbox` mentions.
- Same bbox + different matcher is allowed.

### Phase 5: Matcher Detection Run (No LLM) with Global Idempotency

**Task 5.1: Build page matcher flow**
- Reuse extraction + bbox mapping in `detection.service.ts`.
- For each target page:
  - build searchable text
  - run alias engine for selected groups
  - run parser profile per matched group
  - emit deterministic mention candidates

**Task 5.2: Global dedupe policy**
- In-memory dedupe within run.
- DB uniqueness (per index type `matcher + bbox`) prevents identical mention duplicates across runs.

**Task 5.3: Fallback mention span**
- On parse-fail-after-context-pass, emit book-level mention using maximum local span available.
- Include punctuation when that punctuation is part of the matched matcher text.

**Acceptance**
- Re-running same run inputs does not accumulate duplicate identical mentions.
- Matcher runs work without LLM/API keys.

### Phase 6: Entry Resolution + Scripture Child Entry/Matcher Emission

**Task 6.1: Subject resolution**
- Resolve directly to existing matcher/entry rows.

**Task 6.2: Scripture resolution strategy**
- Resolve canonical book alias -> parent entry.
- Create/reuse chapter/verse child entries as needed.
- For compound refs, segment and emit child entries/matchers per segment.
  - Example: `Gen 1:1-3, 2:4-5, 27` => `Genesis > 1:1-3`, `Genesis > 2:4-5`, `Genesis > 2:27`.
- Create/reuse matcher rows for emitted child-reference strings, preserving parsed punctuation/token intent.
- Attach mention to resolved child matcher.

**Task 6.3: Centralize resolution service**
- Suggested file: `apps/index-pdf-backend/src/modules/detection/entry-resolution.service.ts`
- Hide subject/scripture differences behind strategy interface.

**Acceptance**
- Subject mentions resolve via existing matchers.
- Scripture mentions attach to child matchers under expected child entries.
- Compound refs create one mention per emitted child segment.

### Phase 7: IndexEntryGroup Data Model + Detection Integration

**Task 7.1: Data model**
- Add `index_entry_groups` + membership relation to entries/matchers.
- Add profile assignment per group.
- Add group sort mode metadata (`a-z`, canon order, etc.).

**Task 7.2: Detection integration**
- Build matcher snapshot by selected groups.
- Enable per-group runs and run-all mode.

**Task 7.3: Matcher-aware page coverage**
- Add run-coverage table keyed by page + matcher.
- Skip already-covered matcher/page pairs on subsequent runs.

**Acceptance**
- Each group can run independently.
- Run-all mode works.
- Already-covered matcher/page pairs can be skipped.

### Phase 8: Scripture Bootstrapping + Canon Rules

**Task 8.1: Dedicated scripture-config table**
- Persist selected canon + corpora options in dedicated schema.
- Enforce canon mutual exclusivity based on `canons.ts`.

**Task 8.2: Explicit bootstrap workflow**
- Seed entries/matchers for:
  - selected canon
  - Apocrypha
  - Jewish Writings
  - Classical Writings
  - Christian Writings
  - Dead Sea Scrolls
  - optional additional HB/NT books not in selected canon

**Task 8.3: Post-seed editability**
- Ensure groups/entries/matchers are editable after seed.

**Acceptance**
- User can seed via explicit action.
- Seeded data can be reorganized across groups.

### Phase 9: UI Surface (Project Sidebar, Page Sidebar, Index Sidebar)

**Task 9.1: Project sidebar detection controls**
- Mode selector (`LLM`/`Matcher`)
- Group selector + run-all option
- Project-level run action

**Task 9.2: Page sidebar detection controls**
- Group selector + run-all option
- Page-level run action

**Task 9.3: Index page group/layout sidebar**
- New draggable/collapsible sidebar for:
  - `IndexEntryGroup` CRUD
  - group profile/sort settings
  - layout blocks (`H1`, `H2`, `H3`, `GroupRef`)
  - drag/drop ordering

**Task 9.4: Scripture setup controls**
- Canon selection + corpora toggles + additional-book selection
- Trigger bootstrapping endpoint

**Acceptance**
- User can run matcher detection from project or page context.
- User can structure rendered index using layout blocks + group refs.

### Phase 10: Test Strategy + Performance Gates

**Task 10.1: Unit tests**
- normalization + offset mapping
- boundary/overlap filtering
- parser profile contract + scripture parser grammar matrix

**Task 10.2: Integration tests**
- matcher-linked mention persistence
- scripture child entry/matcher creation
- per-group vs run-all run behavior
- page-level vs project-level run behavior
- dedupe/idempotency across repeated runs
- matcher coverage skip behavior

**Task 10.3: Migration tests**
- destructive cutover migration correctness in clean DB bootstrap
- split type-local table writes/reads (`entries`, `matchers`, `mentions`, `entry_groups`)
- duplicate `matcher + bbox` constraints enforce correctly while allowing same bbox with different matchers

**Task 10.4: Performance baseline**
- benchmark matcher scan + parser on representative corpus
- publish P50/P95 ms per page + peak memory per run

**Acceptance**
- CI covers parser/resolver/migration/dedupe/matcher-skip flows.
- Matcher mode materially outperforms LLM mode.

## Suggested Implementation Order

1. Phase 0
2. Phase 1
3. Phase 2
4. Phase 4 (schema migration early)
5. Phase 5
6. Phase 6
7. Phase 3 (expand profiles after core run path is stable)
8. Phase 7
9. Phase 8
10. Phase 9
11. Phase 10

Rationale: lock run contract and matcher-linked persistence first, then build extraction correctness, then group/config UX and performance hardening.

## Risks

- Full type-table split increases query and repo complexity if abstraction boundaries are weak.
- Parser-profile drift across corpora can create false positives until profile definitions are finalized.
- Matcher immutability requires explicit create-new-matcher UX for edits.
- Group/layout complexity can over-expand UI scope without clear v1 constraints.
- Runtime rebuild of large matcher sets per page can regress performance (build once per run scope where possible).

## Data Model Decision: Split by Index Type

Recommendation:
- Split `index_entries`, `index_matchers`, `index_mentions`, and `index_entry_groups` by index type.

Why:
- Type-local uniqueness is simpler and safer to enforce.
- Type-specific schemas can evolve independently.
- Dedupe constraints (`matcher + bbox`) are explicit and local.

When to revisit:
- if query/repo duplication overhead outweighs type-local constraint clarity.

## Open Questions (Need Decisions Before Non-Biblical Profile Implementation)

1. Predefined profile list: which profile ids should ship in v1 beyond baseline scripture style?
2. Unique bbox definition for DB constraints: exact bbox tuple fields to enforce uniqueness (page + x/y/w/h + rotation? atom span ids?)?
3. Split table naming conventions for each index type (`subject_*`, `scripture_*`, etc.)?
4. For same-bbox grouping UI, is frontend-only grouping sufficient in v1, or should we persist a backend `mention_group_id`?
