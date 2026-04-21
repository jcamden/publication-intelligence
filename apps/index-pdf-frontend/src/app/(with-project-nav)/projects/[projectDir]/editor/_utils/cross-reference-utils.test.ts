import { describe, expect, it } from "vitest";
import type { CrossReference, IndexEntry } from "../_types/index-entry";
import {
	formatCrossReferences,
	formatSingleCrossReferenceLabel,
	getDirectiveForSingleRef,
} from "./cross-reference-utils";

const makeEntry = ({
	id,
	label,
	parentId = null,
}: {
	id: string;
	label: string;
	parentId?: string | null;
}): IndexEntry =>
	({
		id,
		label,
		parentId,
		indexType: "subject",
	}) as IndexEntry;

const makeRef = ({
	id,
	toEntryId,
	relationType,
}: {
	id: string;
	toEntryId: string;
	relationType: "see" | "see_also" | "qv";
}): CrossReference =>
	({
		id,
		toEntryId,
		arbitraryValue: null,
		relationType,
		toEntry: { id: toEntryId, label: "" },
	}) as CrossReference;

describe("formatCrossReferences", () => {
	it("returns empty string when no cross-references", () => {
		expect(
			formatCrossReferences({
				crossReferences: [],
				allEntries: [],
			}),
		).toBe("");
	});

	it("formats top-level entry as label only", () => {
		const entries = [makeEntry({ id: "e1", label: "Animals" })];
		const refs: CrossReference[] = [
			makeRef({ id: "r1", toEntryId: "e1", relationType: "see" }),
		];
		expect(
			formatCrossReferences({
				crossReferences: refs,
				allEntries: entries,
			}),
		).toBe("See Animals");
	});

	it("formats subentry with 'under' (target has parent)", () => {
		const entries = [
			makeEntry({ id: "e1", label: "Bruges" }),
			makeEntry({ id: "e2", label: "lace making", parentId: "e1" }),
		];
		const refs: CrossReference[] = [
			makeRef({ id: "r1", toEntryId: "e2", relationType: "see" }),
		];
		expect(
			formatCrossReferences({
				crossReferences: refs,
				allEntries: entries,
			}),
		).toBe("See under Bruges: lace making");
	});

	it("formats deep hierarchy with 'under'", () => {
		const entries = [
			makeEntry({ id: "e1", label: "Grandparent" }),
			makeEntry({ id: "e2", label: "Parent", parentId: "e1" }),
			makeEntry({ id: "e3", label: "Child", parentId: "e2" }),
		];
		const refs: CrossReference[] = [
			makeRef({ id: "r1", toEntryId: "e3", relationType: "see" }),
		];
		expect(
			formatCrossReferences({
				crossReferences: refs,
				allEntries: entries,
			}),
		).toBe("See under Grandparent: Parent: Child");
	});

	it("formats see_also under when target has parent", () => {
		const entries = [
			makeEntry({ id: "e1", label: "Qumran" }),
			makeEntry({ id: "e2", label: "community", parentId: "e1" }),
		];
		const refs: CrossReference[] = [
			makeRef({ id: "r1", toEntryId: "e2", relationType: "see_also" }),
		];
		expect(
			formatCrossReferences({
				crossReferences: refs,
				allEntries: entries,
			}),
		).toBe("See also under Qumran: community");
	});

	it("merges multiple see_also targets with semicolons, alphabetical", () => {
		const entries = [
			makeEntry({ id: "e1", label: "permission to reprint" }),
			makeEntry({ id: "e2", label: "source notes" }),
		];
		const refs: CrossReference[] = [
			makeRef({ id: "r1", toEntryId: "e2", relationType: "see_also" }),
			makeRef({ id: "r2", toEntryId: "e1", relationType: "see_also" }),
		];
		expect(
			formatCrossReferences({
				crossReferences: refs,
				allEntries: entries,
			}),
		).toBe("See also permission to reprint; source notes");
	});

	it("orders phrases: redirects first (see, qv), then see_also", () => {
		const entries = [
			makeEntry({ id: "e1", label: "Alpha" }),
			makeEntry({ id: "e2", label: "Beta" }),
			makeEntry({ id: "e3", label: "Gamma" }),
		];
		const refs: CrossReference[] = [
			makeRef({ id: "r1", toEntryId: "e3", relationType: "see_also" }),
			makeRef({ id: "r2", toEntryId: "e1", relationType: "see" }),
			makeRef({ id: "r3", toEntryId: "e2", relationType: "qv" }),
		];
		expect(
			formatCrossReferences({
				crossReferences: refs,
				allEntries: entries,
			}),
		).toBe("See Alpha. q.v. Beta. See also Gamma");
	});

	it("does not merge across relation types (each type gets own phrase)", () => {
		const entries = [
			makeEntry({ id: "e1", label: "A" }),
			makeEntry({ id: "e2", label: "B" }),
		];
		const refs: CrossReference[] = [
			makeRef({ id: "r1", toEntryId: "e1", relationType: "see" }),
			makeRef({ id: "r2", toEntryId: "e2", relationType: "see_also" }),
		];
		const out = formatCrossReferences({
			crossReferences: refs,
			allEntries: entries,
		});
		expect(out).toContain("See A");
		expect(out).toContain("See also B");
		expect(out).toBe("See A. See also B");
	});

	it("splits same-type refs into separate phrases: non-under then under", () => {
		const entries = [
			makeEntry({ id: "e1", label: "Mexican art" }),
			makeEntry({ id: "e2", label: "Yucatán" }),
			makeEntry({ id: "e3", label: "Maya", parentId: "e2" }),
		];
		const refs: CrossReference[] = [
			makeRef({ id: "r1", toEntryId: "e1", relationType: "see_also" }),
			makeRef({ id: "r2", toEntryId: "e3", relationType: "see_also" }),
		];
		expect(
			formatCrossReferences({
				crossReferences: refs,
				allEntries: entries,
			}),
		).toBe("See also Mexican art. See also under Yucatán: Maya");
	});

	it("includes arbitrary-value refs (no toEntryId)", () => {
		const entries = [makeEntry({ id: "e1", label: "Real" })];
		const refs: CrossReference[] = [
			makeRef({ id: "r1", toEntryId: "e1", relationType: "see" }),
			{
				id: "r2",
				toEntryId: null,
				arbitraryValue: "Notes sections",
				relationType: "see_also",
				toEntry: null,
			} as CrossReference,
		];
		expect(
			formatCrossReferences({
				crossReferences: refs,
				allEntries: entries,
			}),
		).toBe("See Real. See also Notes sections");
	});
});

