import { describe, expect, it } from "vitest";
import {
	findStandaloneRefSpans,
	getParserProfile,
	getParserProfileIds,
	scriptureParserProfile,
} from "./index";
import type { ParsedRefSegment } from "./parser-profile.types";

// Windows are normalized (lowercase, single space, dash). Use "book ref" form e.g. "gen 1:2".

describe("scripture ref parser - parser matrix", () => {
	function parse(window: string): ParsedRefSegment[] {
		return scriptureParserProfile.parse(window);
	}

	it("chapter only: gen 1, gen 2", () => {
		expect(parse("gen 1")).toEqual([{ refText: "1", chapter: 1 }]);
		expect(parse("gen 2")).toEqual([{ refText: "2", chapter: 2 }]);
	});

	it("chapter range: 1-3 (chapters, not verses)", () => {
		expect(parse("gen 1-3")).toEqual([
			{ refText: "1-3", chapter: 1, chapterEnd: 3 },
		]);
	});

	it("chapters only list: 1, 2, 3 (no verse mode -> three chapter segments)", () => {
		expect(parse("gen 1, 2, 3")).toEqual([
			{ refText: "1", chapter: 1 },
			{ refText: "2", chapter: 2 },
			{ refText: "3", chapter: 3 },
		]);
	});

	it("ch:v and ch.v single verse", () => {
		expect(parse("gen 1:2")).toEqual([
			{ refText: "1:2", chapter: 1, verseStart: 2, verseEnd: 2 },
		]);
		expect(parse("gen 1.2")).toEqual([
			{ refText: "1.2", chapter: 1, verseStart: 2, verseEnd: 2 },
		]);
	});

	it("ch:v-v verse range same chapter", () => {
		expect(parse("gen 1:2-4")).toEqual([
			{ refText: "1:2-4", chapter: 1, verseStart: 2, verseEnd: 4 },
		]);
	});

	it("verse lists: 1:1, 2, 3 -> three segments", () => {
		expect(parse("gen 1:1, 2, 3")).toEqual([
			{ refText: "1:1", chapter: 1, verseStart: 1, verseEnd: 1 },
			{ refText: "2", chapter: 1, verseStart: 2, verseEnd: 2 },
			{ refText: "3", chapter: 1, verseStart: 3, verseEnd: 3 },
		]);
	});

	it("verse lists with ranges: 1:1, 3-5, 7 -> three segments", () => {
		expect(parse("gen 1:1, 3-5, 7")).toEqual([
			{ refText: "1:1", chapter: 1, verseStart: 1, verseEnd: 1 },
			{ refText: "3-5", chapter: 1, verseStart: 3, verseEnd: 5 },
			{ refText: "7", chapter: 1, verseStart: 7, verseEnd: 7 },
		]);
	});

	it("verse list with ch:v-v first: 31:1-8, 14-15, 23 -> chapter 31 for all", () => {
		expect(parse("gen 31:1-8, 14-15, 23")).toEqual([
			{ refText: "31:1-8", chapter: 31, verseStart: 1, verseEnd: 8 },
			{ refText: "14-15", chapter: 31, verseStart: 14, verseEnd: 15 },
			{ refText: "23", chapter: 31, verseStart: 23, verseEnd: 23 },
		]);
	});

	it("multi refs with semicolon: 1:1-3; 2:4 -> two segments", () => {
		expect(parse("gen 1:1-3; 2:4")).toEqual([
			{ refText: "1:1-3", chapter: 1, verseStart: 1, verseEnd: 3 },
			{ refText: "2:4", chapter: 2, verseStart: 4, verseEnd: 4 },
		]);
	});

	it("multi refs with comma (different chapters): 1:1-3, 2:4-5", () => {
		// "1:1-3, 2:4-5" - comma separates refs (not verse list: second part is ch:v-v)
		expect(parse("gen 1:1-3, 2:4-5")).toEqual([
			{ refText: "1:1-3", chapter: 1, verseStart: 1, verseEnd: 3 },
			{ refText: "2:4-5", chapter: 2, verseStart: 4, verseEnd: 5 },
		]);
	});

	it("cross-chapter: 1:20-2:4 -> two segments", () => {
		expect(parse("gen 1:20-2:4")).toEqual([
			{ refText: "1:20", chapter: 1, verseStart: 20 },
			{ refText: "2:1-4", chapter: 2, verseStart: 1, verseEnd: 4 },
		]);
	});

	it("cross-chapter 1:6-28:69: parse produces two segments (full range for Unknown should tile as 1:6-28:69)", () => {
		expect(parse("gen 1:6-28:69")).toEqual([
			{ refText: "1:6", chapter: 1, verseStart: 6 },
			{ refText: "28:1-69", chapter: 28, verseStart: 1, verseEnd: 69 },
		]);
	});

	it("suffixes: 3a, 3b (verseSuffix preserved)", () => {
		expect(parse("gen 1:3a")).toEqual([
			{
				refText: "1:3a",
				chapter: 1,
				verseStart: 3,
				verseEnd: 3,
				verseSuffix: "a",
			},
		]);
		expect(parse("gen 1:3b")).toEqual([
			{
				refText: "1:3b",
				chapter: 1,
				verseStart: 3,
				verseEnd: 3,
				verseSuffix: "b",
			},
		]);
	});
});

