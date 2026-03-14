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
22. Keep unified core index tables for MVP (`IndexEntries`, `IndexMatchers`, `IndexMentions`, and `IndexEntryGroups`) and enforce type-local constraints via `index_type`-aware uniqueness/indexing.
23. DB-level dedupe should prevent duplicate `matcher + bbox` combinations within an index type.
24. Multiple mentions may share the same bbox when they have different matchers/segments.
25. Frontend should group identical-bbox mentions into one highlight with paging UI (`1 of N`).

## New Concept: IndexEntryGroups (Simplified)

`IndexEntryGroup` replaces "TextGroup" and is shared across scripture + subject indexes.

Two responsibilities:
- **Detection scope**: each group defines a matcher set and parser profile for extraction.
- **Index organization**: groups appear as parent-like containers in the EntryTree within each index type section of the project sidebar. No separate layout blocks; the index display format is flexible and users can adjust on export.

Implemented design (per index_group_layout_sidebar and group_row_and_drag_sort plans):
- Groups integrate into each index type section (Subject, Author, Scripture) within the project sidebar.
- Groups render as bordered, collapsible parent nodes in the EntryTree; entries belong to at most one group.
- One group per entry; group assignment from Entry create/edit modals and Edit Group modal.
- Custom sort mode: drag-to-reorder entries within a group; groups themselves can be reordered via drag.
- Shared TreeRow component for entry and group rows (drag handle, expand icon, action buttons on hover).
- Edit Group modal (like Edit Entry): group metadata, searchable entry add/remove, transfer warning when moving entries between groups.
- MergeGroupModal: merge source group into target; moves entries and matchers, deletes source.

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
- groups as parent-like containers in EntryTree (project sidebar); drag-to-reorder groups and entries within groups

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

**Task 0.2: Persist run metadata** — Completed 2025-03
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

**Task 1.1: Build normalization utility** — Completed 2025-03
- New module suggestion: `packages/core/src/text/normalization.ts`.
- Behavior:
  - Unicode NFKC
  - lowercase/casefold
  - dash normalization to `-`
  - whitespace collapse
  - preserve punctuation that is part of matcher text

**Task 1.2: Add normalized-to-original offset map** — Completed 2025-03
- Expose helper:
  - `normalizeWithOffsetMap(text) -> { normalizedText, mapNormalizedIndexToOriginalIndex, mapNormalizedSpanToOriginalSpan }`

**Acceptance**
- Deterministic tests for punctuation/dash/whitespace normalization.
- Offset map verified with mixed Unicode/punctuation examples.

### Phase 2: Shared Aho Alias Engine  — Completed 2025-03

**Task 2.1: Install and wire `@blackglory/aho-corasick`**  — Completed 2025-03
- Add dependency to `apps/index-pdf-backend` [already done, and post-install build script ran successfully]

**Task 2.2: Build alias index builder**  — Completed 2025-03
- Input: array of `{ alias, matcherId, entryId, indexType, groupId }`.
- Output:
  - normalized alias lookup
  - compiled Aho automaton

**Task 2.3: Candidate filtering + overlap resolution**  — Completed 2025-03
- boundary check to reject mid-word hits
- overlap resolution: longest-match-first
- output matcher-anchored match objects with normalized/original offsets

**Acceptance**
- Unit tests for boundary false positives and overlap behavior.

### Phase 3: Parser Profile Framework + Scripture Parser

**Task 3.1: Parser profile contract** — Completed 2025-03
- Define profile interface for local parsing:
  - context precheck
  - local parse
  - parsed segment emission

**Task 3.2: Scripture parser profile (baseline)** — Completed 2025-03
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

**Task 3.3: Predefined profiles registry** — Completed 2025-03
- Register predefined profile ids for v1 (exact set pending citation examples for non-biblical corpora).

**Acceptance**
- Parser matrix tests for supported syntax.
- Negative tests for false positives.

### Phase 4: Matcher Detection Run (No LLM) with Global Idempotency

**Task 4.1: Build page matcher flow**
- Reuse extraction + bbox mapping in `detection.service.ts`.
- For each target page:
  - build searchable text
  - run alias engine for selected groups
  - run parser profile per matched group
  - emit deterministic mention candidates
- Implementation details (codebase-aligned):
  - Replace `processMatcherStub` in `apps/index-pdf-backend/src/modules/detection/detection.service.ts` with real matcher processing while keeping the existing run lifecycle pattern used by `processDetection`:
    - load run
    - set status `running`
    - per-page cancellation checks
    - progress updates
    - set status `completed` / `failed`
  - Reuse existing source-document + PDF extraction plumbing from the LLM flow:
    - `listSourceDocumentsByProject`, `getSourceDocumentById`, `extractPages`
    - canonical-page exclusions via `listRules` and existing page-range helpers
  - Build one alias snapshot per run (not per page) from selected groups:
    - query matcher rows for `indexEntryGroupIds` or all groups (`runAllGroups`)
    - materialize alias rows as `AliasInput[]` (`alias`, `matcherId`, `entryId`, `indexType`, `groupId`)
    - compile once with `buildAliasIndex(...)`
  - For each page:
    - convert extracted atoms into searchable page text using indexable words only (same convention as `buildPromptText`/`recalculateCharPositionsForIndexable`)
    - scan with `scanTextWithAliasIndex(...)` (or `findAndResolveMatches(...)` if normalized text is precomputed)
    - map alias match char spans to bboxes using existing `mapPositionsToBBoxes(...)` + corrected indexable atom offsets
    - group matches by `groupId`, resolve parser profile id for that group, and run profile parse against local windows anchored at alias hits
      - precheck window default: 24 chars after alias
      - parser window default: 120 chars (hard cap 200)
    - emit in-memory mention candidates in deterministic order (`pageNumber`, `charStart`, longer span first) for later resolution/persistence in Phase 5
  - Candidate payload target (before persistence):
    - `pageNumber`, `groupId`, `matcherId`, `entryId`, `indexType`
    - `textSpan`, `charStart`, `charEnd`, `bboxes`
    - optional parser output segments (`refText`, `chapter`, `verseStart`, `verseEnd`)
  - Keep this phase persistence-light:
    - Task 4.1 should produce deterministic candidates
    - Task 4.2 handles dedupe semantics
    - Phase 5 attaches candidates to resolved matcher/entry rows
