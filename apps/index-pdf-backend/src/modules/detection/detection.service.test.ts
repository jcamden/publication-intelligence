import "../../test/setup";
import { getParserProfile } from "@pubint/core";
import { describe, expect, it } from "vitest";
import { buildAliasIndex, scanTextWithAliasIndex } from "./alias-engine";
import type { AliasInput } from "./alias-engine.types";
import { buildDedupeKey } from "./bbox-canonical.utils";
import { mapPositionsToBBoxes } from "./charAt-mapping.utils";
import {
	computeFallbackSpan,
	dedupeMatcherCandidates,
	sortMatcherCandidates,
	shouldEmitFallbackMention,
} from "./detection.service";
import type { MatcherMentionCandidate } from "./detection.types";
import {
	buildSearchablePageText,
	recalculateCharPositionsForIndexable,
} from "./text-extraction.utils";
import type { TextAtom } from "@pubint/core";

// ============================================================================
// sortMatcherCandidates: ordering and determinism (Task 4.1)
// ============================================================================

describe("sortMatcherCandidates", () => {
	const baseCandidate = (overrides: Partial<MatcherMentionCandidate> = {}): MatcherMentionCandidate => ({
		pageNumber: 1,
		groupId: "g1",
		matcherId: "m1",
		entryId: "e1",
		indexType: "scripture",
		textSpan: "x",
		charStart: 0,
		charEnd: 1,
		bboxes: [],
		...overrides,
	});

	it("orders by pageNumber ascending", () => {
		const candidates: MatcherMentionCandidate[] = [
			baseCandidate({ pageNumber: 2, charStart: 0 }),
			baseCandidate({ pageNumber: 1, charStart: 0 }),
			baseCandidate({ pageNumber: 3, charStart: 0 }),
		];
		sortMatcherCandidates(candidates);
		expect(candidates.map((c) => c.pageNumber)).toEqual([1, 2, 3]);
	});

	it("orders by charStart ascending when pageNumber equal", () => {
		const candidates: MatcherMentionCandidate[] = [
			baseCandidate({ pageNumber: 1, charStart: 10, charEnd: 15 }),
			baseCandidate({ pageNumber: 1, charStart: 0, charEnd: 5 }),
			baseCandidate({ pageNumber: 1, charStart: 5, charEnd: 10 }),
		];
		sortMatcherCandidates(candidates);
		expect(candidates.map((c) => c.charStart)).toEqual([0, 5, 10]);
	});

	it("orders longer span first when pageNumber and charStart equal", () => {
		const candidates: MatcherMentionCandidate[] = [
			baseCandidate({ pageNumber: 1, charStart: 0, charEnd: 3 }),
			baseCandidate({ pageNumber: 1, charStart: 0, charEnd: 10 }),
			baseCandidate({ pageNumber: 1, charStart: 0, charEnd: 5 }),
		];
		sortMatcherCandidates(candidates);
		expect(candidates.map((c) => c.charEnd - c.charStart)).toEqual([10, 5, 3]);
	});

	it("is deterministic: same input sorted twice yields same order", () => {
		const candidates: MatcherMentionCandidate[] = [
			baseCandidate({ pageNumber: 2, charStart: 5, charEnd: 8 }),
			baseCandidate({ pageNumber: 1, charStart: 0, charEnd: 10 }),
			baseCandidate({ pageNumber: 1, charStart: 0, charEnd: 3 }),
		];
		const copy1 = structuredClone(candidates);
		const copy2 = structuredClone(candidates);
		sortMatcherCandidates(copy1);
		sortMatcherCandidates(copy2);
		expect(copy1).toEqual(copy2);
	});
});

// ============================================================================
// Page flow: alias hit -> bbox mapping -> candidate emission (Task 4.1)
// ============================================================================

