# Scripture Parsing Task 03: Bookless Scan And Trigger Language

## Objective

Implement parser-backed bookless citation scanning, including trigger-word support for omitted-book references.

This task should add the new `scanBookless(...)` or `scanBooklessCitations(...)` behavior in `packages/core/src/scripture`, but it should not integrate that behavior into backend detection yet.

## Depends On

- [scripture-parsing-task-01-parser-contract.md](/home/john/Development/publication-intelligence/docs/development/06-matcher-detection/scripture-parsing-task-01-parser-contract.md)
- [scripture-parsing-task-02-alias-tail-parser.md](/home/john/Development/publication-intelligence/docs/development/06-matcher-detection/scripture-parsing-task-02-alias-tail-parser.md)

## Why This Task Exists

The final architecture still needs a page-wide path for refs that cannot be confidently attached to a book alias. That path should use the same grammar primitives as alias-tail parsing, not a separate regex-first system.

This task builds that bookless parsing surface in the core parser.

## In Scope

- implement parser-backed bookless scanning in `ref-parser.ts`
- support trigger words for chapter and verse references
- support implied-book passage forms using the same grammar primitives as alias-tail parsing
- expand core parser tests for bookless scanning

## Out Of Scope

- do not change `detection.service.ts`
- do not replace the backend `Unknown` scan yet
- do not refactor alias-attached parsing in the backend

## Files To Read

- [scripture-parsing-updates.md](/home/john/Development/publication-intelligence/docs/development/06-matcher-detection/scripture-parsing-updates.md)
- [scripture-parsing-task-02-alias-tail-parser.md](/home/john/Development/publication-intelligence/docs/development/06-matcher-detection/scripture-parsing-task-02-alias-tail-parser.md)
- [ref-parser.ts](/home/john/Development/publication-intelligence/packages/core/src/scripture/ref-parser.ts)
- [ref-parser.test.ts](/home/john/Development/publication-intelligence/packages/core/src/scripture/ref-parser.test.ts)

## Files To Edit

- [ref-parser.ts](/home/john/Development/publication-intelligence/packages/core/src/scripture/ref-parser.ts)
- [ref-parser.test.ts](/home/john/Development/publication-intelligence/packages/core/src/scripture/ref-parser.test.ts)

## Do Not Edit

- [detection.service.ts](/home/john/Development/publication-intelligence/apps/index-pdf-backend/src/modules/detection/detection.service.ts)
- [detection.service.test.ts](/home/john/Development/publication-intelligence/apps/index-pdf-backend/src/modules/detection/detection.service.test.ts)

## Required Context

Bookless scanning is for refs that appear without an explicit matched book alias.

It must:

- reuse the same grammar primitives as alias-tail parsing
- support trigger-led references like `chapter 3`, `vv. 5-7`, `chapter 3 verse 5`
- support implied-book passage forms like `1:1`, `1:1-3`, `1:20-2:4`
- avoid treating arbitrary prose numbers as scripture when no alias or trigger justifies that interpretation

## Implementation Requirements

1. Implement `scanBookless(...)` or `scanBooklessCitations(...)` in the core parser.
   It should return parse results using the same richer result shape introduced earlier.

2. Reuse parser primitives from alias-tail parsing.
   Do not build a second grammar for bookless refs.

3. Support trigger words listed in the master spec.
   Required triggers include:
   - chapter triggers: `chapter`, `chapters`, `chap`, `chap.`, `ch`, `ch.`, `chs`, `chs.`
   - verse triggers: `verse`, `verses`, `v`, `v.`, `vv`, `vv.`, `vs`, `vs.`
   - combined forms like `chapter 3 verse 5`, `ch 3 vv 5-7`

4. Support implied-book passage forms such as:
   - `1`
   - `1-3`
   - `1:1`
   - `1:1-3`
   - `1:1,3,5`
   - `1:20-2:4`
   - `1:1; 2:3`

5. Be conservative about false positives.
   Bare numbers should not be interpreted as scripture in random prose without alias context or trigger context.

6. If the API already accepts `occupiedRanges`, it is acceptable for this task to leave overlap filtering conservative or minimal. Full backend overlap handling is a later integration task.

## Acceptance Criteria

1. Core bookless scanning exists and returns richer parse results.
2. Trigger-led parsing works for chapter, verse, and combined chapter-plus-verse forms.
3. The bookless scanner shares grammar behavior with alias-tail parsing.
4. False-positive behavior is conservative for untriggered prose numbers.
5. No backend integration has been attempted in this task.

## Required Tests

Add or update tests for:

- `As noted in 4:35 and again in 5:1-3`
- `chapter 3`
- `chapters 3-5`
- `vv. 5-7`
- `chapter 3 verse 5`
- `ch 3 vv 5-7`
- `1:1; 2:3`
- a negative prose example where bare numbers should not parse without trigger context
- if implemented, tests for `1:3f`, `1:3ff`, or suffix ranges like `1:3a-b`

## Verification

Run:

```bash
pnpm --filter @pubint/core test:unit -- src/scripture/ref-parser.test.ts
pnpm --filter @pubint/core typecheck
```

## Notes For The Agent

- Do not use free-text book detection.
- Do not reintroduce regex-first standalone span discovery as the main algorithm.
- Trigger words belong in the grammar/tokenization layer, not as a string preprocessor bolted on top.
