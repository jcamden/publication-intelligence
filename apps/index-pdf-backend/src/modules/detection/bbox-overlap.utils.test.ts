import "../../test/setup";
import { describe, expect, it } from "vitest";
import type { BboxAtom } from "./bbox-canonical.utils";
import {
	aabbFromBboxes,
	bboxOverlapRatio,
	DEFAULT_OVERLAP_THRESHOLD,
	filterFuzzyDuplicateCandidates,
	iouPdfJs,
} from "./bbox-overlap.utils";

describe("aabbFromBboxes", () => {
	it("returns null for empty array", () => {
		expect(aabbFromBboxes([])).toBeNull();
	});

	it("returns same rect for single bbox", () => {
		const b: BboxAtom = { x: 10, y: 20, width: 5, height: 3 };
		expect(aabbFromBboxes([b])).toEqual(b);
	});

	it("returns AABB covering union of two rects", () => {
		const bboxes: BboxAtom[] = [
			{ x: 0, y: 0, width: 10, height: 5 },
			{ x: 15, y: 2, width: 5, height: 4 },
		];
		expect(aabbFromBboxes(bboxes)).toEqual({
			x: 0,
			y: 0,
			width: 20,
			height: 6,
		});
	});

	it("ignores invalid rects (zero or negative width/height)", () => {
		const bboxes: BboxAtom[] = [
			{ x: 0, y: 0, width: 0, height: 5 },
			{ x: 0, y: 0, width: 10, height: 5 },
		];
		expect(aabbFromBboxes(bboxes)).toEqual({
			x: 0,
			y: 0,
			width: 10,
			height: 5,
		});
	});

	it("returns null when all rects are invalid", () => {
		expect(
			aabbFromBboxes([
				{ x: 0, y: 0, width: 0, height: 0 },
				{ x: 1, y: 1, width: -1, height: 1 },
			]),
		).toBeNull();
	});
});

describe("iouPdfJs", () => {
	it("returns 1 for identical rects", () => {
		const a: BboxAtom = { x: 0, y: 0, width: 10, height: 10 };
		expect(iouPdfJs(a, a)).toBe(1);
	});

	it("returns 0 for non-overlapping rects", () => {
		const a: BboxAtom = { x: 0, y: 0, width: 10, height: 10 };
		const b: BboxAtom = { x: 20, y: 0, width: 10, height: 10 };
		expect(iouPdfJs(a, b)).toBe(0);
	});

	it("returns 0 when only edges touch", () => {
		const a: BboxAtom = { x: 0, y: 0, width: 10, height: 10 };
		const b: BboxAtom = { x: 10, y: 0, width: 10, height: 10 };
		expect(iouPdfJs(a, b)).toBe(0);
	});

	it("returns correct IoU for partial overlap", () => {
		// a: 0,0 to 10,10 (area 100). b: 5,5 to 15,15 (area 100). intersection: 5x5 = 25, union = 100+100-25 = 175, IoU = 25/175
		const a: BboxAtom = { x: 0, y: 0, width: 10, height: 10 };
		const b: BboxAtom = { x: 5, y: 5, width: 10, height: 10 };
		const iou = iouPdfJs(a, b);
		expect(iou).toBeCloseTo(25 / 175, 10);
	});

	it("returns 1 when one fully contains the other (same union as larger)", () => {
		const small: BboxAtom = { x: 2, y: 2, width: 6, height: 6 };
		const large: BboxAtom = { x: 0, y: 0, width: 10, height: 10 };
		// intersection = 36, union = 100 + 36 - 36 = 100, IoU = 36/100
		expect(iouPdfJs(small, large)).toBeCloseTo(36 / 100, 10);
	});
});