describe("scripture ref parser - book-only and precheck", () => {
	it("book-only: Romans, Genesis, Gen. -> contextPrecheck true, parse returns one book-level segment", () => {
		expect(scriptureParserProfile.contextPrecheck("romans")).toBe(true);
		expect(scriptureParserProfile.parse("romans")).toEqual([{ refText: "" }]);

		expect(scriptureParserProfile.contextPrecheck("genesis")).toBe(true);
		expect(scriptureParserProfile.parse("genesis")).toEqual([{ refText: "" }]);

		expect(scriptureParserProfile.contextPrecheck("gen.")).toBe(true);
		expect(scriptureParserProfile.parse("gen.")).toEqual([{ refText: "" }]);
	});

	it("empty or whitespace-only window -> contextPrecheck false, parse returns []", () => {
		expect(scriptureParserProfile.contextPrecheck("")).toBe(false);
		expect(scriptureParserProfile.contextPrecheck("   ")).toBe(false);
		expect(scriptureParserProfile.parse("")).toEqual([]);
		expect(scriptureParserProfile.parse("   ")).toEqual([]);
	});
});

describe("scripture ref parser - negative tests (false positives)", () => {
	it("see page 1 -> parse returns []", () => {
		expect(scriptureParserProfile.contextPrecheck("see page 1")).toBe(true);
		expect(scriptureParserProfile.parse("see page 1")).toEqual([]);
	});

	it("the 1 and 2 of the story -> parse returns []", () => {
		expect(
			scriptureParserProfile.contextPrecheck("the 1 and 2 of the story"),
		).toBe(true);
		expect(scriptureParserProfile.parse("the 1 and 2 of the story")).toEqual(
			[],
		);
	});
});

