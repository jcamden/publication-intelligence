# Scripture Parsing Updates

## Purpose

This document is an implementation spec for upgrading scripture parsing in matcher detection.

The main recommendation is:

- keep the alias engine and the current matcher-resolution pipeline
- replace heuristic scripture span assignment with a parser-driven local citation consumer
- keep `Unknown` handling, but make it use the same parser primitives instead of a separate regex-first path

## Decision Summary

### Keep

- `scanTextWithAliasIndex(...)` as the way to detect candidate book aliases
- project-specific matcher aliases and overlap resolution
- scripture child-entry creation and matcher-linked mention persistence
- the `Unknown` book fallback for refs that cannot be assigned to a specific book with confidence
- local-window parsing rather than full-page mega-regex or n-gram scanning

### Replace

- most of the heuristic logic inside [`findRefSpansInAliasWindow`](/home/john/Development/publication-intelligence/apps/index-pdf-backend/src/modules/detection/detection.service.ts#L383)
- the current dependency on `findStandaloneRefSpans(...)` as the primary way to discover refs inside an alias window
- the current page-wide standalone scan path that depends on regex-first ref discovery and only later runs the parser

### Do Not Build

- a full-page scripture parser that tries to find book names and refs without using the matcher alias engine
- a solution that keeps adding ad hoc punctuation/prose heuristics in `detection.service.ts`

## Current Problems

The current implementation has the right outer architecture but the wrong inner ownership of parsing.

Today:

1. Alias matching finds a book mention.
2. `findRefSpansInAliasWindow(...)` truncates the local window and calls `findStandaloneRefSpans(...)`.
3. Additional heuristics decide whether each discovered ref is explicit enough to belong to the alias.
4. The parser only parses the already-discovered span text.

That means citation ownership is split across:

- regex-like span discovery in `packages/core/src/scripture/ref-parser.ts`
- prose/punctuation heuristics in `apps/index-pdf-backend/src/modules/detection/detection.service.ts`
- structural parsing in `packages/core/src/scripture/ref-parser.ts`

This split is brittle. The parser should own citation consumption.

## Architectural Direction

The new architecture should be:

1. Alias engine finds a book alias.
2. A parser consumes the citation tail after that alias.
3. The parser reports:
   - which segments were parsed
   - how much source text was consumed
   - why parsing stopped
   - whether the result is explicit, ambiguous, or empty
4. Detection service uses that result to:
   - assign refs to the matched book
   - fall back to book-level mention when appropriate
   - route ambiguous/bookless refs to `Unknown`

The parser must become the source of truth for local citation structure. The service layer should only orchestrate windows, offsets, and persistence.

## What To Replace

### 1. Replace alias-window span discovery

Current code to replace:

- [`findRefSpansInAliasWindow(...)`](/home/john/Development/publication-intelligence/apps/index-pdf-backend/src/modules/detection/detection.service.ts#L383)
- especially the `findStandaloneRefSpans(...)` call and subsequent filtering logic in [`detection.service.ts`](/home/john/Development/publication-intelligence/apps/index-pdf-backend/src/modules/detection/detection.service.ts#L430)

Current responsibilities in that function:

- truncate at the next book alias
- find standalone ref spans
- filter refs based on delimiters and prose checks
- parse individual spans
- map spans back to original offsets

Target replacement:

- keep the window truncation and original-offset mapping
- replace span-finding plus heuristics with a single parser-driven consume step

New behavior:

- the parser receives the normalized text after the alias
- it consumes as much valid citation text as belongs to that alias
- it returns segment spans relative to the local window
- `detection.service.ts` maps those spans back to original offsets and creates candidates

### 2. Replace page-wide standalone regex-first scan

Current code to replace:

- the `Unknown` scan path in [`detection.service.ts`](/home/john/Development/publication-intelligence/apps/index-pdf-backend/src/modules/detection/detection.service.ts#L1094)

Current responsibilities:

- scan the full normalized page for standalone ref spans
- skip spans already covered by alias-attached candidates
- parse each discovered span afterwards
- emit `Unknown` candidates

Target replacement:

- use a parser-backed `scanBooklessCitations(...)` function that finds and consumes bookless citations using the same grammar primitives as alias-tail parsing

This path should still exist, but it should no longer be an unrelated regex-first implementation.

### 3. Replace the current parser API

Current parser API:

- `contextPrecheck(localWindow): boolean`
- `parse(localWindow): ParsedRefSegment[]`

This API is too weak because it does not report:

- how much text was consumed
- where each segment came from in the source
- why parsing stopped
- whether the parse was explicit or ambiguous

Target parser API should return a richer result.

## What To Build Instead

## New Parser Contract

Create a new parser contract in `packages/core/src/scripture`.

Suggested types:

```ts
export type CitationSegment = {
  refText: string;
  chapter?: number;
  chapterEnd?: number;
  verseStart?: number;
  verseEnd?: number;
  verseSuffix?: string;
  sourceStart: number;
  sourceEnd: number;
};

export type CitationStopReason =
  | "end_of_input"
  | "new_book"
  | "prose"
  | "invalid_syntax"
  | "closing_paren"
  | "unsupported_pattern";

export type CitationParseResult = {
  status: "match" | "book_only" | "no_match" | "ambiguous";
  consumedText: string;
  consumedStart: number;
  consumedEnd: number;
  segments: CitationSegment[];
  stopReason: CitationStopReason;
  hasExplicitRefSyntax: boolean;
};
```

The exact field names can differ, but the result must include the same concepts.

### Required parser entry points

Build two explicit entry points.

```ts
parseCitationAfterAlias(args: {
  normalizedWindow: string;
  otherBookAliases: string[];
}): CitationParseResult;

scanBooklessCitations(args: {
  normalizedText: string;
  occupiedRanges: Array<{ start: number; end: number }>;
}): Array<CitationParseResult>;
```

These two entry points must share grammar primitives. They must not drift into separate parsing systems.

## Grammar Scope

The new parser must support at least the cases already supported by the current parser:

- book only: `Gen`
- chapter only: `Gen 1`
- chapter range: `Gen 1-3`
- single verse: `Gen 1:2`
- dotted verse style: `Gen 1.2`
- verse range: `Gen 1:2-4`
- verse list: `Gen 1:1, 2, 3`
- verse list with ranges: `Gen 31:1-8, 14-15, 23`
- semicolon-separated refs: `Gen 1:1-3; 2:4`
- cross-chapter range: `Gen 1:20-2:4`
- verse suffixes: `Gen 1:3a`
- optional leading `and`: `Gen 1:5; 4:44; and 6:1`

It must also preserve existing high-level product behavior:

- stop when a new explicit book begins
- do not assign prose-followed fragments to the current alias
- allow ambiguous/bookless refs to fall through to `Unknown`

## Additional Grammar Inputs To Apply

The following additions should be incorporated into the new parser design. They are applicable, but some need adaptation to fit this repo's architecture.

### Trigger words for omitted-book references

These trigger words are applicable and should be explicitly supported by the parser-backed bookless scan.

They are also applicable inside alias-attached parsing when they clearly continue a citation tail after a matched book.

#### Chapter triggers

Support all of the following:

- `chapter`
- `chapters`
- `chap`
- `chap.`
- `ch`
- `ch.`
- `chs`
- `chs.`

Examples that should parse as chapter-oriented references:

- `chapter 3`
- `chapters 3-5`
- `ch 3`
- `ch. 3`
- `chs 3-5`
- `chs. 3-5`
- `chapter 3, 5, 7`
- `chs 3-5, 8`

#### Verse triggers

Support all of the following:

- `verse`
- `verses`
- `v`
- `v.`
- `vv`
- `vv.`
- `vs`
- `vs.`

Examples that should parse as verse-oriented references:

- `verse 3`
- `verses 3-5`
- `v 3`
- `v. 3`
- `vv 3-5`
- `vv. 3-5`
- `vs 3-5`
- `vs. 3-5`
- `verse 3, 5, 8`
- `verses 3-5, 8`
- `vv 3, 5-7`

#### Combined chapter + verse trigger language

These patterns are also applicable:

- `chapter 3 verse 5`
- `chapter 3 verses 5-7`
- `ch 3 v 5`
- `ch 3 vv 5-7`
- `chapter 3, verse 5`
- `ch 3:5`
- `ch 3 v. 5`
- `ch. 3 vv. 5-7`

Implementation note:

- this should not be implemented as a separate ad hoc preprocessor
- it should be part of the actual grammar/tokenization layer
- the parser should understand trigger-led chapter mode, verse mode, and chapter-plus-verse mode

### Expanded core reference patterns

These patterns are applicable and should be part of the parser's supported forms.

#### With explicit book

Support:

- `BOOK`
- `BOOK CH`
- `BOOK CH-CH`
- `BOOK CH:V`
- `BOOK CH:V-V`
- `BOOK CH:V,V,V`
- `BOOK CH:V-V,V`
- `BOOK CH:V-CH:V`
- `BOOK CH:V; CH:V`
- `BOOK CH:V; BOOK CH:V`

Examples:

- `Gen`
- `Gen 1`
- `Gen 1-3`
- `Gen 1:1`
- `Gen 1:1-3`
- `Gen 1:1,3,5`
- `Gen 1:1-3,5`
- `Gen 1:20-2:4`
- `Gen 1:1; 2:3`
- `Gen 1:1; Exod 3:2`

#### With implied book

All of the same passage structures should be supported in bookless mode:

- `CH`
- `CH-CH`
- `CH:V`
- `CH:V-V`
- `CH:V,V,V`
- `CH:V-V,V`
- `CH:V-CH:V`
- `CH:V; CH:V`

Examples:

- `1`
- `1-3`
- `1:1`
- `1:1-3`
- `1:1,3,5`
- `1:1-3,5`
- `1:20-2:4`
- `1:1; 2:3`

Implementation note:

- in alias-attached parsing, the explicit book is already known from the matcher hit, so the parser should usually parse the passage tail rather than reparsing the book token itself
- in bookless scanning, these same passage forms should be reused without requiring a book token

### Number structures and separators

These numeric forms are applicable and should be recognized directly in the parser grammar.

#### Number structures

Support:

- chapter numbers like `1`, `23`, `119`
- verse numbers like `1`, `23`, `176`
- ranges like `1-3`
- lists like `1,3,5` and `1, 3, 5`
- mixed lists like `1-3,5,7-9`
- cross-chapter ranges like `1:20-2:4`
- verse suffixes like `1:3a`, `1:3b`

Strongly consider support for:

- suffix ranges like `1:3a-b`
- `f` and `ff` notation like `1:3f`, `1:3ff`, `1:3 ff`

Implementation note:

- `f` and `ff` support is desirable, but can be staged if entry-resolution semantics are unclear
- if implemented, the parse result should preserve that notation explicitly rather than silently normalizing it to a guessed verse range

#### Separators

Support:

- `:` as chapter/verse separator
- `.` as alternate chapter/verse separator
- `,` as list separator
- `;` as reference separator
- `-`, en dash, and em dash as range separators after normalization

### EBNF-like grammar guidance

The proposed grammar below is useful and should inform the parser design, but it must be adapted to this repo.

Useful baseline:

```ebnf
ScriptureReference
  = Reference { ";" Reference } ;

Reference
  = [Book] Passage ;

Passage
  = ChapterOnly
  | ChapterRange
  | VersePassage ;

ChapterOnly
  = Chapter ;

ChapterRange
  = Chapter "-" Chapter ;

VersePassage
  = Chapter VerseSeparator VerseSpec ;

VerseSpec
  = Verse
  | VerseRange
  | VerseList
  | VerseRangeList
  | CrossChapterRange ;

VerseRange
  = Verse "-" Verse ;

VerseList
  = Verse { "," Verse } ;

VerseRangeList
  = VerseRange { "," VerseRange | "," Verse } ;

CrossChapterRange
  = Chapter ":" Verse "-" Chapter ":" Verse ;

Chapter
  = Integer ;

Verse
  = Integer [VerseSuffix] ;

VerseSuffix
  = "a" | "b" | "c" ;

VerseSeparator
  = ":" | "." ;
```

This should be adapted as follows:

- do not make `Book = Word { Word | Integer }` a general parser rule in the matcher backend
- book recognition in this repo should remain matcher-driven, not free-text-driven
- for alias-attached parsing, the book has already been resolved externally
- for bookless scanning, the parser should focus on passage recognition and trigger words, not on inventing new free-text book detection

### Triggered-reference grammar

This proposed grammar is applicable and should be folded into the new parser:

```ebnf
TriggeredReference
  = ChapterTrigger ChapterPassage
  | VerseTrigger VersePassage
  | ChapterVerseTrigger Chapter VersePassage ;

ChapterTrigger
  = "chapter" | "chapters"
  | "chap" | "chap."
  | "ch" | "ch."
  | "chs" | "chs." ;

VerseTrigger
  = "verse" | "verses"
  | "v" | "v."
  | "vv" | "vv."
  | "vs" | "vs." ;
```

Adaptation notes:

- `ChapterVerseTrigger = ChapterTrigger VerseTrigger` is too narrow if copied literally
- the implementation should support real surface forms like:
  - `chapter 3 verse 5`
  - `chapter 3, verse 5`
  - `ch 3 v 5`
  - `ch. 3 vv. 5-7`
- the parser should treat these as trigger-led passage forms, not as standalone regex exceptions

## Implementation Shape

The parser should be implemented as a small consuming parser, not as a “find spans with regex, then filter” system.

Recommended internal stages:

1. Tokenize the normalized local window.
2. Recognize optional trigger words:
   - chapter triggers
   - verse triggers
   - combined chapter-plus-verse trigger language
3. Consume optional separators immediately after the alias or trigger.
4. Parse one ref atom.
5. Parse chained refs joined by:
   - `,`
   - `;`
   - `and`
6. Stop when:
   - a new book token begins
   - prose begins
   - unsupported syntax appears
   - a closing delimiter ends citation context

This can be a handwritten parser. It does not need an external parser-combinator library unless the implementation is clearly cleaner.

## Trigger Semantics

Trigger words should influence how bare numbers are interpreted.

Recommended semantics:

- chapter triggers permit bare chapter numbers and chapter ranges
- verse triggers permit bare verse numbers and verse ranges, but only when a chapter context is already available or when the result is intentionally bookless and unresolved
- combined chapter-plus-verse trigger language establishes chapter context before verse parsing

Examples:

- `ch 3` -> chapter 3
- `chs 3-5, 8` -> chapter list/ranges
- `vv. 5-7` after a known chapter context -> verses 5 through 7
- `chapter 3 verse 5` -> chapter 3, verse 5
- `ch 3 vv 5-7` -> chapter 3, verses 5 through 7

Important constraint:

- trigger words should not cause random prose numbers to be treated as scripture if the trigger is absent
- this means trigger-based parsing is a stricter mode than generic bare-number parsing
- in practice, bare `1` or `1-3` should usually require either alias context or trigger context

## File-by-File Plan

### `packages/core/src/scripture/parser-profile.types.ts`

Replace the minimal `parse(...) => ParsedRefSegment[]` contract with a richer parse-result contract.

Required changes:

- keep `ParsedRefSegment` if useful for downstream resolution
- add a new result type that includes:
  - consumed span
  - segment source offsets
  - stop reason
  - parse status

Suggested direction:

```ts
export type ParsedCitationSegment = ParsedRefSegment & {
  sourceStart: number;
  sourceEnd: number;
};

export type ParsedCitationResult = {
  status: "match" | "book_only" | "no_match" | "ambiguous";
  consumedStart: number;
  consumedEnd: number;
  consumedText: string;
  stopReason: string;
  segments: ParsedCitationSegment[];
};

export type ParserProfile = {
  id: string;
  contextPrecheck: (localWindow: string) => boolean;
  parseAfterAlias: (localWindow: string, args?: {
    otherBookAliases?: string[];
  }) => ParsedCitationResult;
  scanBookless?: (text: string, args?: {
    occupiedRanges?: Array<{ start: number; end: number }>;
  }) => ParsedCitationResult[];
};
```

It is acceptable to keep the existing `parse(...)` temporarily during migration, but the new code path must stop depending on it.

### `packages/core/src/scripture/ref-parser.ts`

This file should become the main parser implementation.

Required work:

- keep the grammar knowledge from the current implementation
- move standalone scanning from regex-first to parser-backed consuming logic
- add `parseCitationAfterAlias(...)`
- add `scanBooklessCitations(...)`
- return source-relative offsets for segments and the consumed citation span

Important:

- do not keep `findStandaloneRefSpans(...)` as the primary parser surface
- it can remain temporarily as a compatibility shim, but the new detection path should not depend on it

### `packages/core/src/scripture/parser-profiles.ts`

Update the profile registry to expose the richer parser profile.

No major architecture change needed here.

### `apps/index-pdf-backend/src/modules/detection/detection.service.ts`

Refactor scripture detection in two places.

#### Alias-attached citation extraction

Current:

- `findRefSpansInAliasWindow(...)` uses `findStandaloneRefSpans(...)`
- heuristics determine whether each span belongs to the alias

Replace with:

- `parseRefsForAliasWindow(...)` or keep the same function name but change internals
- call `profile.parseAfterAlias(...)`
- map the parser result back to original offsets
- create one candidate per parsed segment

The function should become thin. Its job should be:

1. create normalized alias window with offset map
2. determine other-book aliases in that window
3. call parser
4. convert parser-relative spans into page-relative spans
5. return matcher candidates

The function should not:

- rediscover ref spans with a separate scanner
- apply large amounts of punctuation/prose logic that duplicates parser behavior

#### `Unknown` scan

Current:

- full-page standalone scan with regex-first discovery

Replace with:

- call `profile.scanBookless(...)` or `scanBooklessCitations(...)`
- filter out results overlapping already-covered ranges
- create `Unknown` candidates from parser-emitted spans and segments

### `apps/index-pdf-backend/src/modules/detection/detection.service.test.ts`

Replace tests that only assert heuristic filter behavior with tests that assert parser-driven consumption behavior.

Keep the intent of existing tests, but rewrite around the new contract.

Add tests for:

- parser stop reason
- consumed span length
- alias assignment versus `Unknown`
- new-book stopping
- prose stopping
- exact source-span mapping

### `packages/core/src/scripture/ref-parser.test.ts`

Expand this file substantially.

The current grammar matrix is a good start, but it is not enough for a parser-driven refactor.

Add:

- parse-result structure assertions, not just segment arrays
- source offset assertions
- stop-reason assertions
- bookless scan assertions
- negative cases drawn from real PDF text

## Exact Replacement Guidance

### Replace this pattern

Current pattern:

1. find ref-like spans
2. inspect text between alias and span
3. inspect text after span
4. parse the isolated span text

### With this pattern

1. parse from the alias boundary forward
2. let the parser decide the maximal consumed citation
3. emit segment spans directly from parser output
4. only use service-layer logic for:
   - offset mapping
   - overlap exclusion
   - persistence routing

## Behavior Examples

These examples are normative. New code should satisfy them.

### Example 1: simple explicit citation

Input:

```txt
Deut 12:1
```

Expected:

- alias engine matches `Deut`
- parser consumes `12:1`
- result attaches to Deuteronomy
- one segment emitted: `12:1`

### Example 2: chained citation

Input:

```txt
Deut 1:5; 4:44; and 6:1
```

Expected:

- parser consumes the full citation tail
- three segments emitted:
  - `1:5`
  - `4:44`
  - `6:1`
- all attach to Deuteronomy

### Example 3: prose after alias, parenthetical ref

Input:

```txt
Deuteronomy calls for what it models: continual Torah study (6:5-9)
```

Expected:

- parser does not treat `(6:5-9)` as an alias-attached explicit citation for `Deuteronomy`
- alias-tail parse result is either `book_only` or `no_match`, depending on chosen fallback rules
- if the bookless scanner later treats `6:5-9` as a standalone citation, it should route to `Unknown`, not to Deuteronomy

### Example 4: prose after ref (running sentence)

Input:

```txt
Deuteronomy 1:6-18 appointing judges
```

Expected:

- parser consumes `1:6-18` with `stopReason: prose` at the following word (`appointing`)
- alias-attached mention includes `1:6-18` on Deuteronomy; text after the citation is normal English, not a reason to drop attachment

### Example 5: next book stops parsing

Input:

```txt
Deut 32:44-47; 34:9; Josh 1:1-9
```

Expected:

- alias-tail parse for Deut consumes only:
  - `32:44-47`
  - `34:9`
- parser stops at `Josh`
- `Josh 1:1-9` is not attached to Deut

### Example 6: ambiguous in-between ref becomes `Unknown`

Input:

```txt
Rom 10:8 31:6, 8 Heb 13:5
```

Expected:

- `10:8` attaches to Romans
- `31:6, 8` does not attach to Romans
- `13:5` does not attach to Romans
- bookless scan may route `31:6, 8` to `Unknown` if it is otherwise valid and uncovered

### Example 7: cross-chapter range

Input:

```txt
Gen 1:20-2:4
```

Expected:

- one consumed citation span
- two emitted structural segments:
  - `1:20`
  - `2:1-4`
- source span must still cover the full original text `1:20-2:4`

### Example 8: bookless citation

Input:

```txt
As noted in 4:35 and again in 5:1-3
```

Expected:

- no alias attachment
- bookless scan emits `Unknown` candidates for:
  - `4:35`
  - `5:1-3`

## Fallback Rules

Preserve the current product rule:

- if alias/context passes but structured parsing yields no explicit ref segments, emit a book-level mention

But change how that is determined:

- use parser result status, not heuristic span-discovery failure

Recommended semantics:

- `status === "book_only"` -> emit book-level mention
- `status === "no_match"` -> no mention
- `status === "match"` with segments -> emit segment mentions
- `status === "ambiguous"` -> do not attach to the alias; allow bookless path to handle if applicable

The exact statuses can vary, but the implementation must distinguish these cases explicitly.

## Migration Strategy

Implement in phases to reduce risk.

### Phase 1: Add new parser API beside the current API

- keep the current `parse(...)` and `findStandaloneRefSpans(...)` temporarily
- add `parseAfterAlias(...)` and `scanBookless(...)`
- add full tests for the new API

### Phase 2: Switch alias-window path

- update `findRefSpansInAliasWindow(...)` internals to use the new parser
- keep the function name if helpful for minimizing churn
- remove dependency on `findStandaloneRefSpans(...)` in this path

### Phase 3: Switch `Unknown` scan

- replace page-wide standalone scan with the new bookless parser-backed scanner
- keep overlap exclusion logic in service layer

### Phase 4: Remove compatibility surfaces

- remove or de-emphasize current regex-first surfaces if no longer used
- keep only helpers that are still valuable for tests or compatibility

## Testing Requirements

The refactor should not be merged without a materially stronger test matrix than exists today.

### Unit tests in `packages/core/src/scripture/ref-parser.test.ts`

Add cases for:

- every supported citation form
- stop at new book
- stop at prose
- stop at closing delimiter
- ambiguous/bookless results
- source offset accuracy
- consumed span accuracy
- negative examples from page text

### Service tests in `apps/index-pdf-backend/src/modules/detection/detection.service.test.ts`

Add cases for:

- alias-tail parsing maps back to original page offsets correctly
- same local parser result yields distinct candidates by segment
- ambiguous refs route to `Unknown` rather than incorrect book assignment
- book-level fallback only occurs for the intended parser statuses
- previously covered ranges are excluded from `Unknown`

### Integration tests

At least one end-to-end matcher run test should cover:

- mixed-book page text
- `Unknown` refs
- child entry creation from compound refs
- bbox mapping for consumed spans

## Non-Goals

These changes do not require:

- user-authored parser grammars
- new DB schema
- changes to alias-engine overlap rules
- replacing matcher-linked mention resolution

## Implementation Guardrails

Do not do the following:

- do not reintroduce a full-text scripture recognizer as the main detection engine
- do not add more one-off prose heuristics in `detection.service.ts` unless they are clearly outside parser concerns
- do not keep two independent grammars for alias-tail parsing and bookless scanning
- do not make the parser depend on project DB state; it should operate on normalized text plus explicit inputs

## Acceptance Criteria

The work is complete when all of the following are true:

1. Alias-attached scripture parsing no longer depends on `findStandaloneRefSpans(...)` as its primary discovery mechanism.
2. The parser returns consumed citation spans and segment-relative source offsets.
3. `findRefSpansInAliasWindow(...)` becomes thin orchestration or is replaced by an equivalent thin wrapper.
4. The page-wide `Unknown` scan uses shared parser primitives rather than a separate regex-first detection path.
5. Existing supported citation forms still work.
6. Ambiguous mixed-book cases are handled more deterministically than today.
7. Tests clearly describe parser stop behavior, not just final segment arrays.