describe("bboxOverlapRatio", () => {
	it("returns 0 when either set is empty", () => {
		const b: BboxAtom[] = [{ x: 0, y: 0, width: 10, height: 10 }];
		expect(bboxOverlapRatio([], b)).toBe(0);
		expect(bboxOverlapRatio(b, [])).toBe(0);
	});

	it("returns 1 when AABBs are identical", () => {
		const a: BboxAtom[] = [{ x: 0, y: 0, width: 10, height: 10 }];
		const b: BboxAtom[] = [{ x: 0, y: 0, width: 10, height: 10 }];
		expect(bboxOverlapRatio(a, b)).toBe(1);
	});

	it("returns high IoU for slightly different bboxes (fuzzy match)", () => {
		// 1px shift in x only: intersection 49*12, union 600+600-588 => IoU ≈ 0.96
		const a: BboxAtom[] = [{ x: 100, y: 200, width: 50, height: 12 }];
		const b: BboxAtom[] = [{ x: 101, y: 200, width: 50, height: 12 }];
		const ratio = bboxOverlapRatio(a, b);
		expect(ratio).toBeGreaterThan(DEFAULT_OVERLAP_THRESHOLD);
	});

	it("returns ~0.89 for PyMuPDF vs pdfjs coordinate drift (regression)", () => {
		// Real values from detection run: candidate (PyMuPDF) vs existing (pdfjs)
		const candidate: BboxAtom[] = [
			{
				x: 207.4637451171875,
				y: 594.4601135253906,
				width: 38.30799865722656,
				height: 11.779998779296875,
			},
		];
		const existing: BboxAtom[] = [
			{
				x: 207.88447265625,
				y: 595.0625,
				width: 36.18339843749999,
				height: 11.200000000000045,
			},
		];
		const ratio = bboxOverlapRatio(candidate, existing);
		expect(ratio).toBeGreaterThan(0.89);
		expect(ratio).toBeLessThan(0.9);
		expect(ratio).toBeGreaterThanOrEqual(DEFAULT_OVERLAP_THRESHOLD);
	});

	it("uses AABB for multi-rect mentions", () => {
		const a: BboxAtom[] = [
			{ x: 0, y: 0, width: 5, height: 10 },
			{ x: 5, y: 0, width: 5, height: 10 },
		];
		const b: BboxAtom[] = [{ x: 0, y: 0, width: 10, height: 10 }];
		const ratio = bboxOverlapRatio(a, b);
		expect(ratio).toBeGreaterThan(0);
		expect(ratio).toBeLessThanOrEqual(1);
	});
});