- Suggested test coverage for Task 4.1:
  - service-level test: matcher run completes without LLM API key
  - page-flow test: alias hit -> bbox mapping -> candidate emission
  - determinism test: repeated same inputs produce byte-for-byte equivalent candidate ordering
  - group-profile test: different group parser profiles only parse their own matches

**Task 4.2: Global dedupe policy**
- In-memory dedupe within run.
- DB uniqueness (`index_type + matcher + bbox`) prevents identical mention duplicates across runs.
- Implementation details (codebase-aligned):
  - Add deterministic in-memory dedupe before persistence in matcher flow (`detection.service.ts`):
    - build a stable key per candidate: `projectIndexTypeId + matcherId + pageNumber + canonicalBboxJson`
    - canonicalize bbox arrays before keying (sort by `y`, then `x`, then `width`, `height`) so equivalent atom orderings dedupe identically
    - dedupe across the entire run, not just within a page batch
  - Enforce DB idempotency with a composite uniqueness constraint once matcher-linked mentions land:
    - target table: `index_mentions`
    - uniqueness scope: `project_index_type_id + matcher_id + page_number + bboxes_hash` (or equivalent canonical bbox representation)
    - do not include `detection_run_id` in uniqueness key
  - Add a persisted bbox fingerprint field for reliable uniqueness:
    - store normalized JSON or hash derived from canonical bbox array
    - keep hash generation deterministic and language/runtime stable
  - Upsert/insert behavior in repo layer:
    - insert mentions with conflict handling (`on conflict do nothing`) against the composite unique index
    - count "created" mentions from successful inserts only; skipped conflicts are treated as expected dedupe hits
  - Scope rules to preserve intended duplicates:
    - same bbox + different matcher => allowed
    - same matcher + different bbox => allowed
    - same matcher + same bbox + same index type => blocked (within run and across reruns)
- Suggested test coverage for Task 4.2:
  - unit test: canonical bbox ordering generates identical dedupe keys for equivalent bbox sets
  - service test: duplicate candidates in one run collapse to one insert attempt
  - integration test: rerunning identical matcher inputs creates zero additional mentions
  - integration test: same bbox for two different matchers both persist successfully
- Dedupe against pre-existing mentions (created before current run):
  - Immediate (pre-matcher-linked migration):
    - add repo pre-check query for existing mentions by `project_index_type_id + entry_id + page_number + bboxes_hash`
    - skip insert when existing row is found
    - keep in-memory dedupe active to avoid repeated DB reads for identical candidates in same run
  - Target (after matcher-linked mentions are in place):
    - enforce unique index on `project_index_type_id + matcher_id + page_number + bboxes_hash`
    - use `insert ... on conflict do nothing` as the primary guard against pre-existing duplicates
    - remove/limit application-layer pre-check to reduce race conditions and extra round-trips
  - Backfill/migration step:
    - compute canonical `bboxes_hash` for existing `index_mentions`
    - identify duplicate clusters by the chosen uniqueness key and retain one canonical row (lowest `created_at` or `id`)
    - only add the unique index after duplicate cleanup succeeds
  - Operational notes:
    - dedupe check must ignore `detection_run_id` so older rows still block duplicates
    - use same canonical bbox serializer in run-time code and migration scripts to avoid hash drift

**Task 4.3: Fallback mention span**
- On parse-fail-after-context-pass, emit book-level mention using maximum local span available.
- Include punctuation when that punctuation is part of the matched matcher text.
- Implementation details (codebase-aligned):
  - Trigger conditions for fallback:
    - alias match is found and mapped (`matcherId`, offsets, bboxes available)
    - parser profile exists for the matcher's group
    - `contextPrecheck(localWindow)` returns `true`
    - `parse(localWindow)` returns zero segments
  - Fallback must not run when:
    - group has no parser profile (subject/alias-only groups)
    - `contextPrecheck` fails (treat as no-parse context, not parse failure)
  - Span selection algorithm (deterministic):
    - start from alias original span (`originalStart`, `originalEnd`) from alias engine result
    - include leading/trailing punctuation that is part of matcher text via mapped alias offsets (do not trim matcher punctuation)
    - attempt right-extension inside parser window (default 120 chars, cap 200) by consuming only citation-like tail chars: digits, spaces, `:`, `.`, `,`, `;`, `-`, `(`, `)`, and optional verse suffix letters (`a-z`)
    - stop extension at first non-citation-like char
    - if no valid extension exists, fallback span is matcher span only
  - Mention payload semantics:
    - mark candidate as `fallbackBookLevel: true` (or equivalent reason code) for downstream resolution/reporting
    - keep `textSpan` as exact original substring for the selected fallback span
    - map fallback span to bboxes with same position->bbox utilities used by normal candidates
  - Ordering and dedupe:
    - fallback candidates participate in the same deterministic ordering and dedupe keying as parsed candidates
    - if both parsed and fallback candidate accidentally resolve to identical key, prefer parsed candidate and drop fallback
- Suggested test coverage for Task 4.3:
  - parser-fail test: context passes + parse returns `[]` -> one fallback candidate emitted
  - no-fallback test: context precheck fails -> no fallback emitted
  - punctuation test: matcher text like `Gen.` preserves trailing period in fallback span
  - tail-extension test: `Gen 1:foo` captures only citation-like prefix and stops before invalid token
  - precedence test: when parsed and fallback collide on same dedupe key, parsed candidate wins

**Acceptance**
- Re-running same run inputs does not accumulate duplicate identical mentions.
- Matcher runs work without LLM/API keys.

### Phase 5: Entry Resolution + Scripture Child Entry/Matcher Emission

**Task 5.1: Subject resolution**
- Resolve directly to existing matcher/entry rows.
- Implementation details (codebase-aligned):
  - Add a subject resolution strategy in `entry-resolution.service.ts` that consumes matcher-phase candidates from Phase 4.
  - Resolution contract for `subject` index type:
    - do not create new `index_entries`
    - do not create new `index_matchers`
    - require candidate `matcherId` to resolve to an existing matcher in the same `projectIndexTypeId`
  - Repo lookup behavior:
    - fetch matcher by `matcherId` (and `projectIndexTypeId` guard)
    - derive `entryId` from matcher relation
    - if matcher is missing/mismatched, drop candidate and log as `resolution_miss` (non-fatal)
  - Mention persistence behavior:
    - persist mention linked to resolved matcher/entry (current schema may still store `entryId`; keep code path ready for matcher-linked mention schema)
    - preserve candidate `textSpan`, `pageNumber`, and mapped `bboxes` unchanged
    - apply Task 4.2 dedupe rules before/at insert
  - Deterministic processing:
    - resolve candidates in existing deterministic order from Phase 4
    - maintain stable counters: `candidatesSeen`, `resolved`, `persisted`, `deduped`, `dropped`
  - Failure handling:
    - one candidate resolution/persist failure must not fail the entire run
    - accumulate per-page warnings and continue
