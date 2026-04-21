import "../../../../test/setup";
import { normalizeWithOffsetMap } from "@pubint/core";
import { describe, expect, it } from "vitest";
import {
	buildAliasIndex,
	findAndResolveMatches,
	scanTextWithAliasIndex,
} from "../alias-engine";
import type { AliasInput } from "../alias-engine.types";

// ============================================================================
// Fixtures
// ============================================================================

function aliases(overrides: Partial<AliasInput>[]): AliasInput[] {
	const base: AliasInput = {
		alias: "",
		matcherId: "m1",
		entryId: "e1",
		indexType: "scripture",
		groupId: "g1",
	};
	return overrides.map((o) => ({ ...base, ...o }));
}

// ============================================================================
// Task 2.2: Alias index builder
// ============================================================================

describe("buildAliasIndex", () => {
	it("builds lookup and automaton from alias rows", () => {
		const input = aliases([
			{
				alias: "Genesis",
				matcherId: "m1",
				entryId: "e1",
				indexType: "scripture",
				groupId: "g1",
			},
			{
				alias: "Gen",
				matcherId: "m2",
				entryId: "e2",
				indexType: "scripture",
				groupId: "g1",
			},
		]);
		const index = buildAliasIndex(input);
		expect(index.normalizedAliasLookup.get("genesis")).toHaveLength(1);
		expect(index.normalizedAliasLookup.get("gen")).toHaveLength(1);
		expect(index.automaton.findAll("genesis")).toEqual(
			expect.arrayContaining(["gen", "genesis"]),
		);
	});

	it("normalizes aliases (lowercase, dash, whitespace)", () => {
		const input = aliases([
			{
				alias: "First\u2013John",
				matcherId: "m1",
				entryId: "e1",
				indexType: "scripture",
				groupId: "g1",
			},
		]);
		const index = buildAliasIndex(input);
		const key = "first-john";
		expect(index.normalizedAliasLookup.has(key)).toBe(true);
		expect(index.automaton.findAll("first-john")).toContain(key);
	});

	it("allows same normalized alias to map to multiple matchers", () => {
		const input = aliases([
			{
				alias: "God",
				matcherId: "m1",
				entryId: "e1",
				indexType: "subject",
				groupId: "g1",
			},
			{
				alias: "God",
				matcherId: "m2",
				entryId: "e2",
				indexType: "subject",
				groupId: "g2",
			},
		]);
		const index = buildAliasIndex(input);
		const metas = index.normalizedAliasLookup.get("god") ?? [];
		expect(metas).toHaveLength(2);
		expect(metas.map((m) => m.matcherId).sort()).toEqual(["m1", "m2"]);
	});

	it("skips empty aliases after normalization", () => {
		const input = aliases([
			{
				alias: "   ",
				matcherId: "m1",
				entryId: "e1",
				indexType: "scripture",
				groupId: "g1",
			},
			{
				alias: "Gen",
				matcherId: "m2",
				entryId: "e2",
				indexType: "scripture",
				groupId: "g1",
			},
		]);
		const index = buildAliasIndex(input);
		expect(index.normalizedAliasLookup.size).toBe(1);
		expect(index.automaton.findAll("gen")).toEqual(["gen"]);
	});
});

// ============================================================================
// Task 2.3: Boundary check (reject mid-word hits)
// ============================================================================