describe("scripture ref parser - profile contract", () => {
	it("contextPrecheck true for any non-empty window including book-only", () => {
		expect(scriptureParserProfile.contextPrecheck("romans")).toBe(true);
		expect(scriptureParserProfile.contextPrecheck("genesis")).toBe(true);
		expect(scriptureParserProfile.contextPrecheck("gen 1:1-3, 2:4")).toBe(true);
	});

	it("parse Gen 1:1-3, 2:4 returns two segments", () => {
		expect(scriptureParserProfile.parse("gen 1:1-3, 2:4")).toEqual([
			{ refText: "1:1-3", chapter: 1, verseStart: 1, verseEnd: 3 },
			{ refText: "2:4", chapter: 2, verseStart: 4, verseEnd: 4 },
		]);
	});

	it("stops at new book in semicolon list: 32:44-47; 34:9; josh 1:1-9", () => {
		// Should parse 32:44-47 and 34:9, stop before josh 1:1-9
		expect(
			scriptureParserProfile.parse("gen 32:44-47; 34:9; josh 1:1-9"),
		).toEqual([
			{ refText: "32:44-47", chapter: 32, verseStart: 44, verseEnd: 47 },
			{ refText: "34:9", chapter: 34, verseStart: 9, verseEnd: 9 },
		]);
	});

	it("parses 'and' before ref in semicolon list: Deut 1:5; 4:44; and 6:1", () => {
		expect(scriptureParserProfile.parse("deut 1:5; 4:44; and 6:1")).toEqual([
			{ refText: "1:5", chapter: 1, verseStart: 5, verseEnd: 5 },
			{ refText: "4:44", chapter: 4, verseStart: 44, verseEnd: 44 },
			{ refText: "6:1", chapter: 6, verseStart: 1, verseEnd: 1 },
		]);
	});
});

describe("parser profiles registry", () => {
	it("getParserProfileIds returns at least scripture-biblical", () => {
		const ids = getParserProfileIds();
		expect(ids).toContain("scripture-biblical");
	});

	it("getParserProfile returns profile by id", () => {
		const profile = getParserProfile("scripture-biblical");
		expect(profile).toBeDefined();
		expect(profile?.id).toBe("scripture-biblical");
		expect(profile?.parse("gen 1")).toEqual([{ refText: "1", chapter: 1 }]);
	});

	it("getParserProfile returns undefined for unknown id", () => {
		expect(getParserProfile("unknown")).toBeUndefined();
	});
});

describe("findStandaloneRefSpans", () => {
	it("finds ch:v refs like 4:35", () => {
		const spans = findStandaloneRefSpans(
			"But what we mean by the original text is less clear. For instance, in 4:35...",
		);
		expect(spans).toEqual([{ start: 70, end: 74, refText: "4:35" }]);
	});

	it("finds ch:v with suffix 1:3a", () => {
		const spans = findStandaloneRefSpans("as in 1:3a and 2:4");
		expect(spans).toContainEqual({ start: 6, end: 10, refText: "1:3a" });
		expect(spans).toContainEqual({ start: 15, end: 18, refText: "2:4" });
	});

	it("rejects page 1", () => {
		const spans = findStandaloneRefSpans("see page 1 for details");
		expect(spans).toEqual([]);
	});

	it("rejects chapter 2", () => {
		const spans = findStandaloneRefSpans("as in chapter 2");
		expect(spans).toEqual([]);
	});

	it("finds verse range 1:2-4", () => {
		const spans = findStandaloneRefSpans("verses 1:2-4 show");
		expect(spans).toEqual([{ start: 7, end: 12, refText: "1:2-4" }]);
	});

	it("finds ch.v format", () => {
		const spans = findStandaloneRefSpans("in 1.2 we see");
		expect(spans).toEqual([{ start: 3, end: 6, refText: "1.2" }]);
	});

	it("dedupes overlapping matches", () => {
		const spans = findStandaloneRefSpans("1:20-2:4");
		expect(spans.length).toBe(1);
		expect(spans[0].refText).toBe("1:20-2:4");
	});

	it("finds cross-chapter 1:6-28:69 as single span (Unknown should tile as 1:6-28:69, not just 1:6)", () => {
		const spans = findStandaloneRefSpans("1:6–28:69", {
			includeChapterAndRange: true,
		});
		expect(spans.length).toBe(1);
		expect(spans[0].refText).toMatch(/1:6.*28:69/);
	});

	it("finds verse list 27:1-8, 9-14", () => {
		const spans = findStandaloneRefSpans("(27:1-8, 9-14)");
		expect(spans.length).toBe(1);
		expect(spans[0].refText).toBe("27:1-8, 9-14");
	});

	it("accepts ch 1-2 and vv. 1-3 when includeChapterAndRange", () => {
		const spans1 = findStandaloneRefSpans("see ch 1-2 for context", {
			includeChapterAndRange: true,
		});
		expect(spans1).toContainEqual({ start: 7, end: 10, refText: "1-2" });

		const spans2 = findStandaloneRefSpans("vv. 1-3; 5", {
			includeChapterAndRange: true,
		});
		expect(spans2).toContainEqual({ start: 4, end: 7, refText: "1-3" });
	});

	it("rejects page 1 and chapter 2 when includeChapterAndRange", () => {
		const spans1 = findStandaloneRefSpans("see page 1 for details", {
			includeChapterAndRange: true,
		});
		expect(spans1).toEqual([]);

		const spans2 = findStandaloneRefSpans("as in chapter 2", {
			includeChapterAndRange: true,
		});
		expect(spans2).toEqual([]);
	});
});