describe("matcher page flow (alias hit to candidate)", () => {
	// Two indexable words "genesis" and "1:1" -> searchable text "genesis 1:1"
	const words = ["genesis", "1:1"];
	const atoms: TextAtom[] = (() => {
		let offset = 0;
		return words.map((w, i) => {
			const start = offset;
			offset += w.length + (i < words.length - 1 ? 1 : 0);
			return {
				id: `atom_1_${i}`,
				word: w,
				bbox: { x0: 0, y0: i * 10, x1: 50, y1: i * 10 + 8 },
				charStart: start,
				charEnd: start + w.length,
				pageNumber: 1,
				sequence: i,
				isIndexable: true,
			} as TextAtom;
		});
	})();

	it("produces one candidate when alias matches and bboxes map", () => {
		const aliases: AliasInput[] = [
			{
				alias: "genesis",
				matcherId: "m1",
				entryId: "e1",
				indexType: "scripture",
				groupId: "g1",
			},
		];
		const aliasIndex = buildAliasIndex(aliases);
		const searchableText = buildSearchablePageText({ atoms });
		const indexableAtoms = recalculateCharPositionsForIndexable({ atoms });

		const matches = scanTextWithAliasIndex(searchableText, aliasIndex);
		expect(matches.length).toBe(1);
		expect(matches[0].matchedAlias).toBe("genesis");
		expect(matches[0].originalStart).toBe(0);
		expect(matches[0].originalEnd).toBe(7);

		const mentionsWithPositions = matches.map((m) => ({
			mention: {
				entryLabel: "",
				indexType: m.indexType,
				pageNumber: 1,
				textSpan: searchableText.slice(m.originalStart, m.originalEnd),
			},
			charStart: m.originalStart,
			charEnd: m.originalEnd,
		}));

		const { mapped: withBboxes } = mapPositionsToBBoxes({
			mentionsWithPositions,
			textAtoms: indexableAtoms,
		});

		expect(withBboxes.length).toBe(1);
		expect(withBboxes[0].bboxes.length).toBeGreaterThan(0);
		expect(withBboxes[0].textSpan).toBe("genesis");

		// Full candidate shape (as built in processMatcher)
		const candidate: MatcherMentionCandidate = {
			pageNumber: 1,
			groupId: matches[0].groupId,
			matcherId: matches[0].matcherId,
			entryId: matches[0].entryId,
			indexType: matches[0].indexType,
			textSpan: withBboxes[0].textSpan,
			charStart: matches[0].originalStart,
			charEnd: matches[0].originalEnd,
			bboxes: withBboxes[0].bboxes,
		};
		expect(candidate.pageNumber).toBe(1);
		expect(candidate.matcherId).toBe("m1");
		expect(candidate.entryId).toBe("e1");
		expect(candidate.textSpan).toBe("genesis");
		expect(candidate.bboxes.length).toBeGreaterThan(0);
	});
});

// ============================================================================
// In-memory dedupe: duplicate candidates in one run collapse to one (Task 4.2)
// ============================================================================

