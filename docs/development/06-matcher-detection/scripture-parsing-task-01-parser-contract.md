# Scripture Parsing Task 01: Parser Contract And Compatibility Shims

## Objective

Introduce the new parser contract in `packages/core/src/scripture` without changing the backend detection flow yet.

This task exists to give later tasks a stable type surface and export surface.

## Why This Task Exists

The current parser API is too weak for the target design because it only returns `ParsedRefSegment[]`. Later tasks need richer parse results that include:

- parse status
- consumed span
- segment source offsets
- stop reason

This task should add that contract first, while keeping the current code compiling and behavior stable.

## In Scope

- add new parser result types
- extend the `ParserProfile` interface
- update the current scripture parser profile to satisfy the new interface with conservative compatibility shims
- update exports so later tasks can import the new types and methods

## Out Of Scope

- do not implement the new consuming parser yet
- do not change `apps/index-pdf-backend/src/modules/detection/detection.service.ts`
- do not refactor `findRefSpansInAliasWindow(...)`
- do not replace the current standalone scan yet

## Files To Read

- [scripture-parsing-updates.md](/home/john/Development/publication-intelligence/docs/development/06-matcher-detection/scripture-parsing-updates.md)
- [parser-profile.types.ts](/home/john/Development/publication-intelligence/packages/core/src/scripture/parser-profile.types.ts)
- [ref-parser.ts](/home/john/Development/publication-intelligence/packages/core/src/scripture/ref-parser.ts)
- [parser-profiles.ts](/home/john/Development/publication-intelligence/packages/core/src/scripture/parser-profiles.ts)
- [index.ts](/home/john/Development/publication-intelligence/packages/core/src/scripture/index.ts)

## Files To Edit

- [parser-profile.types.ts](/home/john/Development/publication-intelligence/packages/core/src/scripture/parser-profile.types.ts)
- [ref-parser.ts](/home/john/Development/publication-intelligence/packages/core/src/scripture/ref-parser.ts)
- [parser-profiles.ts](/home/john/Development/publication-intelligence/packages/core/src/scripture/parser-profiles.ts)
- [index.ts](/home/john/Development/publication-intelligence/packages/core/src/scripture/index.ts)

## Do Not Edit

- [detection.service.ts](/home/john/Development/publication-intelligence/apps/index-pdf-backend/src/modules/detection/detection.service.ts)
- [detection.service.test.ts](/home/john/Development/publication-intelligence/apps/index-pdf-backend/src/modules/detection/detection.service.test.ts)

## Required Context

The target architecture is:

1. alias engine finds a book alias
2. parser consumes the local citation tail
3. parser returns richer structural information
4. service layer later uses that result

This task should only establish the richer parser contract and compatibility shims for the current parser profile.

## Implementation Requirements

1. Add new result types in `parser-profile.types.ts`.
   Required concepts:
   - `CitationStopReason`
   - parsed segment source offsets
   - parse status such as `match`, `book_only`, `no_match`, `ambiguous`
   - consumed span and consumed text

2. Extend `ParserProfile`.
   Keep the existing `contextPrecheck(...)` and current `parse(...)` surface for now.
   Add new methods for the later migration, for example:
   - `parseAfterAlias(...)`
   - optional `scanBookless(...)`

3. Update `scriptureParserProfile` in `ref-parser.ts` so it satisfies the new interface.
   For this task, conservative wrappers are acceptable:
   - `parseAfterAlias(...)` may derive its result from the current parser behavior
   - `scanBookless(...)` may be omitted or left as a minimal placeholder if the interface allows it

4. Preserve current behavior as much as possible.
   This task should not materially change how existing tests behave.

5. Export the new types and new profile surface from the `scripture` package entrypoints.

## Acceptance Criteria

1. The `@pubint/core` scripture parser types support richer parse results.
2. `scriptureParserProfile` compiles against the new `ParserProfile` interface.
3. Existing current parser behavior is preserved closely enough that current tests still pass.
4. No backend service code has been changed.

## Verification

Run:

```bash
pnpm --filter @pubint/core test:unit -- src/scripture/ref-parser.test.ts
pnpm --filter @pubint/core typecheck
```

## Notes For The Agent

- Do not try to solve the whole migration in this task.
- The goal is a clean contract that later tasks can build on.
- If you need a compatibility wrapper, prefer a small explicit wrapper over speculative redesign.
