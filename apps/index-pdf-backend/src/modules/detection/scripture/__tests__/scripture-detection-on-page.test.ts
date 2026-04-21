// biome-ignore-all lint/correctness/noUnusedVariables: large test file with intentional unused bindings and destructuring placeholders
import "../../../../test/setup";
import { getParserProfile } from "@pubint/core";
import { describe, expect, it } from "vitest";
import {
	buildAliasIndex,
	scanTextWithAliasIndex,
} from "../../alias/alias-engine";
import type { AliasInput } from "../../alias/alias-engine.types";
import type { MatcherMentionParserSegment } from "../../detection.types";
import { runScriptureDetectionOnPage } from "../scripture-detection-on-page";
import {
	normalizedForComparison,
	normalizeSegmentForComparison,
	scriptureDetectionCases,
} from "./fixtures/scripture-detection-on-page.fixture";

describe("runScriptureDetectionOnPage", () => {
	const profile = getParserProfile("scripture-biblical");

	it("returns aliasAttached and unknownSpans for a short page", () => {
		const pageText = "Gen 1:1 and Exod 3:2.";
		const aliases: AliasInput[] = [
			{
				alias: "Gen",
				matcherId: "gen",
				entryId: "genesis",
				indexType: "bible",
				groupId: "Old Testament",
			},
			{
				alias: "Exod",
				matcherId: "exod",
				entryId: "exodus",
				indexType: "bible",
				groupId: "Old Testament",
			},
		];
		const aliasIndex = buildAliasIndex(aliases);
		const matches = scanTextWithAliasIndex(pageText, aliasIndex);

		const result = runScriptureDetectionOnPage(
			pageText,
			matches,
			profile ?? null,
		);

		expect(result).toHaveProperty("aliasAttached");
		expect(result).toHaveProperty("unknownSpans");
		expect(Array.isArray(result.aliasAttached)).toBe(true);
		expect(Array.isArray(result.unknownSpans)).toBe(true);
	});

	it.each(scriptureDetectionCases)("$name", ({
		pageText,
		aliases,
		expected,
	}) => {
		const matches =
			aliases.length === 0
				? []
				: scanTextWithAliasIndex(pageText, buildAliasIndex(aliases));
		const profileOrNull = profile ?? null;
		const actual = runScriptureDetectionOnPage(
			pageText,
			matches,
			profileOrNull,
		);
		const normalized = normalizedForComparison(actual);
		const expectedNormalized = {
			aliasAttached: (expected.aliasAttached ?? []).map((a) => ({
				...a,
				segments: a.segments.map(normalizeSegmentForComparison),
			})),
			unknownSpans: (expected.unknownSpans ?? []).map((s) => ({
				segments: s.segments.map(normalizeSegmentForComparison),
			})),
		};
		expectedNormalized.aliasAttached.sort((a, b) =>
			a.groupId.localeCompare(b.groupId),
		);
		expectedNormalized.unknownSpans.sort((a, b) => {
			const join = (segs: MatcherMentionParserSegment[]) =>
				segs.map((x) => x.refText ?? "").join(";");
			return join(a.segments).localeCompare(join(b.segments));
		});
		expect(normalized).toEqual(expectedNormalized);
	});
});