describe("matcher dedupe (Task 4.2)", () => {
	const projectIndexTypeId = "pit-1";
	const bbox = { x: 0, y: 0, width: 10, height: 2 };

	it("dedupe key collapses equivalent bbox orderings to one key", () => {
		const candidate1: MatcherMentionCandidate = {
			pageNumber: 1,
			groupId: "g1",
			matcherId: "m1",
			entryId: "e1",
			indexType: "scripture",
			textSpan: "Gen 1:1",
			charStart: 0,
			charEnd: 8,
			bboxes: [bbox, { x: 10, y: 0, width: 5, height: 2 }],
		};
		const candidate2: MatcherMentionCandidate = {
			...candidate1,
			bboxes: [{ x: 10, y: 0, width: 5, height: 2 }, bbox],
		};
		const key1 = buildDedupeKey({
			projectIndexTypeId,
			matcherId: candidate1.matcherId,
			pageNumber: candidate1.pageNumber,
			bboxes: candidate1.bboxes,
		});
		const key2 = buildDedupeKey({
			projectIndexTypeId,
			matcherId: candidate2.matcherId,
			pageNumber: candidate2.pageNumber,
			bboxes: candidate2.bboxes,
		});
		expect(key1).toBe(key2);
	});

	it("dedupe filter leaves one when two candidates have same key", () => {
		const seenKeys = new Set<string>();
		const candidates: MatcherMentionCandidate[] = [
			{
				pageNumber: 1,
				groupId: "g1",
				matcherId: "m1",
				entryId: "e1",
				indexType: "scripture",
				textSpan: "Gen 1:1",
				charStart: 0,
				charEnd: 8,
				bboxes: [bbox],
			},
			{
				pageNumber: 1,
				groupId: "g1",
				matcherId: "m1",
				entryId: "e1",
				indexType: "scripture",
				textSpan: "Gen 1:1",
				charStart: 0,
				charEnd: 8,
				bboxes: [bbox],
			},
		];
		const deduped = candidates.filter((c) => {
			const key = buildDedupeKey({
				projectIndexTypeId,
				matcherId: c.matcherId,
				pageNumber: c.pageNumber,
				bboxes: c.bboxes,
			});
			if (seenKeys.has(key)) return false;
			seenKeys.add(key);
			return true;
		});
		expect(deduped.length).toBe(1);
	});

	it("dedupe filter keeps both when same bbox different matcher", () => {
		const seenKeys = new Set<string>();
		const candidates: MatcherMentionCandidate[] = [
			{
				pageNumber: 1,
				groupId: "g1",
				matcherId: "m1",
				entryId: "e1",
				indexType: "scripture",
				textSpan: "Gen 1:1",
				charStart: 0,
				charEnd: 8,
				bboxes: [bbox],
			},
			{
				pageNumber: 1,
				groupId: "g2",
				matcherId: "m2",
				entryId: "e2",
				indexType: "scripture",
				textSpan: "Gen 1:1",
				charStart: 0,
				charEnd: 8,
				bboxes: [bbox],
			},
		];
		const deduped = candidates.filter((c) => {
			const key = buildDedupeKey({
				projectIndexTypeId,
				matcherId: c.matcherId,
				pageNumber: c.pageNumber,
				bboxes: c.bboxes,
			});
			if (seenKeys.has(key)) return false;
			seenKeys.add(key);
			return true;
		});
		expect(deduped.length).toBe(2);
	});
});

// ============================================================================
// Task 4.3: Fallback mention span
// ============================================================================

describe("computeFallbackSpan (Task 4.3)", () => {
	it("tail-extension: Gen 1:foo captures only citation-like prefix and stops before invalid token", () => {
		const pageText = "Gen 1:foo";
		const span = computeFallbackSpan(pageText, 0, 3);
		expect(span.charStart).toBe(0);
		expect(span.charEnd).toBe(6);
		expect(pageText.slice(span.charStart, span.charEnd)).toBe("Gen 1:");
	});

	it("extends right with citation-like chars and stops before invalid token", () => {
		const pageText = "Gen 1:2-4, 5; bar";
		// "Gen " = 0-4, then "1:2-4, 5; " is citation-like, "b" stops
		const span = computeFallbackSpan(pageText, 0, 4);
		expect(span.charStart).toBe(0);
		expect(span.charEnd).toBe(14);
		expect(pageText.slice(span.charStart, span.charEnd)).toBe("Gen 1:2-4, 5; ");
	});

	it("preserves trailing period when it is part of alias (no extension)", () => {
		const pageText = "Gen. and something";
		// Alias "Gen." ends at 4; next char " " is citation-like but we only extend
		// with citation-like; " " is allowed so we extend. "a" stops. So span could be "Gen. " or "Gen.".
		// Spec: "include leading/trailing punctuation that is part of matcher text" - so original span is Gen. (0-4).
		// Right-extension: from 4, " " is citation-like, "a" is not. So end = 4 or 5?
		// If we extend by one space we get "Gen. " - that's valid. So charEnd could be 5.
		// For "punctuation test: matcher text like Gen. preserves trailing period" - the fallback span
		// must include "Gen." so charStart=0, charEnd >= 4. So at least [0,4]. We're good.
		const span = computeFallbackSpan(pageText, 0, 4);
		expect(span.charStart).toBe(0);
		expect(span.charEnd).toBeGreaterThanOrEqual(4);
		expect(pageText.slice(0, 4)).toBe("Gen.");
	});

	it("stops after verse suffix letter when second letter follows (non-citation-like)", () => {
		const pageText = "Genesis 1:1xy";
		const span = computeFallbackSpan(pageText, 0, 7);
		expect(span.charStart).toBe(0);
		expect(span.charEnd).toBe(12);
		expect(pageText.slice(span.charStart, span.charEnd)).toBe("Genesis 1:1x");
	});
});