- Suggested test coverage for Task 5.1:
  - resolves valid subject candidate to existing matcher->entry and persists mention
  - does not create entries or matchers during subject resolution
  - drops candidate when matcher does not exist in current project/index type
  - preserves original `textSpan` and `bboxes` in persisted mention
  - duplicate resolved mentions are skipped per Task 4.2 without run failure

**Task 5.2: Scripture resolution strategy**
- Resolve canonical book alias -> parent entry.
- Create/reuse chapter/verse child entries as needed.
- For compound refs, segment and emit child entries/matchers per segment.
  - Example: `Gen 1:1-3, 2:4-5, 27` => `Genesis > 1:1-3`, `Genesis > 2:4-5`, `Genesis > 2:27`.
- Create/reuse matcher rows for emitted child-reference strings, preserving parsed punctuation/token intent.
- Attach mention to resolved child matcher.
- Implementation details (codebase-aligned):
  - Add a scripture resolution strategy in `entry-resolution.service.ts` that consumes parser segments from Phase 4 candidates.
  - Parent book resolution:
    - use candidate `matcherId` (book alias match) to resolve base matcher + parent entry
    - validate parent belongs to the run `projectIndexTypeId` and scripture index type
    - if base matcher/entry missing, drop candidate as `resolution_miss` (non-fatal)
  - Segment expansion rules:
    - if parsed segments exist, emit one resolution unit per segment (`refText`, chapter/verse metadata)
    - if no parsed segments and fallback flag is set, emit one book-level resolution unit
    - preserve segment order from parser output for deterministic persistence
  - Child entry create-or-reuse:
    - build deterministic child label/slug under parent entry from emitted segment text (book-level keeps parent)
    - lookup existing child by `(projectId, projectIndexTypeId, parentId, slug)` before insert
    - create missing child with `detectionRunId` set; reuse existing row when present
  - Child matcher create-or-reuse:
    - matcher text defaults to emitted `refText` (or book label for fallback/book-only mention)
    - lookup existing matcher by `(projectIndexTypeId, text)` and verify it points to intended child entry
    - if matcher exists for different entry, create a deterministic alternate text variant per conflict policy (for example suffixing disambiguator) instead of re-pointing existing matcher
  - Mention attachment:
    - persist one mention per emitted resolution unit attached to the resolved child matcher (or parent matcher for book-level fallback)
    - preserve original page/bbox span from detection candidate; do not rewrite text span during resolution
    - apply Task 4.2 dedupe semantics at insert time
  - Transaction and consistency:
    - per-candidate (or per-page batch) transaction should include child entry create/reuse, child matcher create/reuse, and mention insert
    - on unique conflict during create, re-query and continue (idempotent retry-safe behavior)
  - Metrics/logging:
    - track `childrenCreated`, `childrenReused`, `matchersCreated`, `matchersReused`, `mentionsPersisted`, `mentionsDeduped`, `resolutionMisses`
- Suggested test coverage for Task 5.2:
  - resolves book alias + one parsed segment to existing/reused child matcher mention
  - creates child entry and matcher when segment target does not yet exist
  - compound refs emit one mention per segment in stable order
  - fallback book-level candidate attaches mention without creating spurious child refs
  - rerun idempotency: no duplicate mentions, and child entry/matcher rows are reused
  - matcher text conflict case does not mutate existing matcher->entry mapping

**Task 5.3: Centralize resolution service**
- Suggested file: `apps/index-pdf-backend/src/modules/detection/entry-resolution.service.ts`
- Hide subject/scripture differences behind strategy interface.
- Implementation details (codebase-aligned):
  - Create `entry-resolution.service.ts` as the single integration point between Phase 4 candidate emission and DB persistence.
  - Define shared resolution interfaces:
    - `ResolutionCandidate` (input from matcher flow)
    - `ResolvedMentionWrite` (normalized persistence payload)
    - `ResolutionStrategy` with `canHandle(indexType)` and `resolve(candidate, ctx)` methods
  - Strategy registration:
    - `subjectResolutionStrategy` for Task 5.1 behavior
    - `scriptureResolutionStrategy` for Task 5.2 behavior
    - dispatch by run `indexType` (and optionally group profile metadata)
  - Service orchestration responsibilities:
    - accept deterministic candidate list
    - execute strategy resolution per candidate
    - apply shared dedupe + persistence path (Task 4.2)
    - aggregate counters/errors for run progress updates
  - Repo boundary split:
    - keep SQL in `detection.repo.ts` (or new `entry-resolution.repo.ts` if query volume grows)
    - keep parsing/decision logic in strategy/service layer only
    - no index-type-specific SQL branching in `detection.service.ts`
  - Error model:
    - strategy returns typed outcomes: `resolved`, `dropped`, `deduped`, `failed`
    - non-fatal candidate failures are collected and logged with structured reason codes
    - fatal errors only for infrastructure issues (DB unavailable, transaction failure)
  - Transaction model:
    - use one transaction boundary per candidate write bundle (or per page batch if performance-tested)
    - ensure child entry/matcher create-or-reuse + mention insert are atomic for scripture
  - Migration compatibility:
    - support current entry-linked mention schema and target matcher-linked mention schema behind one repository adapter
    - avoid leaking schema transition details into strategy code
  - `detection.service.ts` integration:
    - matcher run builds candidates -> calls `resolveAndPersistCandidates(...)` -> receives counters/status
    - keep run lifecycle (running/progress/completed/failed) unchanged
- Suggested test coverage for Task 5.3:
  - dispatch test: subject/scripture candidates route to correct strategy
  - contract test: both strategies return valid `ResolvedMentionWrite` or typed drop/failure outcomes
  - orchestration test: mixed candidate set aggregates counters deterministically
  - adapter test: same resolution payload persists correctly in entry-linked and matcher-linked mention modes