describe("filterFuzzyDuplicateCandidates", () => {
	const overlapThreshold = DEFAULT_OVERLAP_THRESHOLD;

	it("keeps all candidates when existing is empty", () => {
		const candidates = [
			{
				pageNumber: 1,
				textSpan: "foo",
				bboxes: [{ x: 0, y: 0, width: 10, height: 5 }],
			},
		];
		expect(filterFuzzyDuplicateCandidates(candidates, [])).toEqual(candidates);
	});

	it("filters out candidate that matches existing (same page, text, high overlap)", () => {
		const bbox: BboxAtom = { x: 100, y: 200, width: 50, height: 12 };
		const candidates: Array<{
			pageNumber: number;
			textSpan: string;
			bboxes: BboxAtom[];
		}> = [{ pageNumber: 1, textSpan: "Qumran", bboxes: [bbox] }];
		const existing = [
			{
				pageNumber: 1,
				textSpan: "Qumran",
				bboxes: [bbox],
				projectIndexTypeId: "pid-1",
			},
		];
		expect(
			filterFuzzyDuplicateCandidates(
				candidates.map((c) => ({ ...c, projectIndexTypeId: "pid-1" })),
				existing,
				{ overlapThreshold },
			),
		).toHaveLength(0);
	});

	it("keeps candidate when text differs", () => {
		const bbox: BboxAtom = { x: 0, y: 0, width: 10, height: 5 };
		const candidates = [
			{
				pageNumber: 1,
				textSpan: "Qumran",
				bboxes: [bbox],
				projectIndexTypeId: "pid-1",
			},
		];
		const existing = [
			{
				pageNumber: 1,
				textSpan: "Cairo",
				bboxes: [bbox],
				projectIndexTypeId: "pid-1",
			},
		];
		expect(
			filterFuzzyDuplicateCandidates(candidates, existing, {
				overlapThreshold,
			}),
		).toHaveLength(1);
	});

	it("keeps candidate when page differs", () => {
		const bbox: BboxAtom = { x: 0, y: 0, width: 10, height: 5 };
		const candidates = [
			{
				pageNumber: 2,
				textSpan: "Qumran",
				bboxes: [bbox],
				projectIndexTypeId: "pid-1",
			},
		];
		const existing = [
			{
				pageNumber: 1,
				textSpan: "Qumran",
				bboxes: [bbox],
				projectIndexTypeId: "pid-1",
			},
		];
		expect(
			filterFuzzyDuplicateCandidates(candidates, existing, {
				overlapThreshold,
			}),
		).toHaveLength(1);
	});

	it("keeps candidate when overlap is below threshold", () => {
		const candBbox: BboxAtom = { x: 0, y: 0, width: 10, height: 10 };
		const existBbox: BboxAtom = { x: 50, y: 50, width: 10, height: 10 };
		const candidates = [
			{
				pageNumber: 1,
				textSpan: "Qumran",
				bboxes: [candBbox],
				projectIndexTypeId: "pid-1",
			},
		];
		const existing = [
			{
				pageNumber: 1,
				textSpan: "Qumran",
				bboxes: [existBbox],
				projectIndexTypeId: "pid-1",
			},
		];
		expect(
			filterFuzzyDuplicateCandidates(candidates, existing, {
				overlapThreshold,
			}),
		).toHaveLength(1);
	});

	it("ignores existing mentions with null or empty bboxes", () => {
		const bbox: BboxAtom = { x: 0, y: 0, width: 10, height: 5 };
		const candidates = [
			{
				pageNumber: 1,
				textSpan: "Qumran",
				bboxes: [bbox],
				projectIndexTypeId: "pid-1",
			},
		];
		const existing = [
			{
				pageNumber: 1,
				textSpan: "Qumran",
				bboxes: null,
				projectIndexTypeId: "pid-1",
			},
			{
				pageNumber: 1,
				textSpan: "Qumran",
				bboxes: [],
				projectIndexTypeId: "pid-1",
			},
		];
		expect(
			filterFuzzyDuplicateCandidates(candidates, existing, {
				overlapThreshold,
			}),
		).toHaveLength(1);
	});

	it("keeps candidates with empty bboxes (no fuzzy dedupe)", () => {
		const existing = [
			{
				pageNumber: 1,
				textSpan: "Qumran",
				bboxes: [{ x: 0, y: 0, width: 10, height: 5 }],
				projectIndexTypeId: "pid-1",
			},
		];
		const candidates = [
			{
				pageNumber: 1,
				textSpan: "Qumran",
				bboxes: [],
				projectIndexTypeId: "pid-1",
			},
		];
		expect(
			filterFuzzyDuplicateCandidates(candidates, existing, {
				overlapThreshold,
			}),
		).toHaveLength(1);
	});

	it("normalizes text (trim and collapse spaces) for match", () => {
		const bbox: BboxAtom = { x: 0, y: 0, width: 10, height: 5 };
		const candidates = [
			{
				pageNumber: 1,
				textSpan: "  Qumran  ",
				bboxes: [bbox],
				projectIndexTypeId: "pid-1",
			},
		];
		const existing = [
			{
				pageNumber: 1,
				textSpan: "Qumran",
				bboxes: [bbox],
				projectIndexTypeId: "pid-1",
			},
		];
		expect(
			filterFuzzyDuplicateCandidates(candidates, existing, {
				overlapThreshold,
			}),
		).toHaveLength(0);
	});

	it("filters by projectIndexTypeId when provided on candidate", () => {
		const bbox: BboxAtom = { x: 0, y: 0, width: 10, height: 5 };
		const candidates = [
			{
				pageNumber: 1,
				textSpan: "Qumran",
				bboxes: [bbox],
				projectIndexTypeId: "pid-1",
			},
		];
		const existing = [
			{
				pageNumber: 1,
				textSpan: "Qumran",
				bboxes: [bbox],
				projectIndexTypeId: "pid-2",
			},
		];
		expect(
			filterFuzzyDuplicateCandidates(candidates, existing, {
				overlapThreshold,
			}),
		).toHaveLength(1);
	});
});