describe("shouldEmitFallbackMention (Task 4.3)", () => {
	const profile = getParserProfile("scripture-biblical");

	it("returns true when context passes and parse returns zero segments (parser-fail)", () => {
		// Window " 1foo" has digit but looksLikeRef("1foo") is false -> parse returns []
		const pageText = "Genesis 1foo";
		expect(shouldEmitFallbackMention(pageText, 7, profile)).toBe(true);
	});

	it("returns false when context precheck fails (no fallback)", () => {
		// 24 spaces after alias -> precheck slice is whitespace only -> contextPrecheck false
		const pageText = "Genesis" + " ".repeat(24);
		expect(shouldEmitFallbackMention(pageText, 7, profile)).toBe(false);
	});

	it("returns false when profile is undefined", () => {
		expect(shouldEmitFallbackMention("Genesis 1:1", 7, undefined)).toBe(false);
	});
});

describe("dedupeMatcherCandidates precedence (Task 4.3)", () => {
	const projectIndexTypeId = "pit-1";
	const bbox = { x: 0, y: 0, width: 10, height: 2 };

	it("prefers parsed candidate over fallback when same dedupe key", () => {
		const parsed: MatcherMentionCandidate = {
			pageNumber: 1,
			groupId: "g1",
			matcherId: "m1",
			entryId: "e1",
			indexType: "scripture",
			textSpan: "Gen 1:1",
			charStart: 0,
			charEnd: 8,
			bboxes: [bbox],
			parserSegment: { refText: "1:1", chapter: 1, verseStart: 1, verseEnd: 1 },
		};
		const fallback: MatcherMentionCandidate = {
			...parsed,
			textSpan: "Gen",
			charEnd: 3,
			parserSegment: undefined,
			fallbackBookLevel: true,
		};
		const deduped = dedupeMatcherCandidates(
			[fallback, parsed],
			projectIndexTypeId,
		);
		expect(deduped.length).toBe(1);
		expect(deduped[0].fallbackBookLevel).toBeUndefined();
		expect(deduped[0].parserSegment).toBeDefined();
	});

	it("prefers parsed when parsed appears first", () => {
		const parsed: MatcherMentionCandidate = {
			pageNumber: 1,
			groupId: "g1",
			matcherId: "m1",
			entryId: "e1",
			indexType: "scripture",
			textSpan: "Gen 1:1",
			charStart: 0,
			charEnd: 8,
			bboxes: [bbox],
			parserSegment: { refText: "1:1", chapter: 1, verseStart: 1, verseEnd: 1 },
		};
		const fallback: MatcherMentionCandidate = {
			...parsed,
			textSpan: "Gen",
			charEnd: 3,
			parserSegment: undefined,
			fallbackBookLevel: true,
		};
		const deduped = dedupeMatcherCandidates(
			[parsed, fallback],
			projectIndexTypeId,
		);
		expect(deduped.length).toBe(1);
		expect(deduped[0].parserSegment).toBeDefined();
	});
});