**Acceptance**
- Subject mentions resolve via existing matchers.
- Scripture mentions attach to child matchers under expected child entries.
- Compound refs create one mention per emitted child segment.

### Phase 6: IndexEntryGroup Data Model + Detection Integration

**Task 6.1: Data model**
- Add `index_entry_groups` + membership relation to entries/matchers.
- Add profile assignment per group.
- Add group sort mode metadata (`a-z`, canon order, etc.).
- Implementation details (codebase-aligned):
  - Add new table `index_entry_groups` (project-scoped, index-type-scoped):
    - columns: `id`, `project_id`, `project_index_type_id`, `name`, `slug`, `parser_profile_id`, `sort_mode`, `created_at`, `updated_at`, `deleted_at`
    - `parser_profile_id` stores predefined profile id (for example `scripture-biblical`) or `null` for alias-only groups
    - `sort_mode` enum/string includes at least `a_z` and canon-aware options used by scripture layouts
  - Add group membership relations:
    - `index_entry_group_entries` join table: `group_id`, `entry_id`, optional `position`
    - `index_entry_group_matchers` join table: `group_id`, `matcher_id`, optional `position`
    - both joins should support deterministic ordering for UI/render and matcher snapshot building
  - Constraints/indexes:
    - unique group slug per `(project_id, project_index_type_id)` excluding soft-deleted groups
    - unique membership per pair (`group_id + entry_id`, `group_id + matcher_id`)
    - FK guards ensure all related rows share compatible `project_index_type_id`
    - indexes for detection queries: `(project_index_type_id, group_id)` and `(group_id, matcher_id)`
  - RLS/policies:
    - inherit access from `projects` (same model as other indexing tables)
    - membership tables inherit via group/entry/matcher ownership checks
  - Migration plan:
    - add schema + constraints in one migration
    - backfill default groups only if required by existing project behavior; otherwise start empty and let UI create groups explicitly
    - update `db/schema/index.ts` exports and relations for Drizzle typing
  - API/repo shape updates:
    - add repository functions to list groups, fetch group matcher snapshot, and manage memberships
    - expose parser profile ids and sort modes as validated enums in input schemas
  - Detection integration contract from this task:
    - matcher run inputs (`indexEntryGroupIds` / `runAllGroups`) must resolve through these new tables only
    - per-group parser profile resolution reads `parser_profile_id` from `index_entry_groups`
- Suggested test coverage for Task 6.1:
  - migration test: tables/constraints created and enforce uniqueness/FK rules
  - repo test: group membership queries return deterministic matcher sets
  - validation test: invalid parser profile id or sort mode is rejected
  - soft-delete test: deleted groups are excluded from run targeting by default

**Task 6.2: Detection integration**
- Build matcher snapshot by selected groups.
- Enable per-group runs and run-all mode.
- Implementation details (codebase-aligned):
  - Run input resolution:
    - if `indexEntryGroupIds` is provided, load only those groups (validated to same `projectId` + `projectIndexTypeId`)
    - if `runAllGroups` is `true`, load all active groups for the run index type
    - reject run when resolved group set is empty
  - Group snapshot assembly (once per run):
    - fetch group metadata (`id`, `parser_profile_id`, `sort_mode`)
    - fetch group matchers via `index_entry_group_matchers` (or entry-derived matcher expansion if configured)
    - materialize alias rows as `AliasInput[]` with `groupId` populated
    - compile one alias index via `buildAliasIndex(...)`
  - Parser profile mapping:
    - resolve each group's `parser_profile_id` through `getParserProfile(...)`
    - for `null` profile groups, run alias-only behavior (no parser call)
    - if profile id is unknown, fail run early with explicit config error
  - `runMatcher` service integration:
    - replace stub processing with: page extraction -> alias scan -> per-group parse/fallback -> candidate emission -> resolution/persist
    - keep existing run lifecycle semantics (`queued` -> `running` -> `completed|failed|cancelled`)
    - keep page-level progress updates and cancellation checks
  - Scope handling:
    - `scope=project`: process canonical-allowed pages in document range
    - `scope=page`: resolve `pageId` to one document page and process only that page
    - both scopes share identical matcher/group pipeline; only target-page set differs
  - Determinism/performance:
    - never rebuild alias automaton per page; reuse run-level compiled snapshot
    - keep deterministic candidate order across groups: `pageNumber`, `charStart`, longer span first, stable `groupId` tiebreaker
    - cache group/profile lookup in-memory for the run
  - Observability:
    - log selected groups and matcher counts at run start
    - track per-group counters (`matchesFound`, `parseAttempts`, `segmentsEmitted`, `fallbacksEmitted`)
    - expose aggregated counts in run progress metadata where available
- Suggested test coverage for Task 6.2:
  - selected-group run only scans matchers from provided `indexEntryGroupIds`
  - run-all mode scans all active groups for the index type
  - page scope processes only the targeted page
  - null-profile group performs alias-only extraction; profiled group performs parse
  - unknown parser profile id causes deterministic run failure before scanning
  - matcher snapshot is built once per run, not once per page

**Task 6.3: Matcher-aware page coverage**
- Add run-coverage table keyed by page + matcher.
- Skip already-covered matcher/page pairs on subsequent runs.
- Implementation details (codebase-aligned):
  - Add coverage table for matcher runs (suggested: `detection_matcher_page_coverage`):
    - columns: `id`, `project_id`, `project_index_type_id`, `document_id`, `page_number`, `matcher_id`, `last_detection_run_id`, `covered_at`
    - optional metadata: `group_id`, `settings_hash` (if future invalidation by config is required)
  - Core uniqueness/indexing:
    - unique key on `(project_index_type_id, document_id, page_number, matcher_id)`
    - supporting indexes for lookup by run scope: `(project_id, project_index_type_id, page_number)` and `(matcher_id, page_number)`
  - Skip algorithm in matcher flow:
    - for each target page, compute candidate matcher ids from run snapshot
    - query existing coverage rows for `(document_id, page_number, matcher_id in snapshot)`
    - exclude covered matcher ids from alias scan work for that page
    - if all matchers are covered for page, mark page progress and continue without scan/parse
  - Coverage write timing:
    - write coverage rows only after candidate resolution/persistence stage completes for that page+matcher slice
    - use `insert ... on conflict do update` to refresh `last_detection_run_id` and `covered_at`
    - do not write coverage for cancelled/failed page processing
  - Scope and invalidation rules:
    - coverage is matcher-specific and page-specific; unaffected matchers still run
    - coverage should not be keyed by run id; it represents accumulated processing state
    - if matcher text/ownership changes are modeled as new matcher rows (immutable matcher policy), old coverage naturally remains isolated
  - Interaction with dedupe:
    - coverage skip prevents unnecessary compute
    - DB dedupe remains the correctness backstop if coverage is stale/missed
  - Observability:
    - track per run: `matchersConsidered`, `matchersSkippedByCoverage`, `pagesFullySkipped`, `coverageRowsWritten`
    - emit debug logs for first N skipped matcher/page pairs to aid validation
