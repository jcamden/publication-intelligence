import { describe, expect, it } from "vitest";
import { mergeBboxesOnSameLine } from "./bbox-merge.utils";

describe("mergeBboxesOnSameLine", () => {
	it("returns null for null input", () => {
		expect(mergeBboxesOnSameLine(null)).toBeNull();
	});

	it("returns empty array as-is", () => {
		expect(mergeBboxesOnSameLine([])).toEqual([]);
	});

	it("returns single bbox as-is", () => {
		const one = [{ x: 10, y: 20, width: 50, height: 12 }];
		expect(mergeBboxesOnSameLine(one)).toEqual(one);
	});

	it("merges two bboxes on same line (same y) into one", () => {
		const bboxes = [
			{ x: 10, y: 100, width: 30, height: 14 },
			{ x: 50, y: 100, width: 40, height: 14 },
		];
		const result = mergeBboxesOnSameLine(bboxes);
		expect(result).toHaveLength(1);
		expect(result![0]).toEqual({
			x: 10,
			y: 100,
			width: 80, // 50 + 40 - 10 = 80 (right 90 - left 10)
			height: 14,
		});
	});

	it("does not merge bboxes on different lines (different y)", () => {
		const bboxes = [
			{ x: 10, y: 100, width: 30, height: 14 },
			{ x: 10, y: 120, width: 30, height: 14 },
		];
		const result = mergeBboxesOnSameLine(bboxes);
		expect(result).toHaveLength(2);
		expect(result![0]).toEqual(bboxes[0]);
		expect(result![1]).toEqual(bboxes[1]);
	});

	it("merges three on one line, keeps one on another", () => {
		const bboxes = [
			{ x: 0, y: 50, width: 20, height: 10 },
			{ x: 25, y: 50, width: 15, height: 10 },
			{ x: 45, y: 50, width: 25, height: 10 },
			{ x: 0, y: 70, width: 30, height: 10 },
		];
		const result = mergeBboxesOnSameLine(bboxes);
		expect(result).toHaveLength(2);
		expect(result![0]).toEqual({
			x: 0,
			y: 50,
			width: 70,
			height: 10,
		});
		expect(result![1]).toEqual(bboxes[3]);
	});

	it("treats bboxes within y tolerance as same line", () => {
		const bboxes = [
			{ x: 10, y: 100, width: 20, height: 12 },
			{ x: 35, y: 100.5, width: 25, height: 12 },
		];
		const result = mergeBboxesOnSameLine(bboxes);
		expect(result).toHaveLength(1);
		expect(result![0].x).toBe(10);
		expect(result![0].width).toBe(50);
	});
});
