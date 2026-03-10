import "../../test/setup";
import { describe, expect, it } from "vitest";
import { buildAliasIndex, scanTextWithAliasIndex } from "./alias-engine";
import type { AliasInput } from "./alias-engine.types";
import { mapPositionsToBBoxes } from "./charAt-mapping.utils";
import { sortMatcherCandidates } from "./detection.service";
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