- Suggested test coverage for Task 6.3:
  - first run writes coverage rows for processed matcher/page pairs
  - second identical run skips covered matcher/page pairs and does less work
  - partial coverage case: page runs only uncovered matchers
  - cancellation case: no coverage rows are written for uncompleted work
  - unique constraint test: duplicate coverage inserts collapse via upsert without error

**Acceptance**
- Each group can run independently.
- Run-all mode works.
- Already-covered matcher/page pairs can be skipped.

### Phase 7: Scripture Bootstrapping + Canon Rules

**Task 7.1: Dedicated scripture-config table**
- Persist selected canon + corpora options in dedicated schema.
- Enforce canon mutual exclusivity based on `canons.ts`.
- Implementation details (codebase-aligned):
  - Add `scripture_index_configs` table keyed by project + index type context:
    - columns: `id`, `project_id`, `project_index_type_id`, `selected_canon`, `include_apocrypha`, `include_jewish_writings`, `include_classical_writings`, `include_christian_writings`, `include_dead_sea_scrolls`, `extra_book_keys`, `created_at`, `updated_at`
    - `selected_canon` stores canonical id from `packages/core/src/data/texts/bible/canons.ts`
    - `extra_book_keys` stores explicit additional book keys (outside selected canon) for opt-in bootstrapping
  - Constraints and uniqueness:
    - one config row per `(project_id, project_index_type_id)` via unique index
    - FK to `project_index_types` to ensure config is tied to an existing index type
    - optional check constraint ensuring this table is only used for scripture-type index configs
  - Canon mutual exclusivity enforcement:
    - validate incoming `selected_canon` against canon registry from `canons.ts`
    - reject payloads that attempt multiple canon selections in one config write
    - on update, treat canon switch as replace (old canon fully superseded, not merged)
  - API/service contract:
    - add repo/service methods: `getScriptureConfig`, `upsertScriptureConfig`
    - use strict input schema enums for canon ids and corpus toggles
    - persist via upsert so repeated saves are idempotent
  - Integration points:
    - Phase 7.2 bootstrap reads only from `scripture_index_configs` (no ad-hoc UI state)
    - Phase 6 matcher-group setup can reference config to prebuild default groups when bootstrap runs
  - Migration/backfill plan:
    - add table in new migration and wire schema exports/relations
    - no automatic backfill required for existing projects unless scripture index already exists; if needed, create minimal default config with null canon and all corpora toggles false
  - Observability:
    - record config updates in event log/audit trail with before/after canon + corpus flags
    - expose last-updated timestamp for UI freshness checks
- Suggested test coverage for Task 7.1:
  - upsert creates and then updates single config row per project/index type
  - invalid canon id is rejected at validation boundary
  - canon switch replaces previous selection (no multi-canon coexistence)
  - corpus flags and `extra_book_keys` persist/reload round-trip correctly
  - non-scripture index type cannot write scripture config (if check enforced)

**Task 7.2: Explicit bootstrap workflow**
- Seed entries/matchers for:
  - selected canon
  - Apocrypha
  - Jewish Writings
  - Classical Writings
  - Christian Writings
  - Dead Sea Scrolls
  - optional additional HB/NT books not in selected canon
- Implementation details (codebase-aligned):
  - Add explicit bootstrap endpoint/service (for example `scriptureBootstrap.run`) invoked only by user action.
  - Bootstrap input source:
    - load config from `scripture_index_configs` (Task 7.1)
    - require `selected_canon` before execution; reject if missing
    - read corpus toggles and `extra_book_keys` from config only (no implicit defaults)
  - Source datasets:
    - canon book lists from `packages/core/src/data/texts/bible/canons.ts`
    - matcher dictionaries from `packages/core/src/data/texts/*/matchers.ts` (or generated dictionary where appropriate)
    - labels from canonical text label sources already used in the project
  - Seeding order (deterministic):
    - seed selected canon books first
    - then optional corpora in fixed order: Apocrypha -> Jewish Writings -> Classical Writings -> Christian Writings -> Dead Sea Scrolls
    - then `extra_book_keys` (HB/NT additions outside selected canon)
  - Entry/matcher create-or-reuse rules:
    - top-level entries created/reused by deterministic slug under scripture `projectIndexTypeId`
    - matcher rows created/reused from source alias lists with stable normalization policy
    - never mutate existing matcher text in place; create missing matcher rows only
  - Group assignment during bootstrap:
    - create/reuse default `IndexEntryGroup` rows per corpus/canon bucket if absent
    - attach seeded entries/matchers to target groups using membership tables from Phase 6
    - preserve deterministic membership ordering via `position`
  - Idempotency and safety:
    - repeated bootstrap with same config should create zero duplicate entries/matchers/memberships
    - use upsert or unique-conflict retry/requery paths for all created entities
    - log summary counts: `entriesCreated`, `entriesReused`, `matchersCreated`, `matchersReused`, `groupsCreated`, `membershipsCreated`
  - Canon switch behavior:
    - bootstrap is additive by default (existing rows remain editable)
    - newly selected canon books are seeded/reused; previously seeded books are not auto-deleted
    - optional future "reconcile/prune" mode should be explicit and separate from default bootstrap
  - Run recording/audit:
    - store bootstrap run metadata (timestamp, config snapshot hash, counts, actor id)
    - emit structured events for observability and troubleshooting
