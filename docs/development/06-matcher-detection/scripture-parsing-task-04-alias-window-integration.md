# Scripture Parsing Task 04: Alias-Window Integration

## Objective

Switch alias-attached scripture detection in the backend to use the new parser-driven alias-tail result instead of `findStandaloneRefSpans(...)` plus heuristics.

## Depends On

- [scripture-parsing-task-01-parser-contract.md](/home/john/Development/publication-intelligence/docs/development/06-matcher-detection/scripture-parsing-task-01-parser-contract.md)
- [scripture-parsing-task-02-alias-tail-parser.md](/home/john/Development/publication-intelligence/docs/development/06-matcher-detection/scripture-parsing-task-02-alias-tail-parser.md)

## Why This Task Exists

The current backend function [`findRefSpansInAliasWindow(...)`](/home/john/Development/publication-intelligence/apps/index-pdf-backend/src/modules/detection/detection.service.ts#L383) still:

- discovers ref spans separately
- filters them with prose/punctuation heuristics
- parses them afterward

The target design is for the parser to consume the citation tail directly and for the service layer to become thin orchestration.

## In Scope

- refactor alias-attached scripture parsing in `detection.service.ts`
- update service tests for alias-window behavior
- keep existing bbox mapping and candidate persistence flow intact

## Out Of Scope

- do not change the page-wide `Unknown` scan yet
- do not remove compatibility exports from the core parser yet
- do not redesign entry resolution

## Files To Read

- [scripture-parsing-updates.md](/home/john/Development/publication-intelligence/docs/development/06-matcher-detection/scripture-parsing-updates.md)
- [scripture-parsing-task-02-alias-tail-parser.md](/home/john/Development/publication-intelligence/docs/development/06-matcher-detection/scripture-parsing-task-02-alias-tail-parser.md)
- [detection.service.ts](/home/john/Development/publication-intelligence/apps/index-pdf-backend/src/modules/detection/detection.service.ts)
- [detection.service.test.ts](/home/john/Development/publication-intelligence/apps/index-pdf-backend/src/modules/detection/detection.service.test.ts)
- [ref-parser.ts](/home/john/Development/publication-intelligence/packages/core/src/scripture/ref-parser.ts)

## Files To Edit

- [detection.service.ts](/home/john/Development/publication-intelligence/apps/index-pdf-backend/src/modules/detection/detection.service.ts)
- [detection.service.test.ts](/home/john/Development/publication-intelligence/apps/index-pdf-backend/src/modules/detection/detection.service.test.ts)

## Do Not Edit

- the page-wide `Unknown` scan path in this task, except for unavoidable compile fixes

## Required Context

This task is only about the alias-attached path.

Keep:

- alias matching via `scanTextWithAliasIndex(...)`
- local-window normalization and offset mapping
- truncation at the next book alias
- bbox mapping and candidate creation

Replace:

- `findStandaloneRefSpans(...)` as the primary discovery mechanism inside `findRefSpansInAliasWindow(...)`
- the current punctuation/prose heuristic chain used to decide whether spans belong to the alias

## Implementation Requirements

1. Refactor `findRefSpansInAliasWindow(...)` or replace it with an equivalent thin wrapper.

2. The function should:
   - build the local normalized alias window
   - determine `otherBookAliases` for stopping behavior
   - call the new parser `parseAfterAlias(...)`
   - map parser-relative offsets back to page-relative offsets
   - emit one result per parsed segment

3. The function should not:
   - call `findStandaloneRefSpans(...)` for primary discovery
   - reimplement large amounts of prose/punctuation logic that the parser now owns

4. Preserve existing high-level semantics:
   - same-book chained refs should attach to the alias
   - parsing should stop at a new book
   - obviously prose-followed fragments should not become clean alias-attached mentions

5. Use parser result status to drive behavior.
   Required intent:
   - `match` with segments -> emit segment results
   - `book_only` -> do not emit ref spans here; allow existing fallback path to handle book-level mention behavior
   - `ambiguous` or `no_match` -> do not emit alias-attached ref spans

6. Do not change the page-wide `Unknown` path yet.

## Acceptance Criteria

1. Alias-attached parsing in `detection.service.ts` no longer depends on `findStandaloneRefSpans(...)` as its primary discovery mechanism.
2. `findRefSpansInAliasWindow(...)` becomes thin orchestration around parser output and offset mapping.
3. Existing candidate and bbox flow still works.
4. The `Unknown` scan path is unchanged in this task.

## Required Tests

Update or add service tests for:

- `Deut 12:1`
- `Deut 1:5; 4:44; and 6:1`
- `Deut 32:44-47; 34:9; Josh 1:1-9`
- parenthetical/prose case such as `Deuteronomy calls for ... (6:5-9)`
- prose stop such as `Deuteronomy 1:6-18 appointing judges`
- exact page offset mapping from parser source spans

## Verification

Run:

```bash
pnpm --filter @pubint/index-pdf-backend test:unit -- src/modules/detection/detection.service.test.ts
pnpm --filter @pubint/index-pdf-backend typecheck
```

## Notes For The Agent

- Keep the change focused on the alias path only.
- If existing fallback logic depends on old parser signals, adapt it minimally to use the new parser result status.
- Do not mix this task with the page-wide `Unknown` scan rewrite.