describe("parseAfterAlias (alias-tail consumer)", () => {
	it("Deut 12:1 - single chapter:verse", () => {
		const result = scriptureParserProfile.parseAfterAlias({
			normalizedWindow: "12:1",
		});
		expect(result.status).toBe("match");
		expect(result.stopReason).toBe("end_of_input");
		expect(result.consumedStart).toBe(0);
		expect(result.consumedEnd).toBe(4);
		expect(result.consumedText).toBe("12:1");
		expect(result.segments).toHaveLength(1);
		expect(result.segments[0]).toMatchObject({
			refText: "12:1",
			chapter: 12,
			verseStart: 1,
			verseEnd: 1,
		});
		expect(result.segments[0].sourceStart).toBe(0);
		expect(result.segments[0].sourceEnd).toBe(4);
	});

	it("Deut 1:5; 4:44; and 6:1 - semicolon list with leading and", () => {
		const result = scriptureParserProfile.parseAfterAlias({
			normalizedWindow: "1:5; 4:44; and 6:1",
		});
		expect(result.status).toBe("match");
		expect(result.stopReason).toBe("end_of_input");
		expect(result.consumedText).toBe("1:5; 4:44; and 6:1");
		expect(result.segments).toHaveLength(3);
		expect(result.segments[0]).toMatchObject({
			refText: "1:5",
			chapter: 1,
			verseStart: 5,
			verseEnd: 5,
		});
		expect(result.segments[1]).toMatchObject({
			refText: "4:44",
			chapter: 4,
			verseStart: 44,
			verseEnd: 44,
		});
		expect(result.segments[2]).toMatchObject({
			refText: "6:1",
			chapter: 6,
			verseStart: 1,
			verseEnd: 1,
		});
		expect(result.segments[0].sourceStart).toBe(0);
		expect(result.segments[0].sourceEnd).toBe(3);
		expect(result.segments[2].sourceStart).toBe(15); // after "1:5; 4:44; and "
		expect(result.segments[2].sourceEnd).toBe(18);
	});

	it("Gen 1:20-2:4 - cross-chapter range", () => {
		const result = scriptureParserProfile.parseAfterAlias({
			normalizedWindow: "1:20-2:4",
		});
		expect(result.status).toBe("match");
		expect(result.segments).toHaveLength(2);
		expect(result.segments[0]).toMatchObject({
			refText: "1:20",
			chapter: 1,
			verseStart: 20,
		});
		expect(result.segments[1]).toMatchObject({
			refText: "2:1-4",
			chapter: 2,
			verseStart: 1,
			verseEnd: 4,
		});
		expect(result.consumedText).toBe("1:20-2:4");
	});

	it("stops at new book: Deut 32:44-47; 34:9; Josh 1:1-9", () => {
		const result = scriptureParserProfile.parseAfterAlias({
			normalizedWindow: "32:44-47; 34:9; josh 1:1-9",
			otherBookAliases: ["josh", "joshua"],
		});
		expect(result.status).toBe("match");
		expect(result.stopReason).toBe("new_book");
		expect(result.consumedText).toBe("32:44-47; 34:9; ");
		expect(result.segments).toHaveLength(2);
		expect(result.segments[0]).toMatchObject({
			refText: "32:44-47",
			chapter: 32,
			verseStart: 44,
			verseEnd: 47,
		});
		expect(result.segments[1]).toMatchObject({
			refText: "34:9",
			chapter: 34,
			verseStart: 9,
			verseEnd: 9,
		});
		expect(result.consumedEnd).toBe(16); // position before "josh"
	});

	it("prose stop: Deuteronomy 1:6-18 appointing judges", () => {
		const result = scriptureParserProfile.parseAfterAlias({
			normalizedWindow: "1:6-18 appointing judges",
		});
		expect(result.status).toBe("match");
		expect(result.stopReason).toBe("prose");
		expect(result.consumedText).toBe("1:6-18");
		expect(result.segments).toHaveLength(1);
		expect(result.segments[0]).toMatchObject({
			refText: "1:6-18",
			chapter: 1,
			verseStart: 6,
			verseEnd: 18,
		});
		expect(result.segments[0].sourceStart).toBe(0);
		expect(result.segments[0].sourceEnd).toBe(6);
	});

	it("parenthetical/non-attached: Deuteronomy calls for ... (6:5-9)", () => {
		const result = scriptureParserProfile.parseAfterAlias({
			normalizedWindow: "calls for something (6:5-9)",
		});
		expect(result.status).toBe("no_match");
		expect(result.stopReason).toBe("prose");
		expect(result.consumedText).toBe("");
		expect(result.segments).toHaveLength(0);
		expect(result.consumedStart).toBe(0);
		expect(result.consumedEnd).toBe(0);
	});

	/** Consumed span starts at first ref character and ends at last ref character (no leading/trailing whitespace). Segment offsets lie within [consumedStart, consumedEnd]. */
	it("consumed span and source offsets - segment offsets relative to window", () => {
		const window = "  1:2-4; 5:1 ";
		const result = scriptureParserProfile.parseAfterAlias({
			normalizedWindow: window,
		});
		expect(result.status).toBe("match");
		// Contract: consumedText must equal the slice of the window
		expect(result.consumedText).toBe(
			window.slice(result.consumedStart, result.consumedEnd),
		);
		// Consumed span = ref content only (no leading/trailing space)
		expect(result.consumedStart).toBe(2);
		expect(result.consumedEnd).toBe(12);
		expect(result.consumedText).toBe("1:2-4; 5:1");
		// Segments with correct refText and offsets within consumed span
		expect(result.segments).toHaveLength(2);
		expect(result.segments[0].refText).toBe("1:2-4");
		expect(result.segments[0].sourceStart).toBeGreaterThanOrEqual(
			result.consumedStart,
		);
		expect(result.segments[0].sourceEnd).toBeLessThanOrEqual(
			result.consumedEnd,
		);
		expect(result.segments[1].refText).toBe("5:1");
		expect(result.segments[1].sourceStart).toBeGreaterThanOrEqual(
			result.consumedStart,
		);
		expect(result.segments[1].sourceEnd).toBeLessThanOrEqual(
			result.consumedEnd,
		);
	});

	it("consumed span excludes extra leading whitespace before first ref (e.g. tab)", () => {
		const window = "  \t1:2-4";
		const result = scriptureParserProfile.parseAfterAlias({
			normalizedWindow: window,
		});
		expect(result.status).toBe("match");
		expect(result.consumedText).toBe(
			window.slice(result.consumedStart, result.consumedEnd),
		);
		// Consumed starts at first ref character (index 3), not after initial space skip (2)
		expect(result.consumedStart).toBe(3);
		expect(result.consumedText).toBe("1:2-4");
		expect(result.segments[0].refText).toBe("1:2-4");
	});
});