- Suggested test coverage for Task 7.2:
  - bootstrap fails fast when `selected_canon` is missing
  - selected canon seeds expected book entries and aliases
  - corpus toggles control whether optional corpora are seeded
  - rerun with same config is idempotent (no duplicate rows)
  - canon switch followed by bootstrap adds/reuses new canon content without deleting old rows
  - default groups and memberships are created/reused deterministically

**Task 7.3: Post-seed editability**
- Ensure groups/entries/matchers are editable after seed.
- Implementation details (codebase-aligned):
  - Treat bootstrap as initial data creation only; seeded rows remain first-class editable records.
  - Entry edit behavior:
    - allow updating seeded entry `label`, group memberships, and ordering metadata
    - keep `slug` stable by default; if slug edits are allowed, enforce uniqueness constraints and non-destructive rename semantics
    - allow moving entries between groups without breaking existing mentions
  - Matcher edit behavior:
    - matcher text is immutable under current matcher policy; "edit" becomes create-new-matcher + optional deactivate/remove old matcher from groups
    - preserve existing matcher->entry links unless user explicitly reassigns via supported workflow
    - seeded matcher rows should be removable from groups without deleting underlying mention history
  - Group edit behavior:
    - seeded groups can be renamed, reordered, have profile/sort settings changed, and membership adjusted
    - deleting a group should remove memberships only; it must not delete entries/matchers
  - Seed provenance model:
    - mark seeded rows with provenance metadata (for example `seed_source`, `seeded_at`, `seed_run_id`) for audit/debug only
    - provenance must not gate edit permissions or force read-only UI state
  - Re-bootstrap interaction:
    - re-bootstrap should reuse rows by stable keys and preserve user edits where possible (labels/group placement should not be silently overwritten)
    - optional "force refresh from source labels" mode should be explicit and opt-in
  - API/service updates:
    - ensure existing CRUD endpoints for entries/matchers/groups apply equally to seeded and manually-created rows
    - enforce same validation/authorization paths for both seeded and non-seeded data
  - Safety constraints:
    - prevent destructive cascades when editing/deleting seeded organizational structures
    - preserve mention integrity when matchers are superseded or memberships change
- Suggested test coverage for Task 7.3:
  - seeded entry label and group membership can be edited after bootstrap
  - seeded matcher cannot be mutated in place; replacement flow creates new matcher row
  - deleting seeded group removes memberships but keeps entries/matchers intact
  - re-bootstrap does not overwrite user-customized labels/group placements by default
  - mention links remain valid after post-seed reorganizations

**Acceptance**
- User can seed via explicit action.
- Seeded data can be reorganized across groups.

### Phase 8: UI Surface (Project Sidebar, Page Sidebar, Index Sidebar)

**Task 8.1: Project sidebar detection controls**
- Mode selector (`LLM`/`Matcher`)
- Group selector + run-all option
- Project-level run action
- Implementation details (codebase-aligned):
  - Add project-sidebar control panel component for detection runs with two mutually exclusive modes:
    - `LLM` mode submits to `detection.runLlm`
    - `Matcher` mode submits to `detection.runMatcher`
  - Matcher mode inputs:
    - `runAllGroups` checkbox/toggle
    - multiselect `indexEntryGroupIds` (disabled when `runAllGroups=true`)
    - enforce contract: exactly one of non-empty group selection or `runAllGroups=true`
  - LLM mode inputs:
    - retain existing model/prompt version controls
    - do not show matcher-specific group targeting fields
  - Shared project-level run behavior:
    - always submit `scope: "project"` in matcher mode
    - disable run button while mutation is in-flight
    - show immediate run creation feedback with run id/status link in run history UI
  - Validation/error UX:
    - block submit with inline error when matcher mode has invalid group selection state
    - surface backend schema errors from `RunMatcherSchema`/`RunLlmSchema` directly in form
    - show empty-state guidance when no groups exist for matcher mode
  - Data loading:
    - fetch available groups for current `projectId` + active index type
    - include group metadata useful for selection (name, parser profile label, matcher count)
    - refresh group list after group CRUD changes without full page reload
  - State persistence:
    - persist last-used mode and matcher selection per project/index type in local UI state (or project settings if supported)
    - default to last-used valid combination on reopen
  - Accessibility/interaction:
    - keyboard-accessible mode switch and group multiselect
    - clear disabled/explanatory text when controls are unavailable (for example no groups)
  - Observability:
    - emit client telemetry for run trigger events (mode, runAllGroups flag, selected group count, scope)
    - record failed submit reason buckets (validation vs API failure)
- Suggested test coverage for Task 8.1:
  - matcher mode submits `detection.runMatcher` with `scope=project` and correct group payload
  - run-all toggle and group multiselect remain mutually exclusive
  - invalid matcher selection state blocks submit and shows inline error
  - llm mode submits `detection.runLlm` and hides matcher-only controls
  - no-groups matcher state shows guidance and disables run action
  - in-flight mutation disables run action and prevents double-submit

**Task 8.1.1: Matcher detection without groups (run all matchers)**
- Allow matcher detection runs when zero index entry groups exist.
- Rationale: Index entry groups are for organization and index-page rendering (e.g. grouping entries, controlling layout). They are not a prerequisite for running detection. Subject index: users create entries and matchers; detection can run over all matchers for that index type without creating groups. Scripture index: groups are useful for selecting which books/scriptures to include, but detection could also run over all scripture matchers; groups again organize output on the Index page.
- Implementation details:
  - Backend: Support a run that uses all matchers for the given `projectId` + `projectIndexTypeId` when no groups exist (or when user explicitly chooses "run all matchers"). Options: (a) when `runAllGroups: true` and the resolved group set is empty, treat as "run all matchers" for that index type; or (b) add an explicit input (e.g. `runAllMatchers: true`) and resolve to all matchers for the projectIndexType. Ensure detection pipeline accepts a matcher set that is not group-scoped (e.g. flat list of aliases from all entries/matchers for that type).
  - Frontend: In MatcherRunControls (and equivalent page-sidebar control in 8.2), when there are no groups: show a single action "Run matcher detection (all matchers)" instead of empty-state guidance that disables run. When groups exist, keep current behavior (run all groups / select groups). Subject panel: "run all matchers" is the primary path when no groups exist; Scripture panel: same option, with group-based selection available when groups are present.
  - Telemetry: include a flag or mode indicating "no groups / run all matchers" for analytics.
