# Scripture Parsing Task 06: Cleanup And Regression Hardening

## Objective

Finalize the migration by removing primary-path dependence on current regex-first parser surfaces and hardening the regression tests.

## Depends On

- [scripture-parsing-task-01-parser-contract.md](/home/john/Development/publication-intelligence/docs/development/06-matcher-detection/scripture-parsing-task-01-parser-contract.md)
- [scripture-parsing-task-02-alias-tail-parser.md](/home/john/Development/publication-intelligence/docs/development/06-matcher-detection/scripture-parsing-task-02-alias-tail-parser.md)
- [scripture-parsing-task-03-bookless-scan.md](/home/john/Development/publication-intelligence/docs/development/06-matcher-detection/scripture-parsing-task-03-bookless-scan.md)
- [scripture-parsing-task-04-alias-window-integration.md](/home/john/Development/publication-intelligence/docs/development/06-matcher-detection/scripture-parsing-task-04-alias-window-integration.md)
- [scripture-parsing-task-05-unknown-scan-integration.md](/home/john/Development/publication-intelligence/docs/development/06-matcher-detection/scripture-parsing-task-05-unknown-scan-integration.md)

## Why This Task Exists

After the functional migration is complete, the repo still needs a cleanup pass so the new architecture is clear and the regression suite proves the new ownership model:

- parser owns citation consumption
- service layer owns orchestration, offsets, and persistence

## In Scope

- remove or de-emphasize current regex-first helpers from the primary code paths
- tighten tests to assert stop behavior and source-span behavior
- verify the final scripture detection flow against the master spec

## Out Of Scope

- no new feature expansion
- no DB schema work
- no alias-engine redesign

## Files To Read

- [scripture-parsing-updates.md](/home/john/Development/publication-intelligence/docs/development/06-matcher-detection/scripture-parsing-updates.md)
- [ref-parser.ts](/home/john/Development/publication-intelligence/packages/core/src/scripture/ref-parser.ts)
- [ref-parser.test.ts](/home/john/Development/publication-intelligence/packages/core/src/scripture/ref-parser.test.ts)
- [detection.service.ts](/home/john/Development/publication-intelligence/apps/index-pdf-backend/src/modules/detection/detection.service.ts)
- [detection.service.test.ts](/home/john/Development/publication-intelligence/apps/index-pdf-backend/src/modules/detection/detection.service.test.ts)

## Files To Edit

- [ref-parser.ts](/home/john/Development/publication-intelligence/packages/core/src/scripture/ref-parser.ts)
- [ref-parser.test.ts](/home/john/Development/publication-intelligence/packages/core/src/scripture/ref-parser.test.ts)
- [detection.service.ts](/home/john/Development/publication-intelligence/apps/index-pdf-backend/src/modules/detection/detection.service.ts)
- [detection.service.test.ts](/home/john/Development/publication-intelligence/apps/index-pdf-backend/src/modules/detection/detection.service.test.ts)

## Required Context

By the time this task starts:

- alias-attached parsing should already use `parseAfterAlias(...)`
- page-wide `Unknown` scanning should already use the parser-backed bookless scan

The goal here is to make sure the codebase reflects that clearly.

## Implementation Requirements

1. Remove primary-path dependence on `findStandaloneRefSpans(...)` from the scripture detection flow.
   Compatibility exports may remain if still useful, but they should no longer be the main engine.

2. Remove or simplify parser code paths that only existed to support the previous regex-first workflow, as long as no current callers require them.

3. Strengthen tests so they assert:
   - parser stop reasons
   - consumed spans
   - source offsets
   - alias-path versus `Unknown` routing
   - ambiguous mixed-book behavior

4. Keep the current public behavior aligned with the master spec examples.

5. If compatibility helpers remain, make their role explicit and non-primary in code comments or naming where appropriate.

## Acceptance Criteria

1. The primary scripture detection flow in `detection.service.ts` no longer uses regex-first standalone ref discovery.
2. The parser is clearly the source of truth for citation consumption.
3. Tests cover parser stop behavior and source spans, not just final segments.
4. The final state matches the master spec acceptance criteria.

## Suggested Verification

Run:

```bash
pnpm --filter @pubint/core test:unit -- src/scripture/ref-parser.test.ts
pnpm --filter @pubint/index-pdf-backend test:unit -- src/modules/detection/detection.service.test.ts
pnpm --filter @pubint/core typecheck
pnpm --filter @pubint/index-pdf-backend typecheck
```

Optional inspection:

```bash
rg -n "findStandaloneRefSpans" packages/core/src/scripture apps/index-pdf-backend/src/modules/detection
```

Interpretation:

- it is acceptable if compatibility references remain in tests or non-primary helpers
- it is not acceptable if the primary scripture detection flow still depends on it

## Notes For The Agent

- Do not broaden this into a new feature pass.
- Keep cleanup changes evidence-driven.
- If removing a helper is risky, it is acceptable to leave it in place as long as the primary flow no longer depends on it and the code makes that clear.
