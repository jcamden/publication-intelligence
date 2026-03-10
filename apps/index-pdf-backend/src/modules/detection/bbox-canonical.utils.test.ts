import "../../test/setup";
import { describe, expect, it } from "vitest";
import {
	bboxesHash,
	buildDedupeKey,
	canonicalBboxJson,
	canonicalizeBboxes,
	type BboxAtom,
} from "./bbox-canonical.utils";

// ============================================================================
// Canonical bbox ordering and dedupe key (Task 4.2)
// ============================================================================

describe("canonicalizeBboxes", () => {
	it("sorts by y then x then width then height", () => {
		const bboxes: BboxAtom[] = [
			{ x: 20, y: 10, width: 5, height: 2 },
			{ x: 10, y: 10, width: 5, height: 2 },
			{ x: 10, y: 0, width: 5, height: 2 },
		];
		const out = canonicalizeBboxes(bboxes);
		expect(out[0].y).toBe(0);
		expect(out[1].y).toBe(10);
		expect(out[2].y).toBe(10);
		expect(out[1].x).toBe(10);
		expect(out[2].x).toBe(20);
	});

	it("produces identical order for equivalent set in different input order", () => {
		const a: BboxAtom[] = [
			{ x: 1, y: 0, width: 2, height: 1 },
			{ x: 0, y: 0, width: 2, height: 1 },
		];
		const b: BboxAtom[] = [
			{ x: 0, y: 0, width: 2, height: 1 },
			{ x: 1, y: 0, width: 2, height: 1 },
		];
		expect(canonicalizeBboxes(a)).toEqual(canonicalizeBboxes(b));
	});

	it("returns empty array for empty input", () => {
		expect(canonicalizeBboxes([])).toEqual([]);
	});
});

describe("canonicalBboxJson", () => {
	it("generates identical JSON for equivalent bbox sets", () => {
		const a: BboxAtom[] = [
			{ x: 1, y: 0, width: 2, height: 1 },
			{ x: 0, y: 0, width: 2, height: 1 },
		];
		const b: BboxAtom[] = [
			{ x: 0, y: 0, width: 2, height: 1 },
			{ x: 1, y: 0, width: 2, height: 1 },
		];
		expect(canonicalBboxJson(a)).toBe(canonicalBboxJson(b));
	});
});

describe("bboxesHash", () => {
	it("generates identical hash for equivalent bbox sets", () => {
		const a: BboxAtom[] = [
			{ x: 1, y: 0, width: 2, height: 1 },
			{ x: 0, y: 0, width: 2, height: 1 },
		];
		const b: BboxAtom[] = [
			{ x: 0, y: 0, width: 2, height: 1 },
			{ x: 1, y: 0, width: 2, height: 1 },
		];
		expect(bboxesHash(a)).toBe(bboxesHash(b));
	});

	it("generates different hash for different bbox content", () => {
		const a: BboxAtom[] = [{ x: 0, y: 0, width: 1, height: 1 }];
		const b: BboxAtom[] = [{ x: 0, y: 0, width: 2, height: 1 }];
		expect(bboxesHash(a)).not.toBe(bboxesHash(b));
	});
});

describe("buildDedupeKey", () => {
	it("produces identical key for same matcher + page + equivalent bboxes", () => {
		const projectIndexTypeId = "pit-1";
		const matcherId = "m1";
		const pageNumber = 1;
		const bboxes1: BboxAtom[] = [
			{ x: 1, y: 0, width: 2, height: 1 },
			{ x: 0, y: 0, width: 2, height: 1 },
		];
		const bboxes2: BboxAtom[] = [
			{ x: 0, y: 0, width: 2, height: 1 },
			{ x: 1, y: 0, width: 2, height: 1 },
		];
		const key1 = buildDedupeKey({
			projectIndexTypeId,
			matcherId,
			pageNumber,
			bboxes: bboxes1,
		});
		const key2 = buildDedupeKey({
			projectIndexTypeId,
			matcherId,
			pageNumber,
			bboxes: bboxes2,
		});
		expect(key1).toBe(key2);
	});

	it("produces different keys for different matcher", () => {
		const bboxes: BboxAtom[] = [{ x: 0, y: 0, width: 1, height: 1 }];
		const key1 = buildDedupeKey({
			projectIndexTypeId: "pit-1",
			matcherId: "m1",
			pageNumber: 1,
			bboxes,
		});
		const key2 = buildDedupeKey({
			projectIndexTypeId: "pit-1",
			matcherId: "m2",
			pageNumber: 1,
			bboxes,
		});
		expect(key1).not.toBe(key2);
	});

	it("produces different keys for different bbox", () => {
		const key1 = buildDedupeKey({
			projectIndexTypeId: "pit-1",
			matcherId: "m1",
			pageNumber: 1,
			bboxes: [{ x: 0, y: 0, width: 1, height: 1 }],
		});
		const key2 = buildDedupeKey({
			projectIndexTypeId: "pit-1",
			matcherId: "m1",
			pageNumber: 1,
			bboxes: [{ x: 0, y: 0, width: 2, height: 1 }],
		});
		expect(key1).not.toBe(key2);
	});
});
