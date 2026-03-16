# Scripture Parsing Task 05: `Unknown` Scan Integration

## Objective

Replace the backend page-wide standalone ref scan with the new parser-backed bookless scan.

## Depends On

- [scripture-parsing-task-01-parser-contract.md](/home/john/Development/publication-intelligence/docs/development/06-matcher-detection/scripture-parsing-task-01-parser-contract.md)
- [scripture-parsing-task-03-bookless-scan.md](/home/john/Development/publication-intelligence/docs/development/06-matcher-detection/scripture-parsing-task-03-bookless-scan.md)
- [scripture-parsing-task-04-alias-window-integration.md](/home/john/Development/publication-intelligence/docs/development/06-matcher-detection/scripture-parsing-task-04-alias-window-integration.md)

## Why This Task Exists

The project still needs a path for refs that are not safely attachable to a matched book alias. Today that path is the page-wide standalone scan in `detection.service.ts`, which is regex-first and only later invokes the parser.

This task switches that path to the new shared parser primitives.

## In Scope

- refactor the page-wide `Unknown` scan in `detection.service.ts`
- use the new bookless parser surface
- update service tests for `Unknown` behavior

## Out Of Scope

- do not redesign alias-window parsing again
- do not change entry-resolution semantics for `Unknown`
- do not remove compatibility surfaces yet

## Files To Read

- [scripture-parsing-updates.md](/home/john/Development/publication-intelligence/docs/development/06-matcher-detection/scripture-parsing-updates.md)
- [scripture-parsing-task-03-bookless-scan.md](/home/john/Development/publication-intelligence/docs/development/06-matcher-detection/scripture-parsing-task-03-bookless-scan.md)
- [detection.service.ts](/home/john/Development/publication-intelligence/apps/index-pdf-backend/src/modules/detection/detection.service.ts)
- [detection.service.test.ts](/home/john/Development/publication-intelligence/apps/index-pdf-backend/src/modules/detection/detection.service.test.ts)
- [entry-resolution.service.ts](/home/john/Development/publication-intelligence/apps/index-pdf-backend/src/modules/detection/entry-resolution.service.ts)

## Files To Edit

- [detection.service.ts](/home/john/Development/publication-intelligence/apps/index-pdf-backend/src/modules/detection/detection.service.ts)
- [detection.service.test.ts](/home/john/Development/publication-intelligence/apps/index-pdf-backend/src/modules/detection/detection.service.test.ts)

## Do Not Edit

- [entry-resolution.service.ts](/home/john/Development/publication-intelligence/apps/index-pdf-backend/src/modules/detection/entry-resolution.service.ts) unless a compile fix is unavoidable

## Required Context

This task is only about the page-wide bookless path that emits `Unknown` scripture candidates.

Keep:

- `Unknown` entry routing
- overlap exclusion against already-covered ranges
- child-entry resolution semantics for `Unknown`

Replace:

- page-wide regex-first standalone ref discovery

With:

- parser-backed bookless scanning using the same grammar primitives as alias-tail parsing

## Implementation Requirements

1. Replace the standalone-scan path in `detection.service.ts` with `profile.scanBookless(...)` or equivalent.

2. Continue excluding refs that overlap already-covered alias-attached candidate ranges.

3. Use parser-emitted source spans to map back to original page offsets.

4. Emit `Unknown` candidates from the parser output using the same candidate structure expected by the rest of the flow.

5. Preserve product intent:
   - bookless refs remain `Unknown`
   - trigger-led refs like `chapter 3 verse 5` can be detected by the bookless path
   - ambiguous refs that were not safely attached to a book alias can still surface through `Unknown` when appropriate

## Acceptance Criteria

1. The page-wide `Unknown` scan no longer depends on the regex-first standalone scan as its primary mechanism.
2. It uses the shared parser-backed bookless surface.
3. Overlap exclusion with already-covered alias-attached candidates still works.
4. `Unknown` candidate creation and downstream resolution continue to work.

## Required Tests

Add or update service tests for:

- page text containing bookless refs like `As noted in 4:35 and again in 5:1-3`
- trigger-led bookless refs like `chapter 3 verse 5`
- overlap exclusion where alias-attached refs should suppress duplicate `Unknown` candidates
- ambiguous mixed-book examples where leftover bookless refs can route to `Unknown`

## Verification

Run:

```bash
pnpm --filter @pubint/index-pdf-backend test:unit -- src/modules/detection/detection.service.test.ts
pnpm --filter @pubint/index-pdf-backend typecheck
```

## Notes For The Agent

- Keep overlap filtering conservative.
- Do not invent free-text book detection here.
- Do not let this task turn into an entry-resolution rewrite.