- Acceptance:
  - User with index entries and matchers but no index entry groups can run matcher detection from the Subject (and Scripture) panel.
  - When groups exist, behavior unchanged (run all groups or select groups).

**Task 8.1.2: Clarify empty-state copy for matcher detection**
- Update MatcherRunControls (and 8.2 page-sidebar) empty-state messaging to align with 8.1.1: when no groups exist, emphasize "Run detection using all matchers in this index" (or similar) rather than only "create groups first." Keep secondary copy that explains groups are for organization and index layout when the user later adds groups.

**Task 8.2: Page sidebar detection controls**
- Group selector + run-all option
- Page-level run action
- Implementation details (codebase-aligned):
  - Add page-sidebar matcher control panel for page-scoped runs only.
  - Inputs and validation mirror project sidebar matcher mode:
    - `runAllGroups` toggle
    - `indexEntryGroupIds` multiselect (disabled when `runAllGroups=true`)
    - enforce exactly one valid targeting mode before submit
  - Page-scoped submission contract:
    - call `detection.runMatcher` with `scope: "page"` and current `pageId`
    - include `projectId`, active `indexType`, and either `runAllGroups=true` or selected `indexEntryGroupIds`
    - block submit when `pageId` is unavailable/invalid
  - UX behavior:
    - disable run action while request is in-flight
    - show inline feedback on success (run id / queued status) and failure (validation/API errors)
    - display empty-state guidance when no groups exist and `runAllGroups` is not usable
  - Data loading/state:
    - reuse group list source used by Task 8.1 (filtered by current project/index type)
    - keep per-page sidebar state lightweight; persist last-used group targeting per project/index type
    - reset invalid cached selections when group list changes
  - Run history/progress integration:
    - ensure created run appears in detection run list with `scope=page` and associated `pageId`
    - page UI should surface status transitions (`queued`, `running`, `completed`, `failed`, `cancelled`)
  - Accessibility/telemetry:
    - keyboard-accessible controls and explicit disabled reasons
    - emit telemetry for page run trigger with `scope=page`, `pageId`, mode, and selected-group cardinality
- Suggested test coverage for Task 8.2:
  - submits `detection.runMatcher` with `scope=page` and correct `pageId`
  - run-all and explicit group selection are mutually exclusive
  - missing/invalid `pageId` blocks submit and shows inline error
  - in-flight state prevents duplicate submissions
  - page-scoped run appears in run history with page metadata
  - API validation errors are surfaced in page sidebar form

**Task 8.2 implementation (completed):**
- **Matcher controls** in Subject, Author, Scripture index panels: `PageMatcherRunControls` component in each panel. Reuses `useMatcherRunState` and shared UI from project sidebar. Calls `detection.runMatcher` with `scope: "page"` and `pageId` (computed via `documentPageId` frontend utility). No page range inputs (page scope = single page). Persists group targeting in localStorage with `detection-matcher-page-{projectId}-{indexType}` key.
- **LLM controls** in AI section: `PageDetectionPanel` in `PageAiContent`. Separate from matcher controls, mirroring project sidebar structure. Calls `detection.runLlm` with `pageRangeStart=pageRangeEnd=currentPage` (no backend changes). Index type buttons (Subject, Author, Scripture), run history, cancel support.
- **Shared utilities:** `documentPageId` from `@pubint/core` (cross-platform SHA-256 via @noble/hashes), `useMatcherRunState` hook, `MatcherRunControlsShared` and `MatcherRunControlsEmptyState` components.
- **Deviations:** LLM page-level runs added (not in original spec); uses `pageRangeStart=pageRangeEnd` rather than a dedicated `scope=page` for LLM.

**Task 8.3: Index entry groups in project sidebar (completed)**

Implemented per the index_group_layout_sidebar and group_row_and_drag_sort plans. **No layout blocks** (H1, H2, H3, GroupRef); groups integrate into the existing project sidebar EntryTree.

- **Backend:**
  - `custom` sort mode in `index_entry_group_sort_mode` enum; `position` column on `index_entry_groups` for group order
  - Group CRUD tRPC: create, update, delete, addEntry, removeEntry, getGroup; `addEntryToGroup` removes entry from other groups first (transfer), returns `transferredFrom` when applicable
  - `reorderGroupEntries` mutation for custom sort within group; `reorderGroups` and `mergeGroups` mutations
  - `listMatcherAliasesByGroupIds` unions matchers from `index_entry_group_matchers` and entry-based groups
  - Entry list includes `groupId`; `listGroupsWithEntries` (or equivalent) for tree building
- **Frontend:**
  - **Entry modals**: group selector in EntryCreationModal and EntryEditModal (root entries only); transfer warning when changing group
  - **EditGroupModal**: group metadata, searchable entry add/remove, transfer warning; delete with confirmation
  - **EntryTree**: groups in bordered boxes; Create Group button; open Edit Group on group row click; edit/merge/delete buttons on hover (via shared TreeRow)
  - **TreeRow**: shared component for entry and group rows (drag handle, expand icon, label, action buttons)
  - **GroupItem**: replaces group button; uses TreeRow; draggable for reorder
  - **Custom sort**: drag entries within group when `sort_mode = 'custom'`; call `reorderGroupEntries` on drop; switching from a_z/canon to custom snapshots current order
  - **Group drag-to-reorder**: drop zones between groups; `onReorderGroups` wired to `reorderGroups` mutation
  - **MergeGroupModal**: merge source into target; moves entries and matchers, deletes source
  - **Collapsible groups**: groups expand/collapse like entries with children
- **Index page**: optional group-as-section rendering or keep flat tree; format flexible for export
- **Validation**: unique group name/slug per project/index type; one group per entry; root entries only in groups
- Suggested test coverage:
  - create/edit/delete group flows persist correctly
  - group and entry drag-to-reorder persist positions
  - transfer warning when moving entry between groups
  - merge groups moves entries/matchers and deletes source
  - group/profile updates reflected in detection control group lists