describe("getDirectiveForSingleRef", () => {
	it("returns directive for arbitrary value ref", () => {
		const entries: IndexEntry[] = [];
		expect(
			getDirectiveForSingleRef({
				ref: {
					toEntryId: null,
					arbitraryValue: "Notes",
					relationType: "see_also",
				},
				allEntries: entries,
			}),
		).toBe("See also");
	});

	it("returns 'See under' when target entry has parent", () => {
		const entries = [
			makeEntry({ id: "e1", label: "Bruges" }),
			makeEntry({ id: "e2", label: "lace making", parentId: "e1" }),
		];
		expect(
			getDirectiveForSingleRef({
				ref: { toEntryId: "e2", relationType: "see", arbitraryValue: null },
				allEntries: entries,
			}),
		).toBe("See under");
	});

	it("returns plain directive when target has no parent", () => {
		const entries = [makeEntry({ id: "e1", label: "Animals" })];
		expect(
			getDirectiveForSingleRef({
				ref: { toEntryId: "e1", relationType: "see", arbitraryValue: null },
				allEntries: entries,
			}),
		).toBe("See");
	});
});

describe("formatSingleCrossReferenceLabel", () => {
	it("formats entry ref with no parent", () => {
		const entries = [makeEntry({ id: "e1", label: "Animals" })];
		expect(
			formatSingleCrossReferenceLabel({
				ref: makeRef({ id: "r1", toEntryId: "e1", relationType: "see" }),
				allEntries: entries,
			}),
		).toBe("See Animals");
	});

	it("formats entry ref with parent (under)", () => {
		const entries = [
			makeEntry({ id: "e1", label: "Bruges" }),
			makeEntry({ id: "e2", label: "lace making", parentId: "e1" }),
		];
		expect(
			formatSingleCrossReferenceLabel({
				ref: makeRef({ id: "r1", toEntryId: "e2", relationType: "see" }),
				allEntries: entries,
			}),
		).toBe("See under Bruges: lace making");
	});

	it("formats arbitrary value ref", () => {
		expect(
			formatSingleCrossReferenceLabel({
				ref: {
					toEntryId: null,
					arbitraryValue: "Notes sections",
					relationType: "see_also",
				},
				allEntries: [],
			}),
		).toBe("See also Notes sections");
	});

	it("returns Unknown when toEntryId is null and no arbitraryValue", () => {
		expect(
			formatSingleCrossReferenceLabel({
				ref: {
					toEntryId: null,
					arbitraryValue: null,
					relationType: "see",
				},
				allEntries: [],
			}),
		).toBe("Unknown");
	});
});
