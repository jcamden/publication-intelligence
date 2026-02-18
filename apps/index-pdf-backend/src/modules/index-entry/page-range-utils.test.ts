import { describe, expect, it } from "vitest";
import { mergeAndFormatPageRanges } from "./page-range-utils";

describe("mergeAndFormatPageRanges", () => {
	it("returns empty string for no mentions", () => {
		expect(mergeAndFormatPageRanges({ mentions: [] })).toBe("");
	});

	it("formats a single page", () => {
		expect(
			mergeAndFormatPageRanges({
				mentions: [{ pageNumber: 5 }],
			}),
		).toBe("5");
	});

	it("formats consecutive pages as range", () => {
		expect(
			mergeAndFormatPageRanges({
				mentions: [{ pageNumber: 5 }, { pageNumber: 6 }, { pageNumber: 7 }],
			}),
		).toBe("5–7");
	});

	it("merges overlapping ranges", () => {
		expect(
			mergeAndFormatPageRanges({
				mentions: [
					{ pageNumber: 3, pageNumberEnd: 4 },
					{ pageNumber: 4, pageNumberEnd: 6 },
				],
			}),
		).toBe("3–6");
	});

	it("merges adjacent ranges", () => {
		expect(
			mergeAndFormatPageRanges({
				mentions: [{ pageNumber: 1, pageNumberEnd: 2 }, { pageNumber: 3 }],
			}),
		).toBe("1–3");
	});

	it("keeps non-overlapping ranges separate", () => {
		expect(
			mergeAndFormatPageRanges({
				mentions: [{ pageNumber: 1 }, { pageNumber: 5 }, { pageNumber: 10 }],
			}),
		).toBe("1, 5, 10");
	});

	it("handles pageNumberEnd (single-page range)", () => {
		expect(
			mergeAndFormatPageRanges({
				mentions: [{ pageNumber: 7, pageNumberEnd: 7 }],
			}),
		).toBe("7");
	});

	it("handles pageNumberEnd (multi-page range)", () => {
		expect(
			mergeAndFormatPageRanges({
				mentions: [{ pageNumber: 10, pageNumberEnd: 12 }],
			}),
		).toBe("10–12");
	});

	it("sorts and merges unsorted mentions", () => {
		expect(
			mergeAndFormatPageRanges({
				mentions: [
					{ pageNumber: 7 },
					{ pageNumber: 1 },
					{ pageNumber: 5 },
					{ pageNumber: 6 },
				],
			}),
		).toBe("1, 5–7");
	});

	it("complex: mixed single pages and ranges", () => {
		expect(
			mergeAndFormatPageRanges({
				mentions: [
					{ pageNumber: 1 },
					{ pageNumber: 2 },
					{ pageNumber: 3 },
					{ pageNumber: 5 },
					{ pageNumber: 7 },
					{ pageNumber: 10, pageNumberEnd: 12 },
				],
			}),
		).toBe("1–3, 5, 7, 10–12");
	});
});