**Task 8.4: Scripture setup controls**
- Canon selection + corpora toggles + additional-book selection
- Trigger bootstrapping endpoint
- Implementation details (codebase-aligned):
  - Add Scripture setup section in sidebar tied to the active scripture index type.
  - Configuration controls:
    - single-select canon dropdown sourced from `canons.ts` ids/labels
    - corpus toggles for Apocrypha, Jewish Writings, Classical Writings, Christian Writings, Dead Sea Scrolls
    - searchable multi-select for `extra_book_keys` (HB/NT books outside selected canon)
  - Config persistence flow:
    - load via `getScriptureConfig`
    - save via `upsertScriptureConfig`
    - autosave or explicit save button (project convention), with dirty-state indicator
    - enforce one-canon-only at UI and backend validation layers
  - Bootstrap trigger UX:
    - explicit `Bootstrap Scripture Data` action button (never auto-run on config change)
    - confirmation dialog summarizes selected canon/corpora and expected scope of seeded data
    - call bootstrap endpoint from Task 7.2 and surface run summary counts on completion
  - Validation and guardrails:
    - disable bootstrap action until required config is valid (`selected_canon` present)
    - show warnings for large corpus combinations (estimate of entries/matchers to seed)
    - prevent duplicate bootstrap clicks while request is in-flight
  - Progress/error handling:
    - show pending/running state and final status (`success`, `partial`, `failed`)
    - display actionable error messages (invalid canon id, missing scripture index type, permission issues)
    - provide retry action for failed bootstrap without losing saved config
  - Integration behavior:
    - after successful bootstrap, refresh groups/memberships and detection group selectors (Tasks 8.1/8.2)
    - keep user edits to existing entries/groups intact; bootstrap is additive unless explicit reconcile mode exists
  - Accessibility/telemetry:
    - all controls keyboard-accessible with labels/help text
    - telemetry events for config save and bootstrap trigger/completion/failure with selected option cardinalities
- Suggested test coverage for Task 8.4:
  - canon/corpus/extra-book selections persist and reload correctly
  - bootstrap button is disabled when config is invalid (for example no canon selected)
  - successful bootstrap call shows completion summary and refreshes dependent sidebar data
  - bootstrap errors are surfaced without clearing saved config
  - in-flight bootstrap state prevents double submission

**Acceptance**
- User can run matcher detection from project or page context.
- User can manage index entry groups in the project sidebar (create, edit, delete, reorder, merge) and assign entries to groups from entry modals.

### Phase 9: Test Strategy + Performance Gates

**Task 9.1: Unit tests**
- normalization + offset mapping
- boundary/overlap filtering
- parser profile contract + scripture parser grammar matrix
- Implementation details (codebase-aligned):
  - Keep unit tests close to modules already introduced in earlier phases:
    - `packages/core/src/text/normalization.test.ts`
    - `apps/index-pdf-backend/src/modules/detection/alias-engine.test.ts`
    - `packages/core/src/scripture/ref-parser.test.ts`
    - add focused unit tests for fallback span and dedupe-key helpers where implemented
  - Normalization/offset-map unit matrix:
    - NFKC folding cases, dash normalization variants, whitespace collapse, punctuation preservation
    - span mapping correctness for collapse/expansion cases (half-open interval contract)
    - deterministic round-trip assertions for `mapNormalizedSpanToOriginalSpan`
  - Alias engine unit matrix:
    - boundary rejection for mid-word hits (letters/numbers/underscore adjacency)
    - overlap resolution (longest-first, earliest-start tiebreak)
    - duplicate normalized alias mapping to multiple matcher metas
    - deterministic sorted output ordering
  - Parser profile unit matrix:
    - profile registry lookups (`getParserProfile`, unknown ids)
    - scripture grammar positives: chapter, verse, ranges, lists, cross-chapter, suffixes
    - negatives for false positives (`see page 1`, free prose digits)
    - context precheck behavior for book-only and empty windows
  - New helper-unit scope:
    - fallback span extension boundaries and punctuation retention
    - canonical bbox serializer/hash determinism used by dedupe
    - candidate ordering comparator stability
  - Quality gates:
    - each rule in README contracts should map to at least one explicit test
    - avoid snapshot-only tests for parser outputs; prefer exact structural assertions
    - enforce deterministic test seeds/data for stable CI
- Suggested test coverage for Task 9.1:
  - offset map returns expected original indices for mixed Unicode whitespace/dash samples
  - alias overlap case keeps only longest match and stable ordering
  - parser emits correct segment list for compound refs and rejects known negatives
  - fallback helper preserves matcher punctuation and stops at invalid tail chars
  - dedupe key helper yields same key for equivalent bbox permutations

**Task 9.2: Integration tests**
- matcher-linked mention persistence
- scripture child entry/matcher creation
- per-group vs run-all run behavior
- page-level vs project-level run behavior
- dedupe/idempotency across repeated runs
- matcher coverage skip behavior
- Implementation details (codebase-aligned):
  - Add integration suites under backend detection module using existing test DB/factory setup:
    - prefer end-to-end module flows through `detection.service` + repo writes
    - mock expensive external dependencies (LLM, PDF extraction) while preserving real DB behavior
  - Core matcher persistence scenarios:
    - matcher run creates expected mention rows linked to resolved matcher/entry contract
    - rerun with identical inputs is idempotent (no duplicate mentions)
    - pre-existing mention rows are respected by dedupe logic
  - Scripture resolution scenarios:
    - parsed segments create/reuse child entries and child matchers deterministically
    - compound refs generate one mention per segment in parser order
    - fallback book-level path persists mention when parse fails after context pass
  - Group/scope execution scenarios:
    - selected-group run includes only selected group matchers
    - run-all mode includes all active groups
    - page scope limits work to a single page; project scope spans allowed pages
  - Coverage-skip scenarios:
    - first run writes matcher/page coverage
    - second run skips covered matcher/page pairs and performs less processing
    - partial coverage executes only uncovered matcher/page work
  - Failure/cancellation scenarios:
    - run cancellation mid-processing stops further page work and does not write coverage for unfinished slices
    - per-candidate non-fatal resolution failures are logged while run completes
  - Assertions/observability:
    - verify run status transitions and progress counters
    - assert created/reused/deduped counters where exposed
    - validate deterministic ordering effects in persisted outputs when applicable
- Suggested test coverage for Task 9.2:
  - integration happy path: matcher run persists mentions and marks run `completed`
  - rerun idempotency: mention count unchanged on second identical run
  - scripture compound reference path creates expected child hierarchy + mentions
  - selected-group vs run-all produce different matcher scan sets as expected
  - page-scope run touches only target page
  - coverage table causes skip on second run while preserving correctness