describe("boundary check", () => {
	it("rejects hit when character before match is alphanumeric", () => {
		const input = aliases([
			{
				alias: "Gen",
				matcherId: "m1",
				entryId: "e1",
				indexType: "scripture",
				groupId: "g1",
			},
		]);
		const index = buildAliasIndex(input);
		// "aGen" -> "agen"; "gen" should not match mid-word
		const matches = scanTextWithAliasIndex("aGen", index);
		expect(matches).toHaveLength(0);
	});

	it("rejects hit when character after match is alphanumeric", () => {
		const input = aliases([
			{
				alias: "Gen",
				matcherId: "m1",
				entryId: "e1",
				indexType: "scripture",
				groupId: "g1",
			},
		]);
		const index = buildAliasIndex(input);
		// "Gens" -> "gens"; "gen" at start should not match (s is alphanumeric)
		const matches = scanTextWithAliasIndex("Gens", index);
		expect(matches).toHaveLength(0);
	});

	it("accepts match when both sides are non-alphanumeric", () => {
		const input = aliases([
			{
				alias: "Gen",
				matcherId: "m1",
				entryId: "e1",
				indexType: "scripture",
				groupId: "g1",
			},
		]);
		const index = buildAliasIndex(input);
		const matches = scanTextWithAliasIndex("(Gen)", index);
		expect(matches).toHaveLength(1);
		expect(matches[0].originalStart).toBe(1);
		expect(matches[0].originalEnd).toBe(4);
	});

	it("accepts match at start of text (no character before)", () => {
		const input = aliases([
			{
				alias: "Gen",
				matcherId: "m1",
				entryId: "e1",
				indexType: "scripture",
				groupId: "g1",
			},
		]);
		const index = buildAliasIndex(input);
		const matches = scanTextWithAliasIndex("Gen.", index);
		expect(matches).toHaveLength(1);
		expect(matches[0].originalStart).toBe(0);
		expect(matches[0].originalEnd).toBe(3);
	});

	it("accepts match at end of text (no character after)", () => {
		const input = aliases([
			{
				alias: "Gen",
				matcherId: "m1",
				entryId: "e1",
				indexType: "scripture",
				groupId: "g1",
			},
		]);
		const index = buildAliasIndex(input);
		// "Gen" at end with no alphanumeric after; may appear at one or more positions due to sliding
		const matches = scanTextWithAliasIndex("see Gen.", index);
		expect(matches.length).toBeGreaterThanOrEqual(1);
		const atEnd = matches.find(
			(m) => m.originalStart === 4 && m.originalEnd === 7,
		);
		expect(atEnd).toBeDefined();
	});

	it("rejects mid-word match with digit after", () => {
		const input = aliases([
			{
				alias: "ch",
				matcherId: "m1",
				entryId: "e1",
				indexType: "scripture",
				groupId: "g1",
			},
		]);
		const index = buildAliasIndex(input);
		// "chapter" contains "ch" followed by "a" - but "a" is alphanumeric, so reject
		const matches = scanTextWithAliasIndex("chapter", index);
		expect(matches).toHaveLength(0);
	});

	it("accepts word boundary with space and punctuation", () => {
		const input = aliases([
			{
				alias: "ch",
				matcherId: "m1",
				entryId: "e1",
				indexType: "scripture",
				groupId: "g1",
			},
		]);
		const index = buildAliasIndex(input);
		const matches = scanTextWithAliasIndex("ch. 1", index);
		expect(matches).toHaveLength(1);
	});
});

// ============================================================================
// Task 2.3: Overlap resolution (longest-match-first)
// ============================================================================

describe("overlap resolution", () => {
	it("prefers longest match when two aliases overlap", () => {
		const input = aliases([
			{
				alias: "Gen",
				matcherId: "m-gen",
				entryId: "e1",
				indexType: "scripture",
				groupId: "g1",
			},
			{
				alias: "Genesis",
				matcherId: "m-genesis",
				entryId: "e2",
				indexType: "scripture",
				groupId: "g1",
			},
		]);
		const index = buildAliasIndex(input);
		const matches = scanTextWithAliasIndex("Genesis 1", index);
		// Only "Genesis" should win (longest); "Gen" overlaps and is dropped
		expect(matches).toHaveLength(1);
		expect(matches[0].matcherId).toBe("m-genesis");
		expect(matches[0].originalStart).toBe(0);
		expect(matches[0].originalEnd).toBe(7);
	});

	it("keeps non-overlapping matches", () => {
		const input = aliases([
			{
				alias: "Gen",
				matcherId: "m1",
				entryId: "e1",
				indexType: "scripture",
				groupId: "g1",
			},
			{
				alias: "Exod",
				matcherId: "m2",
				entryId: "e2",
				indexType: "scripture",
				groupId: "g1",
			},
		]);
		const index = buildAliasIndex(input);
		// "Gen 1 and Exod 2" -> normalized "gen 1 and exod 2"; "gen" at 0, "exod" at 10
		const matches = scanTextWithAliasIndex("Gen 1 and Exod 2", index);
		expect(matches).toHaveLength(2);
		expect(matches[0].matcherId).toBe("m1");
		expect(matches[0].originalStart).toBe(0);
		expect(matches[0].originalEnd).toBe(3);
		expect(matches[1].matcherId).toBe("m2");
		expect(matches[1].originalStart).toBe(10);
		expect(matches[1].originalEnd).toBe(14);
	});

	it("when same length and non-overlapping, keeps both and orders by start", () => {
		const input = aliases([
			{
				alias: "ab",
				matcherId: "m1",
				entryId: "e1",
				indexType: "scripture",
				groupId: "g1",
			},
			{
				alias: "bc",
				matcherId: "m2",
				entryId: "e2",
				indexType: "scripture",
				groupId: "g1",
			},
		]);
		const index = buildAliasIndex(input);
		// "ab-bc": "ab" at [0,2), "bc" at [3,5). Non-overlapping; both kept. Sort by start.
		const matches = scanTextWithAliasIndex("ab-bc", index);
		expect(matches).toHaveLength(2);
		expect(matches[0].matcherId).toBe("m1");
		expect(matches[0].originalStart).toBe(0);
		expect(matches[0].originalEnd).toBe(2);
		expect(matches[1].matcherId).toBe("m2");
		expect(matches[1].originalStart).toBe(3);
		expect(matches[1].originalEnd).toBe(5);
	});

	it("output is ordered by start offset then alias length desc", () => {
		const input = aliases([
			{
				alias: "a",
				matcherId: "m-a",
				entryId: "e1",
				indexType: "scripture",
				groupId: "g1",
			},
			{
				alias: "ab",
				matcherId: "m-ab",
				entryId: "e2",
				indexType: "scripture",
				groupId: "g1",
			},
			{
				alias: "b",
				matcherId: "m-b",
				entryId: "e3",
				indexType: "scripture",
				groupId: "g1",
			},
		]);
		const index = buildAliasIndex(input);
		// "a b" -> two matches: [0,1) and [2,3). Order: by start, then length desc
		const matches = scanTextWithAliasIndex("a b", index);
		expect(matches).toHaveLength(2);
		expect(matches[0].originalStart).toBe(0);
		expect(matches[1].originalStart).toBe(2);
	});
});

