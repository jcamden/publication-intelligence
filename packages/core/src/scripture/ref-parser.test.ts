import { describe, expect, it } from "vitest";
import {
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

	it("chapter range: 1-3", () => {
		expect(parse("gen 1-3")).toEqual([
			{ refText: "1-3", chapter: 1, verseEnd: 3 },
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

	it("cross-chapter: 1:20-2:4", () => {
		expect(parse("gen 1:20-2:4")).toEqual([
			{ refText: "1:20-2:4", chapter: 1, verseStart: 20, verseEnd: 4 },
		]);
	});

	it("suffixes: 3a, 3b", () => {
		expect(parse("gen 1:3a")).toEqual([
			{ refText: "1:3a", chapter: 1, verseStart: 3, verseEnd: 3 },
		]);
		expect(parse("gen 1:3b")).toEqual([
			{ refText: "1:3b", chapter: 1, verseStart: 3, verseEnd: 3 },
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
		expect(scriptureParserProfile.contextPrecheck("the 1 and 2 of the story")).toBe(true);
		expect(scriptureParserProfile.parse("the 1 and 2 of the story")).toEqual([]);
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
