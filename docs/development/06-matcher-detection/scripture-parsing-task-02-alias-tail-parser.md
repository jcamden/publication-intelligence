# Scripture Parsing Task 02: Core Alias-Tail Parser

## Status

**Complete.** Verification: `pnpm --filter @pubint/core test:unit -- src/scripture/ref-parser.test.ts` and `pnpm --filter @pubint/core typecheck` pass.

- **Done:**
  - Real `parseAfterAlias(...)` behavior in `ref-parser.ts` (consuming parser with `parseAfterAliasImpl`, `scanBlockEnd`, verse-suffix and “and” handling).
  - Returns parse status, consumed span (`consumedStart`/`consumedEnd`), `consumedText`, segment source offsets, stop reason, `hasExplicitRefSyntax`.
  - Citation forms: chapter only/range, single verse, verse range/lists/lists with ranges, semicolon-separated refs, cross-chapter ranges, verse suffixes, optional leading `and`.
  - Stop reasons: end of input, new book (`otherBookAliases`), prose, invalid syntax, closing paren.
  - `parse(...)` preserved as a thin wrapper over the new logic (via `refPortion` + `parseAfterAliasImpl`); existing parser-matrix and compatibility tests pass.
  - Required tests added: Deut 12:1, Deut 1:5; 4:44; and 6:1, Gen 1:20-2:4, stop at new book, prose stop, parenthetical/non-attached case, consumed span and source-offset assertions (contract-based).
  - Consumed span semantics: starts at first ref character (after any leading/per-block whitespace; extra e.g. tab not consumed), ends at last ref character (trailing space excluded). Tests lock both.
- **Out of scope (as specified):**
  - No backend integration; `detection.service.ts` unchanged.

## Objective

Implement the new parser-driven alias-tail consumer in `packages/core/src/scripture`.

This task should build the real `parseAfterAlias(...)` behavior. It should not change backend service integration yet.

## Depends On

- [scripture-parsing-task-01-parser-contract.md](/home/john/Development/publication-intelligence/docs/development/06-matcher-detection/scripture-parsing-task-01-parser-contract.md)

## Why This Task Exists

The current parser only parses isolated ref text after it has already been discovered. The target design requires the parser to consume the citation tail directly after an alias hit and report:

- parsed segments
- consumed span
- stop reason
- source offsets relative to the provided window

## In Scope

- implement `parseAfterAlias(...)` in the core scripture parser
- add parser helpers needed for alias-tail consumption
- update core parser tests for alias-tail behavior
- keep existing compatibility surfaces working if practical

## Out Of Scope

- do not change `detection.service.ts`
- do not change the page-wide `Unknown` scan yet
- do not refactor the backend alias-window pipeline yet

## Files To Read

- [scripture-parsing-updates.md](/home/john/Development/publication-intelligence/docs/development/06-matcher-detection/scripture-parsing-updates.md)
- [scripture-parsing-task-01-parser-contract.md](/home/john/Development/publication-intelligence/docs/development/06-matcher-detection/scripture-parsing-task-01-parser-contract.md)
- [ref-parser.ts](/home/john/Development/publication-intelligence/packages/core/src/scripture/ref-parser.ts)
- [ref-parser.test.ts](/home/john/Development/publication-intelligence/packages/core/src/scripture/ref-parser.test.ts)

## Files To Edit

- [ref-parser.ts](/home/john/Development/publication-intelligence/packages/core/src/scripture/ref-parser.ts)
- [ref-parser.test.ts](/home/john/Development/publication-intelligence/packages/core/src/scripture/ref-parser.test.ts)

## Do Not Edit

- [detection.service.ts](/home/john/Development/publication-intelligence/apps/index-pdf-backend/src/modules/detection/detection.service.ts)
- [detection.service.test.ts](/home/john/Development/publication-intelligence/apps/index-pdf-backend/src/modules/detection/detection.service.test.ts)

## Required Context

For alias-attached parsing:

- the book is already known externally from the alias match
- input begins at or immediately after the alias boundary
- the parser should consume only the citation tail that belongs to that alias
- the parser should stop deterministically on prose, invalid continuation, or a new book alias

The parser should become the source of truth for citation consumption. It should not depend on pre-discovered standalone ref spans.

## Implementation Requirements

1. Implement real `parseAfterAlias(...)` behavior.
   It must return:
   - parse status
   - consumed span within the local window
   - consumed text
   - source-relative offsets for each emitted segment
   - stop reason

2. Support the main citation forms already in the master spec:
   - chapter only
   - chapter range
   - single verse
   - verse range
   - verse lists
   - verse lists with ranges
   - semicolon-separated refs
   - cross-chapter ranges
   - verse suffixes
   - optional leading `and`

3. Support stopping when another book begins.
   Use the `otherBookAliases` input. Do not invent free-text book detection beyond that input.

4. Support parser stop reasons that distinguish at least:
   - end of input
   - new book
   - prose
   - invalid syntax
   - closing delimiter if applicable

5. Preserve or adapt the existing `parse(...)` implementation so current compatibility surfaces still work.
   It is acceptable for `parse(...)` to become a thin wrapper over the new core parser.

## Acceptance Criteria

1. `parseAfterAlias(...)` no longer behaves like a trivial wrapper around the old `parse(...)`.
2. It returns source offsets for parsed segments relative to the provided local window.
3. It can stop cleanly on a new book alias and on prose.
4. It supports the core citation forms required by the master spec.
5. No backend service integration has been attempted in this task.

## Required Tests

Add or update tests for:

- `Deut 12:1`
- `Deut 1:5; 4:44; and 6:1`
- `Gen 1:20-2:4`
- stopping at a new book in `Deut 32:44-47; 34:9; Josh 1:1-9`
- prose stop in `Deuteronomy 1:6-18 appointing judges`
- parenthetical/non-attached case in `Deuteronomy calls for ... (6:5-9)`
- consumed span and source-offset assertions, not just segment arrays

## Verification

Run:

```bash
pnpm --filter @pubint/core test:unit -- src/scripture/ref-parser.test.ts
pnpm --filter @pubint/core typecheck
```

## Notes For The Agent

- Do not integrate with `findRefSpansInAliasWindow(...)` in this task.
- Do not add a separate regex discovery layer.
- If you need tokenization helpers, keep them private to `ref-parser.ts` unless there is a strong reason to export them.
