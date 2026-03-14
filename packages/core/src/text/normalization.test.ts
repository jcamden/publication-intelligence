import { describe, expect, it } from "vitest";
import { normalize, normalizeWithOffsetMap } from "./normalization";

describe("normalize", () => {
	it("applies NFKC", () => {
		// é as e + combining acute (U+0065 U+0301) composes to single é (U+00E9)
		expect(normalize("\u0065\u0301")).toBe("\u00E9");
	});

	it("lowercases text", () => {
		expect(normalize("Genesis")).toBe("genesis");
		expect(normalize("GENESIS")).toBe("genesis");
	});

	it("normalizes dashes to ASCII hyphen-minus", () => {
		expect(normalize("Gen\u2013esis")).toBe("gen-esis"); // en dash
		expect(normalize("Gen\u2014esis")).toBe("gen-esis"); // em dash
		expect(normalize("Gen\u2212esis")).toBe("gen-esis"); // minus sign
		expect(normalize("6:5\u058A9")).toBe("6:5-9"); // Armenian hyphen
		expect(normalize("6:5\u2E3A9")).toBe("6:5-9"); // two-em dash
	});

	it("collapses whitespace runs to single space", () => {
		expect(normalize("a   b")).toBe("a b");
		expect(normalize("a\t\n  b")).toBe("a b");
	});

	it("preserves punctuation that is part of matcher text", () => {
		expect(normalize("1:2")).toBe("1:2");
		expect(normalize("ch. 3")).toBe("ch. 3");
		expect(normalize("Gen 1:2–4")).toBe("gen 1:2-4"); // dash in range normalized
	});

	it("is deterministic for mixed Unicode and punctuation", () => {
		const input = "  Genesis\u20131:2  \t  verse ";
		expect(normalize(input)).toBe(" genesis-1:2 verse ");
	});
});

describe("normalizeWithOffsetMap", () => {
	it("returns normalized text matching normalize()", () => {
		const text = "  Genesis\u20131:2  \t  verse ";
		const { normalizedText } = normalizeWithOffsetMap(text);
		expect(normalizedText).toBe(normalize(text));
	});

	it("maps normalized index to original index (1:1 for non-collapsed)", () => {
		const text = "Genesis";
		const { normalizedText, mapNormalizedIndexToOriginalIndex } =
			normalizeWithOffsetMap(text);
		expect(normalizedText).toBe("genesis");
		for (let i = 0; i < normalizedText.length; i++) {
			expect(mapNormalizedIndexToOriginalIndex(i)).toBe(i);
		}
	});

	it("maps collapsed whitespace to first original index in group", () => {
		// "a   b" -> "a b"; normalized index 2 (the space) should map to original index 1 (first space)
		const text = "a   b";
		const { normalizedText, mapNormalizedIndexToOriginalIndex } =
			normalizeWithOffsetMap(text);
		expect(normalizedText).toBe("a b");
		expect(mapNormalizedIndexToOriginalIndex(0)).toBe(0); // 'a'
		expect(mapNormalizedIndexToOriginalIndex(1)).toBe(1); // collapsed space -> first of run
		expect(mapNormalizedIndexToOriginalIndex(2)).toBe(4); // 'b'
	});

	it("mapNormalizedSpanToOriginalSpan returns half-open [start, end) in original", () => {
		const text = "a   b";
		const { mapNormalizedSpanToOriginalSpan } = normalizeWithOffsetMap(text);
		// normalized "a b" -> full span [0, 3) -> original [0, 5)
		expect(mapNormalizedSpanToOriginalSpan(0, 3)).toEqual([0, 5]);
		// normalized span of "a" [0, 1) -> original [0, 1)
		expect(mapNormalizedSpanToOriginalSpan(0, 1)).toEqual([0, 1]);
		// normalized span of "b" [2, 3) -> original [4, 5)
		expect(mapNormalizedSpanToOriginalSpan(2, 3)).toEqual([4, 5]);
	});

	it("handles mixed Unicode and punctuation for offset map", () => {
		// lowercase + dash: "Gen\u20131" -> "gen-1"
		const text = "Gen\u20131";
		const { normalizedText, mapNormalizedSpanToOriginalSpan } =
			normalizeWithOffsetMap(text);
		expect(normalizedText).toBe("gen-1");
		// full span
		expect(mapNormalizedSpanToOriginalSpan(0, normalizedText.length)).toEqual([
			0,
			text.length,
		]);
	});

	it("handles out-of-range indices in mapNormalizedIndexToOriginalIndex", () => {
		const text = "ab";
		const { mapNormalizedIndexToOriginalIndex } = normalizeWithOffsetMap(text);
		expect(mapNormalizedIndexToOriginalIndex(-1)).toBe(0);
		expect(mapNormalizedIndexToOriginalIndex(2)).toBe(2);
		expect(mapNormalizedIndexToOriginalIndex(10)).toBe(2);
	});

	it("handles empty string", () => {
		const {
			normalizedText,
			mapNormalizedIndexToOriginalIndex,
			mapNormalizedSpanToOriginalSpan,
		} = normalizeWithOffsetMap("");
		expect(normalizedText).toBe("");
		expect(mapNormalizedIndexToOriginalIndex(0)).toBe(0);
		expect(mapNormalizedSpanToOriginalSpan(0, 0)).toEqual([0, 0]);
	});
});