// ============================================================================
// findAndResolveMatches with explicit offset map
// ============================================================================

describe("findAndResolveMatches", () => {
	it("maps normalized spans to original spans via offset map", () => {
		const input = aliases([
			{
				alias: "gen",
				matcherId: "m1",
				entryId: "e1",
				indexType: "scripture",
				groupId: "g1",
			},
		]);
		const index = buildAliasIndex(input);
		const text = "  Gen\u20131"; // two spaces, Gen, en-dash, 1
		const {
			normalizedText,
			mapNormalizedSpanToOriginalSpan,
			mapNormalizedIndexToOriginalIndex,
		} = normalizeWithOffsetMap(text);
		const offsetMap = {
			normalizedText,
			mapNormalizedSpanToOriginalSpan,
			mapNormalizedIndexToOriginalIndex,
		};
		const matches = findAndResolveMatches(
			normalizedText,
			offsetMap,
			index,
			text,
		);
		expect(matches).toHaveLength(1);
		// Normalized " gen-1" (leading spaces collapsed): "gen" at normalized 1..4
		expect(matches[0].normalizedStart).toBe(1);
		expect(matches[0].normalizedEnd).toBe(4);
		expect(matches[0].originalStart).toBe(2);
		expect(matches[0].originalEnd).toBe(5);
		expect(text.slice(matches[0].originalStart, matches[0].originalEnd)).toBe(
			"Gen",
		);
	});

	it("rejects uppercase matcher when text starts lowercase (revelation vs Revelation)", () => {
		const input = aliases([
			{
				alias: "Revelation",
				matcherId: "m1",
				entryId: "e1",
				indexType: "scripture",
				groupId: "g1",
			},
		]);
		const index = buildAliasIndex(input);
		const text = "the book of revelation";
		const { normalizedText, ...offsetMap } = normalizeWithOffsetMap(text);
		const matches = findAndResolveMatches(
			normalizedText,
			{ normalizedText, ...offsetMap },
			index,
			text,
		);
		expect(matches).toHaveLength(0);
	});

	it("accepts uppercase matcher when text starts uppercase", () => {
		const input = aliases([
			{
				alias: "Revelation",
				matcherId: "m1",
				entryId: "e1",
				indexType: "scripture",
				groupId: "g1",
			},
		]);
		const index = buildAliasIndex(input);
		const text = "the book of Revelation";
		const matches = scanTextWithAliasIndex(text, index);
		expect(matches).toHaveLength(1);
	});

	it("lowercase matcher accepts any case (m. Aboth)", () => {
		const input = aliases([
			{
				alias: "m. Aboth.",
				matcherId: "m1",
				entryId: "e1",
				indexType: "scripture",
				groupId: "g1",
			},
		]);
		const index = buildAliasIndex(input);
		const text = "as in m. aboth.";
		const matches = scanTextWithAliasIndex(text, index);
		expect(matches).toHaveLength(1);
	});
});
