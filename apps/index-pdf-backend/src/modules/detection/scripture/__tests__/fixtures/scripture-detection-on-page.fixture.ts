// biome-ignore-all lint/correctness/noUnusedVariables: <reason>

import type { AliasInput } from "../../../alias/alias-engine.types";
import type {
	MatcherMentionParserSegment,
	ScriptureDetectionPageResult,
} from "../../../detection.types";

/** Remove keys whose value is undefined (for stable comparison). */
function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
	const out = { ...obj };
	for (const key of Object.keys(out) as (keyof T)[]) {
		if (out[key] === undefined) delete out[key];
	}
	return out;
}

/** Normalize segment for comparison: strip undefined; drop verseEnd when same as verseStart (single verse); drop verseSuffix for a-b range refs. */
export function normalizeSegmentForComparison(
	seg: MatcherMentionParserSegment,
): MatcherMentionParserSegment {
	let out: MatcherMentionParserSegment = stripUndefined({
		...seg,
	}) as MatcherMentionParserSegment;
	// Single verse: parser may emit verseEnd === verseStart; expected often omits verseEnd
	if (
		out.verseEnd !== undefined &&
		out.verseStart !== undefined &&
		out.verseEnd === out.verseStart
	) {
		const { verseEnd: _e, ...rest } = out;
		out = rest;
	}
	// a-b range: parser may emit verseSuffix "a"; expected often omits verseSuffix for the range
	if (out.refText?.includes("a-b")) {
		const { verseSuffix: _s, ...rest } = out;
		out = rest;
	}
	return out;
}

/** Normalize for comparison: drop positions and fallbackBookLevel; keep each span so we assert parser segment separation; sort segments by refText; sort unknownSpans by joined refText; strip undefined. */
export function normalizedForComparison(result: ScriptureDetectionPageResult) {
	const aliasAttached = result.aliasAttached
		.map((span) => ({
			groupId: span.groupId,
			matcherId: span.matcherId,
			entryId: span.entryId,
			indexType: span.indexType,
			segments: [...span.segments]
				.sort((x, y) => (x.refText ?? "").localeCompare(y.refText ?? ""))
				.map(normalizeSegmentForComparison),
		}))
		.sort(
			(a, b) =>
				a.groupId.localeCompare(b.groupId) ||
				a.entryId.localeCompare(b.entryId) ||
				a.segments
					.map((s) => s.refText ?? "")
					.join(";")
					.localeCompare(b.segments.map((s) => s.refText ?? "").join(";")),
		);
	const unknownSpans = result.unknownSpans
		.map((s) => ({
			segments: [...s.segments]
				.sort((x, y) => (x.refText ?? "").localeCompare(y.refText ?? ""))
				.map(normalizeSegmentForComparison),
		}))
		.sort((a, b) => {
			const join = (segs: MatcherMentionParserSegment[]) =>
				segs.map((x) => x.refText ?? "").join(";");
			return join(a.segments).localeCompare(join(b.segments));
		});
	return { aliasAttached, unknownSpans };
}

// ============================================================================
// Alias fixtures (AliasInput uses `alias`, not matchedAlias)
// ============================================================================

/** Two groups for tests. In real runs these are IndexGroup ids. */
const GRP_OT = "Old Testament";
const GRP_NT = "New Testament";

const GEN: AliasInput = {
	alias: "Gen",
	groupId: GRP_OT,
	matcherId: "gen",
	entryId: "genesis",
	indexType: "bible",
};

const GENESIS: AliasInput = {
	alias: "Genesis",
	groupId: GRP_OT,
	matcherId: "genesis",
	entryId: "genesis",
	indexType: "bible",
};

const EXOD: AliasInput = {
	alias: "Exod",
	groupId: GRP_OT,
	matcherId: "exod",
	entryId: "exodus",
	indexType: "bible",
};

const MARK: AliasInput = {
	alias: "Mark",
	groupId: GRP_NT,
	matcherId: "mark",
	entryId: "mark",
	indexType: "bible",
};

const JOHN: AliasInput = {
	alias: "John",
	groupId: GRP_NT,
	matcherId: "john",
	entryId: "john",
	indexType: "bible",
};

const PS: AliasInput = {
	alias: "Ps",
	groupId: GRP_OT,
	matcherId: "ps",
	entryId: "psalms",
	indexType: "bible",
};

const ROM: AliasInput = {
	alias: "Rom",
	groupId: GRP_NT,
	matcherId: "rom",
	entryId: "romans",
	indexType: "bible",
};

const MATT: AliasInput = {
	alias: "Matt",
	groupId: GRP_NT,
	matcherId: "matt",
	entryId: "matthew",
	indexType: "bible",
};

const REV: AliasInput = {
	alias: "Rev",
	groupId: GRP_NT,
	matcherId: "rev",
	entryId: "revelation",
	indexType: "bible",
};

const FIRST_SAM: AliasInput = {
	alias: "1 Sam",
	groupId: GRP_OT,
	matcherId: "1_sam",
	entryId: "1_samuel",
	indexType: "bible",
};

const FIRST_JOHN: AliasInput = {
	alias: "1 John",
	groupId: GRP_NT,
	matcherId: "1_john",
	entryId: "1_john",
	indexType: "bible",
};

const SONG: AliasInput = {
	alias: "Song",
	groupId: GRP_OT,
	matcherId: "song",
	entryId: "song_of_songs",
	indexType: "bible",
};

const ISA: AliasInput = {
	alias: "Isa",
	groupId: GRP_OT,
	matcherId: "isa",
	entryId: "isaiah",
	indexType: "bible",
};

const LUKE: AliasInput = {
	alias: "Luke",
	groupId: GRP_NT,
	matcherId: "luke",
	entryId: "luke",
	indexType: "bible",
};

const ROMANS: AliasInput = {
	alias: "Romans",
	groupId: GRP_NT,
	matcherId: "romans",
	entryId: "romans",
	indexType: "bible",
};

// ============================================================================
// Scenario test cases (table-driven)
// ============================================================================

export const scriptureDetectionCases: Array<{
	name: string;
	pageText: string;
	aliases: AliasInput[];
	expected: {
		aliasAttached?: Array<{
			groupId: string;
			matcherId: string;
			entryId: string;
			indexType: string;
			segments: MatcherMentionParserSegment[];
		}>;
		unknownSpans?: Array<{ segments: MatcherMentionParserSegment[] }>;
	};
}> = [
	{
		name: "book only - short alias",
		pageText:
			"The argument begins already in Gen before the narrative narrows.",
		aliases: [GEN],
		expected: {
			aliasAttached: [
				{
					groupId: GRP_OT,
					matcherId: "gen",
					entryId: "genesis",
					indexType: "bible",
					segments: [],
				},
			],
		},
	},
	{
		name: "book only - full book name",
		pageText: "Genesis introduces themes that recur later.",
		aliases: [GENESIS],
		expected: {
			aliasAttached: [
				{
					groupId: GRP_OT,
					matcherId: "genesis",
					entryId: "genesis",
					indexType: "bible",
					segments: [],
				},
			],
		},
	},
	{
		name: "chapter only",
		pageText: "The creation account opens in Gen 1 with a sweeping statement.",
		aliases: [GEN],
		expected: {
			aliasAttached: [
				{
					groupId: GRP_OT,
					matcherId: "gen",
					entryId: "genesis",
					indexType: "bible",
					segments: [{ refText: "1", chapterStart: 1 }],
				},
			],
		},
	},
	{
		name: "chapter range",
		pageText: "Many summaries treat Gen 1-3 as a single primeval unit.",
		aliases: [GEN],
		expected: {
			aliasAttached: [
				{
					groupId: GRP_OT,
					matcherId: "gen",
					entryId: "genesis",
					indexType: "bible",
					segments: [{ refText: "1-3", chapterStart: 1, chapterEnd: 3 }],
				},
			],
		},
	},
	{
		name: "single verse",
		pageText: "The opening line, Gen 1:1, is unusually compact.",
		aliases: [GEN],
		expected: {
			aliasAttached: [
				{
					groupId: GRP_OT,
					matcherId: "gen",
					entryId: "genesis",
					indexType: "bible",
					segments: [{ refText: "1:1", chapterStart: 1, verseStart: 1 }],
				},
			],
		},
	},
	{
		name: "single verse with dotted style",
		pageText: "Some European notes prefer Gen 1.1 in this context.",
		aliases: [GEN],
		expected: {
			aliasAttached: [
				{
					groupId: GRP_OT,
					matcherId: "gen",
					entryId: "genesis",
					indexType: "bible",
					segments: [{ refText: "1.1", chapterStart: 1, verseStart: 1 }],
				},
			],
		},
	},
	// {
	// 	name: "single verse with comma style",
	// 	pageText: "Older material may cite Gen 1,1 instead of using a colon.",
	// 	aliases: [GEN],
	// 	expected: {
	// 		aliasAttached: [
	// 			{
	// 				groupId: GRP_OT,
	// 				matcherId: "gen",
	// 				entryId: "genesis",
	// 				indexType: "bible",
	// 				segments: [{ refText: "1,1", chapterStart: 1, verseStart: 1 }],
	// 			},
	// 		],
	// 	},
	// },
	{
		name: "verse range",
		pageText: "A commentator may focus especially on Gen 1:1-3.",
		aliases: [GEN],
		expected: {
			aliasAttached: [
				{
					groupId: GRP_OT,
					matcherId: "gen",
					entryId: "genesis",
					indexType: "bible",
					segments: [
						{ refText: "1:1-3", chapterStart: 1, verseStart: 1, verseEnd: 3 },
					],
				},
			],
		},
	},
	{
		name: "verse range with dotted style",
		pageText: "Another edition writes the same unit as Gen 1.1-3.",
		aliases: [GEN],
		expected: {
			aliasAttached: [
				{
					groupId: GRP_OT,
					matcherId: "gen",
					entryId: "genesis",
					indexType: "bible",
					segments: [
						{ refText: "1.1-3", chapterStart: 1, verseStart: 1, verseEnd: 3 },
					],
				},
			],
		},
	},
	// {
	// 	name: "verse range with comma style",
	// 	pageText: "An older citation style may render this as Gen 1,1-3.",
	// 	aliases: [GEN],
	// 	expected: {
	// 		aliasAttached: [
	// 			{
	// 				groupId: GRP_OT,
	// 				matcherId: "gen",
	// 				entryId: "genesis",
	// 				indexType: "bible",
	// 				segments: [
	// 					{ refText: "1,1-3", chapterStart: 1, verseStart: 1, verseEnd: 3 },
	// 				],
	// 			},
	// 		],
	// 	},
	// },
	{
		name: "verse list",
		pageText:
			"The author highlights Gen 1:1, 3, 5 as a tightly linked opening.",
		aliases: [GEN],
		expected: {
			aliasAttached: [
				{
					groupId: GRP_OT,
					matcherId: "gen",
					entryId: "genesis",
					indexType: "bible",
					segments: [{ refText: "1:1", chapterStart: 1, verseStart: 1 }],
				},
				{
					groupId: GRP_OT,
					matcherId: "gen",
					entryId: "genesis",
					indexType: "bible",
					segments: [{ refText: "3", chapterStart: 1, verseStart: 3 }],
				},
				{
					groupId: GRP_OT,
					matcherId: "gen",
					entryId: "genesis",
					indexType: "bible",
					segments: [{ refText: "5", chapterStart: 1, verseStart: 5 }],
				},
			],
		},
	},
	{
		name: "verse list with ranges",
		pageText: "The discussion tracks Gen 31:1-8, 14-15, 23 quite closely.",
		aliases: [GEN],
		expected: {
			aliasAttached: [
				{
					groupId: GRP_OT,
					matcherId: "gen",
					entryId: "genesis",
					indexType: "bible",
					segments: [
						{
							refText: "14-15",
							chapterStart: 31,
							verseStart: 14,
							verseEnd: 15,
						},
					],
				},
				{
					groupId: GRP_OT,
					matcherId: "gen",
					entryId: "genesis",
					indexType: "bible",
					segments: [{ refText: "23", chapterStart: 31, verseStart: 23 }],
				},
				{
					groupId: GRP_OT,
					matcherId: "gen",
					entryId: "genesis",
					indexType: "bible",
					segments: [
						{
							refText: "31:1-8",
							chapterStart: 31,
							verseStart: 1,
							verseEnd: 8,
						},
					],
				},
			],
		},
	},
	{
		name: "cross chapter range",
		pageText: "The structure runs from Gen 1:20-2:4 without a break.",
		aliases: [GEN],
		expected: {
			aliasAttached: [
				{
					groupId: GRP_OT,
					matcherId: "gen",
					entryId: "genesis",
					indexType: "bible",
					segments: [
						{
							refText: "1:20-2:4",
							chapterStart: 1,
							chapterEnd: 2,
							verseStart: 20,
							verseEnd: 4,
						},
					],
				},
			],
		},
	},
	// {
	// 	name: "chapter only cluster after explicit book",
	// 	pageText: "The study moves through Gen 13; 15; 17 in sequence.",
	// 	aliases: [GEN],
	// 	expected: {
	// 		aliasAttached: [
	// 			{
	// 				groupId: GRP_OT,
	// 				matcherId: "gen",
	// 				entryId: "genesis",
	// 				indexType: "bible",
	// 				segments: [
	// 					{ refText: "13", chapterStart: 13 },
	// 					{ refText: "15", chapterStart: 15 },
	// 					{ refText: "17", chapterStart: 17 },
	// 				],
	// 			},
	// 		],
	// 	},
	// },
	// {
	// 	name: "chapter range after explicit book with prose around it",
	// 	pageText: "At a broad level, Gen 13-17 frames the patriarchal development.",
	// 	aliases: [GEN],
	// 	expected: {
	// 		aliasAttached: [
	// 			{
	// 				groupId: GRP_OT,
	// 				matcherId: "gen",
	// 				entryId: "genesis",
	// 				indexType: "bible",
	// 				segments: [{ refText: "13-17", chapterStart: 13, chapterEnd: 17 }],
	// 			},
	// 		],
	// 	},
	// },
	// {
	// 	name: "semicolon separated within same explicit book",
	// 	pageText: "See Gen 15:1; 17:1; and 22:2 for the recurring pattern.",
	// 	aliases: [GEN],
	// 	expected: {
	// 		aliasAttached: [
	// 			{
	// 				groupId: GRP_OT,
	// 				matcherId: "gen",
	// 				entryId: "genesis",
	// 				indexType: "bible",
	// 				segments: [
	// 					{ refText: "15:1", chapterStart: 15, verseStart: 1 },
	// 					{ refText: "17:1", chapterStart: 17, verseStart: 1 },
	// 					{ refText: "22:2", chapterStart: 22, verseStart: 2 },
	// 				],
	// 			},
	// 		],
	// 	},
	// },
	// {
	// 	name: "cf prefix with semicolon list",
	// 	pageText: "Cf. Gen 15:6; 17:5; 22:17 for the theological development.",
	// 	aliases: [GEN],
	// 	expected: {
	// 		aliasAttached: [
	// 			{
	// 				groupId: GRP_OT,
	// 				matcherId: "gen",
	// 				entryId: "genesis",
	// 				indexType: "bible",
	// 				segments: [
	// 					{ refText: "15:6", chapterStart: 15, verseStart: 6 },
	// 					{ refText: "17:5", chapterStart: 17, verseStart: 5 },
	// 					{ refText: "22:17", chapterStart: 22, verseStart: 17 },
	// 				],
	// 			},
	// 		],
	// 	},
	// },
	// {
	// 	name: "parenthetical explicit citation",
	// 	pageText: "Abraham's call (Gen 12:1-3) shapes the rest of the cycle.",
	// 	aliases: [GEN],
	// 	expected: {
	// 		aliasAttached: [
	// 			{
	// 				groupId: GRP_OT,
	// 				matcherId: "gen",
	// 				entryId: "genesis",
	// 				indexType: "bible",
	// 				segments: [{ refText: "12:1-3", chapterStart: 12, verseStart: 1, verseEnd: 3 }],
	// 			},
	// 		],
	// 	},
	// },
	// {
	// 	name: "bracketed explicit citation",
	// 	pageText: "The promise remains central [Gen 17:1].",
	// 	aliases: [GEN],
	// 	expected: {
	// 		aliasAttached: [
	// 			{
	// 				groupId: GRP_OT,
	// 				matcherId: "gen",
	// 				entryId: "genesis",
	// 				indexType: "bible",
	// 				segments: [{ refText: "17:1", chapterStart: 17, verseStart: 1 }],
	// 			},
	// 		],
	// 	},
	// },
	// {
	// 	name: "inline prose with explicit citation",
	// 	pageText: "In Gen 12:1-3 the command precedes the promise.",
	// 	aliases: [GEN],
	// 	expected: {
	// 		aliasAttached: [
	// 			{
	// 				groupId: GRP_OT,
	// 				matcherId: "gen",
	// 				entryId: "genesis",
	// 				indexType: "bible",
	// 				segments: [{ refText: "12:1-3", chapterStart: 12, verseStart: 1, verseEnd: 3 }],
	// 			},
	// 		],
	// 	},
	// },
	// {
	// 	name: "book carryover within same sentence",
	// 	pageText: "He begins with Gen 1:20-2:4, then turns to 2:5-7 and finally 3:1-6.",
	// 	aliases: [GEN],
	// 	expected: {
	// 		aliasAttached: [
	// 			{
	// 				groupId: GRP_OT,
	// 				matcherId: "gen",
	// 				entryId: "genesis",
	// 				indexType: "bible",
	// 				segments: [
	// 					{
	// 						refText: "1:20-2:4",
	// 						chapterStart: 1,
	// 						verseStart: 20,
	// 						chapterEnd: 2,
	// 						verseEnd: 4,
	// 					},
	// 					{ refText: "2:5-7", chapterStart: 2, verseStart: 5, verseEnd: 7 },
	// 					{ refText: "3:1-6", chapterStart: 3, verseStart: 1, verseEnd: 6 },
	// 				],
	// 			},
	// 		],
	// 	},
	// },
	// {
	// 	name: "book carryover with verse suffixes still attached",
	// 	pageText: "The note compares Gen 3:15 with 3:15b and then with 3:15a-b.",
	// 	aliases: [GEN],
	// 	expected: {
	// 		aliasAttached: [
	// 			{
	// 				groupId: GRP_OT,
	// 				matcherId: "gen",
	// 				entryId: "genesis",
	// 				indexType: "bible",
	// 				segments: [
	// 					{ refText: "3:15", chapterStart: 3, verseStart: 15 },
	// 					{ refText: "3:15b", chapterStart: 3, verseStart: 15, verseSuffix: "b" },
	// 					{ refText: "3:15a-b", chapterStart: 3, verseStart: 15 },
	// 				],
	// 			},
	// 		],
	// 	},
	// },
	// {
	// 	name: "ff notation attached to explicit book",
	// 	pageText: "Some commentators expand the discussion from Gen 1:1ff.",
	// 	aliases: [GEN],
	// 	expected: {
	// 		aliasAttached: [
	// 			{
	// 				groupId: GRP_OT,
	// 				matcherId: "gen",
	// 				entryId: "genesis",
	// 				indexType: "bible",
	// 				segments: [{ refText: "1:1ff", chapterStart: 1, verseStart: 1 }],
	// 			},
	// 		],
	// 	},
	// },
	// {
	// 	name: "ff notation with space attached to explicit book",
	// 	pageText: "Others write the same thing as Gen 1:1 ff in running prose.",
	// 	aliases: [GEN],
	// 	expected: {
	// 		aliasAttached: [
	// 			{
	// 				groupId: GRP_OT,
	// 				matcherId: "gen",
	// 				entryId: "genesis",
	// 				indexType: "bible",
	// 				segments: [{ refText: "1:1 ff", chapterStart: 1, verseStart: 1 }],
	// 			},
	// 		],
	// 	},
	// },
	// {
	// 	name: "f notation attached to explicit book",
	// 	pageText: "A shorter pointer appears as Gen 1:1f in some notes.",
	// 	aliases: [GEN],
	// 	expected: {
	// 		aliasAttached: [
	// 			{
	// 				groupId: GRP_OT,
	// 				matcherId: "gen",
	// 				entryId: "genesis",
	// 				indexType: "bible",
	// 				segments: [{ refText: "1:1f", chapterStart: 1, verseStart: 1 }],
	// 			},
	// 		],
	// 	},
	// },
	// {
	// 	name: "compact academic style without space",
	// 	pageText: "A compressed citation such as John1:1 also occurs.",
	// 	aliases: [JOHN],
	// 	expected: {
	// 		aliasAttached: [
	// 			{
	// 				groupId: GRP_NT,
	// 				matcherId: "john",
	// 				entryId: "john",
	// 				indexType: "bible",
	// 				segments: [{ refText: "1:1", chapterStart: 1, verseStart: 1 }],
	// 			},
	// 		],
	// 	},
	// },
	// {
	// 	name: "two explicit books in one line",
	// 	pageText: "Compare Gen 1:1; Exod 3:2 for the contrast.",
	// 	aliases: [GEN, EXOD],
	// 	expected: {
	// 		aliasAttached: [
	// 			{
	// 				groupId: GRP_OT,
	// 				matcherId: "exod",
	// 				entryId: "exodus",
	// 				indexType: "bible",
	// 				segments: [{ refText: "3:2", chapterStart: 3, verseStart: 2 }],
	// 			},
	// 			{
	// 				groupId: GRP_OT,
	// 				matcherId: "gen",
	// 				entryId: "genesis",
	// 				indexType: "bible",
	// 				segments: [{ refText: "1:1", chapterStart: 1, verseStart: 1 }],
	// 			},
	// 		],
	// 	},
	// },
	// {
	// 	name: "multiple explicit books in one cluster",
	// 	pageText: "A mixed chain might read Gen 1:1; Exod 3:2; John 1:1.",
	// 	aliases: [GEN, EXOD, JOHN],
	// 	expected: {
	// 		aliasAttached: [
	// 			{
	// 				groupId: GRP_OT,
	// 				matcherId: "exod",
	// 				entryId: "exodus",
	// 				indexType: "bible",
	// 				segments: [{ refText: "3:2", chapterStart: 3, verseStart: 2 }],
	// 			},
	// 			{
	// 				groupId: GRP_OT,
	// 				matcherId: "gen",
	// 				entryId: "genesis",
	// 				indexType: "bible",
	// 				segments: [{ refText: "1:1", chapterStart: 1, verseStart: 1 }],
	// 			},
	// 			{
	// 				groupId: GRP_NT,
	// 				matcherId: "john",
	// 				entryId: "john",
	// 				indexType: "bible",
	// 				segments: [{ refText: "1:1", chapterStart: 1, verseStart: 1 }],
	// 			},
	// 		],
	// 	},
	// },
	// {
	// 	name: "explicit book with dense list and cross chapter",
	// 	pageText: "Exod 3:2-6, 8-10 is then extended by Exod 3:2-4:3.",
	// 	aliases: [EXOD],
	// 	expected: {
	// 		aliasAttached: [
	// 			{
	// 				groupId: GRP_OT,
	// 				matcherId: "exod",
	// 				entryId: "exodus",
	// 				indexType: "bible",
	// 				segments: [
	// 					{ refText: "3:2-6, 8-10", chapterStart: 3, verseStart: 2 },
	// 					{
	// 						refText: "3:2-4:3",
	// 						chapterStart: 3,
	// 						verseStart: 2,
	// 						chapterEnd: 4,
	// 						verseEnd: 3,
	// 					},
	// 				],
	// 			},
	// 		],
	// 	},
	// },
	// {
	// 	name: "psalm chapter only",
	// 	pageText: "The best-known example may simply be Ps 23.",
	// 	aliases: [PS],
	// 	expected: {
	// 		aliasAttached: [
	// 			{
	// 				groupId: GRP_OT,
	// 				matcherId: "ps",
	// 				entryId: "psalms",
	// 				indexType: "bible",
	// 				segments: [{ refText: "23", chapterStart: 23 }],
	// 			},
	// 		],
	// 	},
	// },
	// {
	// 	name: "psalm verse list",
	// 	pageText: "The preacher lingers over Ps 23:1, 4, 6.",
	// 	aliases: [PS],
	// 	expected: {
	// 		aliasAttached: [
	// 			{
	// 				groupId: GRP_OT,
	// 				matcherId: "ps",
	// 				entryId: "psalms",
	// 				indexType: "bible",
	// 				segments: [{ refText: "23:1, 4, 6", chapterStart: 23, verseStart: 1 }],
	// 			},
	// 		],
	// 	},
	// },
	// {
	// 	name: "psalm title reference",
	// 	pageText: "The heading itself is cited as Ps 3 title in some studies.",
	// 	aliases: [PS],
	// 	expected: {
	// 		aliasAttached: [
	// 			{
	// 				groupId: GRP_OT,
	// 				matcherId: "ps",
	// 				entryId: "psalms",
	// 				indexType: "bible",
	// 				segments: [{ refText: "3", chapterStart: 3 }],
	// 			},
	// 		],
	// 	},
	// },
	// {
	// 	name: "psalm superscription reference",
	// 	pageText: "Others instead refer to Ps 3 superscription.",
	// 	aliases: [PS],
	// 	expected: {
	// 		aliasAttached: [
	// 			{
	// 				groupId: GRP_OT,
	// 				matcherId: "ps",
	// 				entryId: "psalms",
	// 				indexType: "bible",
	// 				segments: [{ refText: "3", chapterStart: 3 }],
	// 			},
	// 		],
	// 	},
	// },
	// {
	// 	name: "numbered book with arabic numeral",
	// 	pageText: "The call narrative begins in 1 Sam 3:1.",
	// 	aliases: [FIRST_SAM],
	// 	expected: {
	// 		aliasAttached: [
	// 			{
	// 				groupId: GRP_OT,
	// 				matcherId: "1_sam",
	// 				entryId: "1_samuel",
	// 				indexType: "bible",
	// 				segments: [{ refText: "3:1", chapterStart: 3, verseStart: 1 }],
	// 			},
	// 		],
	// 	},
	// },
	// {
	// 	name: "numbered epistle with arabic numeral",
	// 	pageText: "The prologue of 1 John 1:1 is often compared to the Gospel.",
	// 	aliases: [FIRST_JOHN],
	// 	expected: {
	// 		aliasAttached: [
	// 			{
	// 				groupId: GRP_NT,
	// 				matcherId: "1_john",
	// 				entryId: "1_john",
	// 				indexType: "bible",
	// 				segments: [{ refText: "1:1", chapterStart: 1, verseStart: 1 }],
	// 			},
	// 		],
	// 	},
	// },
	// {
	// 	name: "alternate book naming via alias",
	// 	pageText: "A wisdom-style love poem opens at Song 1:1.",
	// 	aliases: [SONG],
	// 	expected: {
	// 		aliasAttached: [
	// 			{
	// 				groupId: GRP_OT,
	// 				matcherId: "song",
	// 				entryId: "song_of_songs",
	// 				indexType: "bible",
	// 				segments: [{ refText: "1:1", chapterStart: 1, verseStart: 1 }],
	// 			},
	// 		],
	// 	},
	// },
	// {
	// 	name: "single verse suffix a",
	// 	pageText: "The first half is often isolated as Mark 14:41a.",
	// 	aliases: [MARK],
	// 	expected: {
	// 		aliasAttached: [
	// 			{
	// 				groupId: GRP_NT,
	// 				matcherId: "mark",
	// 				entryId: "mark",
	// 				indexType: "bible",
	// 				segments: [{ refText: "14:41a", chapterStart: 14, verseStart: 41, verseSuffix: "a" }],
	// 			},
	// 		],
	// 	},
	// },
	// {
	// 	name: "single verse suffix b",
	// 	pageText: "The second half is then given as Mark 14:41b.",
	// 	aliases: [MARK],
	// 	expected: {
	// 		aliasAttached: [
	// 			{
	// 				groupId: GRP_NT,
	// 				matcherId: "mark",
	// 				entryId: "mark",
	// 				indexType: "bible",
	// 				segments: [{ refText: "14:41b", chapterStart: 14, verseStart: 41, verseSuffix: "b" }],
	// 			},
	// 		],
	// 	},
	// },
	// {
	// 	name: "verse suffix range attached to explicit book",
	// 	pageText: "A finer division cites Mark 14:41a-b.",
	// 	aliases: [MARK],
	// 	expected: {
	// 		aliasAttached: [
	// 			{
	// 				groupId: GRP_NT,
	// 				matcherId: "mark",
	// 				entryId: "mark",
	// 				indexType: "bible",
	// 				segments: [{ refText: "14:41a-b", chapterStart: 14, verseStart: 41 }],
	// 			},
	// 		],
	// 	},
	// },
	// {
	// 	name: "carryover broken by ambiguous prose resets to unknown",
	// 	pageText: "The note lists Mark 14:41a, 14:41b, 14:41a-b, and sometimes 14:41b-42.",
	// 	aliases: [MARK],
	// 	expected: {
	// 		aliasAttached: [
	// 			{
	// 				groupId: GRP_NT,
	// 				matcherId: "mark",
	// 				entryId: "mark",
	// 				indexType: "bible",
	// 				segments: [
	// 					{ refText: "14:41a", chapterStart: 14, verseStart: 41, verseSuffix: "a" },
	// 					{ refText: "14:41b", chapterStart: 14, verseStart: 41, verseSuffix: "b" },
	// 					{ refText: "14:41a-b", chapterStart: 14, verseStart: 41 },
	// 				],
	// 			},
	// 		],
	// 		unknownSpans: [
	// 			{
	// 				segments: [{ refText: "14:41b-42", chapterStart: 14, verseStart: 41, verseEnd: 42 }],
	// 			},
	// 		],
	// 	},
	// },
	// {
	// 	name: "bookless single verse is unknown",
	// 	pageText: "The note simply says see 1:1 for the opening statement.",
	// 	aliases: [],
	// 	expected: {
	// 		aliasAttached: [],
	// 		unknownSpans: [{ segments: [{ refText: "1:1", chapterStart: 1, verseStart: 1 }] }],
	// 	},
	// },
	// {
	// 	name: "bookless semicolon list is unknown",
	// 	pageText: "The margin note says 1:1; 2:4; and 3:1-6.",
	// 	aliases: [],
	// 	expected: {
	// 		aliasAttached: [],
	// 		unknownSpans: [
	// 			{ segments: [{ refText: "1:1", chapterStart: 1, verseStart: 1 }] },
	// 			{ segments: [{ refText: "2:4", chapterStart: 2, verseStart: 4 }] },
	// 			{ segments: [{ refText: "3:1-6", chapterStart: 3, verseStart: 1, verseEnd: 6 }] },
	// 		],
	// 	},
	// },
	// {
	// 	name: "bookless cross chapter is unknown",
	// 	pageText: "The note compresses the movement into 1:20-2:4.",
	// 	aliases: [],
	// 	expected: {
	// 		aliasAttached: [],
	// 		unknownSpans: [
	// 			{
	// 				segments: [
	// 					{
	// 						refText: "1:20-2:4",
	// 						chapterStart: 1,
	// 						verseStart: 20,
	// 						chapterEnd: 2,
	// 						verseEnd: 4,
	// 					},
	// 				],
	// 			},
	// 		],
	// 	},
	// },
	// {
	// 	name: "bookless verse suffix is unknown",
	// 	pageText: "A textual note may isolate 3:15b in this context.",
	// 	aliases: [],
	// 	expected: {
	// 		aliasAttached: [],
	// 		unknownSpans: [
	// 			{
	// 				segments: [
	// 					{ refText: "3:15b", chapterStart: 3, verseStart: 15, verseSuffix: "b" },
	// 				],
	// 			},
	// 		],
	// 	},
	// },
	// {
	// 	name: "bookless verse suffix range is unknown",
	// 	pageText: "Another note narrows the phrase to 3:15a-b.",
	// 	aliases: [],
	// 	expected: {
	// 		aliasAttached: [],
	// 		unknownSpans: [
	// 			{ segments: [{ refText: "3:15a-b", chapterStart: 3, verseStart: 15 }] },
	// 		],
	// 	},
	// },
	// {
	// 	name: "bookless ff notation is unknown",
	// 	pageText: "The footnote offers only 6:1ff here.",
	// 	aliases: [],
	// 	expected: {
	// 		aliasAttached: [],
	// 		unknownSpans: [{ segments: [{ refText: "6:1ff", chapterStart: 6, verseStart: 1 }] }],
	// 	},
	// },
	// {
	// 	name: "chapter trigger singular full word",
	// 	pageText: "As discussed in chapter 3, the emphasis changes sharply.",
	// 	aliases: [],
	// 	expected: {
	// 		aliasAttached: [],
	// 		unknownSpans: [{ segments: [{ refText: "chapter 3", chapterStart: 3 }] }],
	// 	},
	// },
	// {
	// 	name: "chapter trigger plural full word with range",
	// 	pageText: "The theme runs across chapters 3-5 before narrowing again.",
	// 	aliases: [],
	// 	expected: {
	// 		aliasAttached: [],
	// 		unknownSpans: [
	// 			{ segments: [{ refText: "chapters 3-5", chapterStart: 3, chapterEnd: 5 }] },
	// 		],
	// 	},
	// },
	// {
	// 	name: "chapter trigger abbreviation ch",
	// 	pageText: "The commentator returns to ch 3 at the end of the section.",
	// 	aliases: [],
	// 	expected: {
	// 		aliasAttached: [],
	// 		unknownSpans: [{ segments: [{ refText: "ch 3", chapterStart: 3 }] }],
	// 	},
	// },
	// {
	// 	name: "chapter trigger abbreviation ch with period",
	// 	pageText: "The contrast with ch. 3 is important here.",
	// 	aliases: [],
	// 	expected: {
	// 		aliasAttached: [],
	// 		unknownSpans: [{ segments: [{ refText: "ch. 3", chapterStart: 3 }] }],
	// 	},
	// },
	// {
	// 	name: "chapter trigger abbreviation chap",
	// 	pageText: "This point is made already in chap 3.",
	// 	aliases: [],
	// 	expected: {
	// 		aliasAttached: [],
	// 		unknownSpans: [{ segments: [{ refText: "chap 3", chapterStart: 3 }] }],
	// 	},
	// },
	// {
	// 	name: "chapter trigger abbreviation chap with period",
	// 	pageText: "The editor explicitly cites chap. 3 in the note.",
	// 	aliases: [],
	// 	expected: {
	// 		aliasAttached: [],
	// 		unknownSpans: [{ segments: [{ refText: "chap. 3", chapterStart: 3 }] }],
	// 	},
	// },
	// {
	// 	name: "chapter trigger plural abbreviation chs",
	// 	pageText: "The broader arc appears in chs 3-5.",
	// 	aliases: [],
	// 	expected: {
	// 		aliasAttached: [],
	// 		unknownSpans: [
	// 			{ segments: [{ refText: "chs 3-5", chapterStart: 3, chapterEnd: 5 }] },
	// 		],
	// 	},
	// },
	// {
	// 	name: "chapter trigger plural abbreviation chs with period and list",
	// 	pageText: "The structure is treated in chs. 3-5, 7.",
	// 	aliases: [],
	// 	expected: {
	// 		aliasAttached: [],
	// 		unknownSpans: [
	// 			{ segments: [{ refText: "chs. 3-5, 7", chapterStart: 3, chapterEnd: 5 }] },
	// 		],
	// 	},
	// },
	// {
	// 	name: "verse trigger singular full word",
	// 	pageText: "In verse 2 the emphasis first appears.",
	// 	aliases: [],
	// 	expected: {
	// 		aliasAttached: [],
	// 		unknownSpans: [{ segments: [{ refText: "verse 2", verseStart: 2 }] }],
	// 	},
	// },
	// {
	// 	name: "verse trigger plural full word with range",
	// 	pageText: "The argument expands in verses 2-4.",
	// 	aliases: [],
	// 	expected: {
	// 		aliasAttached: [],
	// 		unknownSpans: [
	// 			{ segments: [{ refText: "verses 2-4", verseStart: 2, verseEnd: 4 }] },
	// 		],
	// 	},
	// },
	// {
	// 	name: "verse trigger abbreviation v",
	// 	pageText: "The turn comes in v 2.",
	// 	aliases: [],
	// 	expected: {
	// 		aliasAttached: [],
	// 		unknownSpans: [{ segments: [{ refText: "v 2", verseStart: 2 }] }],
	// 	},
	// },
	// {
	// 	name: "verse trigger abbreviation v with period",
	// 	pageText: "The turn comes in v. 2.",
	// 	aliases: [],
	// 	expected: {
	// 		aliasAttached: [],
	// 		unknownSpans: [{ segments: [{ refText: "v. 2", verseStart: 2 }] }],
	// 	},
	// },
	// {
	// 	name: "verse trigger abbreviation vv",
	// 	pageText: "The explanation is developed in vv 2-4.",
	// 	aliases: [],
	// 	expected: {
	// 		aliasAttached: [],
	// 		unknownSpans: [
	// 			{ segments: [{ refText: "vv 2-4", verseStart: 2, verseEnd: 4 }] },
	// 		],
	// 	},
	// },
	// {
	// 	name: "verse trigger abbreviation vv with period",
	// 	pageText: "The explanation is developed in vv. 2-4.",
	// 	aliases: [],
	// 	expected: {
	// 		aliasAttached: [],
	// 		unknownSpans: [
	// 			{ segments: [{ refText: "vv. 2-4", verseStart: 2, verseEnd: 4 }] },
	// 		],
	// 	},
	// },
	// {
	// 	name: "verse trigger abbreviation vs",
	// 	pageText: "A looser style cites vs 2-4.",
	// 	aliases: [],
	// 	expected: {
	// 		aliasAttached: [],
	// 		unknownSpans: [
	// 			{ segments: [{ refText: "vs 2-4", verseStart: 2, verseEnd: 4 }] },
	// 		],
	// 	},
	// },
	// {
	// 	name: "verse trigger abbreviation vs with period",
	// 	pageText: "Some notes prefer vs. 2-4.",
	// 	aliases: [],
	// 	expected: {
	// 		aliasAttached: [],
	// 		unknownSpans: [
	// 			{ segments: [{ refText: "vs. 2-4", verseStart: 2, verseEnd: 4 }] },
	// 		],
	// 	},
	// },
	// {
	// 	name: "combined chapter verse trigger full words",
	// 	pageText: "The transition comes in chapter 3 verse 2.",
	// 	aliases: [],
	// 	expected: {
	// 		aliasAttached: [],
	// 		unknownSpans: [
	// 			{
	// 				segments: [
	// 					{
	// 						refText: "chapter 3 verse 2",
	// 						chapterStart: 3,
	// 						verseStart: 2,
	// 					},
	// 				],
	// 			},
	// 		],
	// 	},
	// },
	// {
	// 	name: "combined chapter verses trigger full words with range",
	// 	pageText: "The transition comes in chapter 3 verses 2-4.",
	// 	aliases: [],
	// 	expected: {
	// 		aliasAttached: [],
	// 		unknownSpans: [
	// 			{
	// 				segments: [
	// 					{
	// 						refText: "chapter 3 verses 2-4",
	// 						chapterStart: 3,
	// 						verseStart: 2,
	// 						verseEnd: 4,
	// 					},
	// 				],
	// 			},
	// 		],
	// 	},
	// },
	// {
	// 	name: "combined chapter verse trigger abbreviated",
	// 	pageText: "The same point is marked at ch 3 v 2.",
	// 	aliases: [],
	// 	expected: {
	// 		aliasAttached: [],
	// 		unknownSpans: [
	// 			{
	// 				segments: [{ refText: "ch 3 v 2", chapterStart: 3, verseStart: 2 }],
	// 			},
	// 		],
	// 	},
	// },
	// {
	// 	name: "combined chapter verse trigger abbreviated with periods",
	// 	pageText: "A more punctuated note uses ch. 3 v. 2.",
	// 	aliases: [],
	// 	expected: {
	// 		aliasAttached: [],
	// 		unknownSpans: [
	// 			{
	// 				segments: [{ refText: "ch. 3 v. 2", chapterStart: 3, verseStart: 2 }],
	// 			},
	// 		],
	// 	},
	// },
	// {
	// 	name: "combined chapter verses trigger abbreviated plural",
	// 	pageText: "The section is defined by ch 3 vv 2-4.",
	// 	aliases: [],
	// 	expected: {
	// 		aliasAttached: [],
	// 		unknownSpans: [
	// 			{
	// 				segments: [
	// 					{
	// 						refText: "ch 3 vv 2-4",
	// 						chapterStart: 3,
	// 						verseStart: 2,
	// 						verseEnd: 4,
	// 					},
	// 				],
	// 			},
	// 		],
	// 	},
	// },
	// {
	// 	name: "combined chapter verses trigger abbreviated plural with periods",
	// 	pageText: "The section is defined by ch. 3 vv. 2-4.",
	// 	aliases: [],
	// 	expected: {
	// 		aliasAttached: [],
	// 		unknownSpans: [
	// 			{
	// 				segments: [
	// 					{
	// 						refText: "ch. 3 vv. 2-4",
	// 						chapterStart: 3,
	// 						verseStart: 2,
	// 						verseEnd: 4,
	// 					},
	// 				],
	// 			},
	// 		],
	// 	},
	// },
	// {
	// 	name: "combined chapter verse trigger with colon shorthand",
	// 	pageText: "A compact note may simply write ch 3:2-4.",
	// 	aliases: [],
	// 	expected: {
	// 		aliasAttached: [],
	// 		unknownSpans: [
	// 			{
	// 				segments: [
	// 					{
	// 						refText: "ch 3:2-4",
	// 						chapterStart: 3,
	// 						verseStart: 2,
	// 						verseEnd: 4,
	// 					},
	// 				],
	// 			},
	// 		],
	// 	},
	// },
	// {
	// 	name: "dense explicit cluster stays attached to same book",
	// 	pageText: "The note reads Gen 1:1-3, 5, 7-9; 2:4-7; 3:1, 4, 8-10.",
	// 	aliases: [GEN],
	// 	expected: {
	// 		aliasAttached: [
	// 			{
	// 				groupId: GRP_OT,
	// 				matcherId: "gen",
	// 				entryId: "genesis",
	// 				indexType: "bible",
	// 				segments: [
	// 					{ refText: "1:1-3, 5, 7-9", chapterStart: 1, verseStart: 1 },
	// 					{ refText: "2:4-7", chapterStart: 2, verseStart: 4, verseEnd: 7 },
	// 					{ refText: "3:1, 4, 8-10", chapterStart: 3, verseStart: 1 },
	// 				],
	// 			},
	// 		],
	// 	},
	// },
	// {
	// 	name: "explicit cluster with optional leading and still attached",
	// 	pageText: "A note may cite Gen 1:5; 4:4; and 6:1 in one breath.",
	// 	aliases: [GEN],
	// 	expected: {
	// 		aliasAttached: [
	// 			{
	// 				groupId: GRP_OT,
	// 				matcherId: "gen",
	// 				entryId: "genesis",
	// 				indexType: "bible",
	// 				segments: [
	// 					{ refText: "1:5", chapterStart: 1, verseStart: 5 },
	// 					{ refText: "4:4", chapterStart: 4, verseStart: 4 },
	// 					{ refText: "6:1", chapterStart: 6, verseStart: 1 },
	// 				],
	// 			},
	// 		],
	// 	},
	// },
	// {
	// 	name: "bookless cluster with optional leading and is unknown",
	// 	pageText: "The note may instead say 1:5; 4:4; and 6:1.",
	// 	aliases: [],
	// 	expected: {
	// 		aliasAttached: [],
	// 		unknownSpans: [
	// 			{ segments: [{ refText: "1:5", chapterStart: 1, verseStart: 5 }] },
	// 			{ segments: [{ refText: "4:4", chapterStart: 4, verseStart: 4 }] },
	// 			{ segments: [{ refText: "6:1", chapterStart: 6, verseStart: 1 }] },
	// 		],
	// 	},
	// },
	// {
	// 	name: "leading see and compare do not break unknown detection",
	// 	pageText: "See 2:1-4, compare 4:1-8, and cf. 5:1.",
	// 	aliases: [],
	// 	expected: {
	// 		aliasAttached: [],
	// 		unknownSpans: [
	// 			{ segments: [{ refText: "2:1-4", chapterStart: 2, verseStart: 1, verseEnd: 4 }] },
	// 			{ segments: [{ refText: "4:1-8", chapterStart: 4, verseStart: 1, verseEnd: 8 }] },
	// 			{ segments: [{ refText: "5:1", chapterStart: 5, verseStart: 1 }] },
	// 		],
	// 	},
	// },
	// {
	// 	name: "romans dense list cluster",
	// 	pageText: "A critical note may read Rom 5:1-5, 8, 10-11; 6:1-4; 8:1, 14-17, 28-30.",
	// 	aliases: [ROM],
	// 	expected: {
	// 		aliasAttached: [
	// 			{
	// 				groupId: GRP_NT,
	// 				matcherId: "rom",
	// 				entryId: "romans",
	// 				indexType: "bible",
	// 				segments: [
	// 					{ refText: "5:1-5, 8, 10-11", chapterStart: 5, verseStart: 1 },
	// 					{ refText: "6:1-4", chapterStart: 6, verseStart: 1, verseEnd: 4 },
	// 					{ refText: "8:1, 14-17, 28-30", chapterStart: 8, verseStart: 1 },
	// 				],
	// 			},
	// 		],
	// 	},
	// },
	// {
	// 	name: "matthew explicit chapter only list and another explicit book nearby",
	// 	pageText: "A writer may compress this as Matt 5; 7; Luke 6.",
	// 	aliases: [MATT, LUKE],
	// 	expected: {
	// 		aliasAttached: [
	// 			{
	// 				groupId: GRP_NT,
	// 				matcherId: "luke",
	// 				entryId: "luke",
	// 				indexType: "bible",
	// 				segments: [{ refText: "6", chapterStart: 6 }],
	// 			},
	// 			{
	// 				groupId: GRP_NT,
	// 				matcherId: "matt",
	// 				entryId: "matthew",
	// 				indexType: "bible",
	// 				segments: [
	// 					{ refText: "5", chapterStart: 5 },
	// 					{ refText: "7", chapterStart: 7 },
	// 				],
	// 			},
	// 		],
	// 	},
	// },
	// {
	// 	name: "matthew carryover without repeating book after semicolon",
	// 	pageText: "At times the citation is Matt 5:3-12; 6:9-13; 7:1-5.",
	// 	aliases: [MATT],
	// 	expected: {
	// 		aliasAttached: [
	// 			{
	// 				groupId: GRP_NT,
	// 				matcherId: "matt",
	// 				entryId: "matthew",
	// 				indexType: "bible",
	// 				segments: [
	// 					{ refText: "5:3-12", chapterStart: 5, verseStart: 3, verseEnd: 12 },
	// 					{ refText: "6:9-13", chapterStart: 6, verseStart: 9, verseEnd: 13 },
	// 					{ refText: "7:1-5", chapterStart: 7, verseStart: 1, verseEnd: 5 },
	// 				],
	// 			},
	// 		],
	// 	},
	// },
	// {
	// 	name: "isaiah cross chapter range",
	// 	pageText: "The servant passage is often cited as Isa 52:13-53:12.",
	// 	aliases: [ISA],
	// 	expected: {
	// 		aliasAttached: [
	// 			{
	// 				groupId: GRP_OT,
	// 				matcherId: "isa",
	// 				entryId: "isaiah",
	// 				indexType: "bible",
	// 				segments: [
	// 					{
	// 						refText: "52:13-53:12",
	// 						chapterStart: 52,
	// 						verseStart: 13,
	// 						chapterEnd: 53,
	// 						verseEnd: 12,
	// 					},
	// 				],
	// 			},
	// 		],
	// 	},
	// },
	// {
	// 	name: "book carryover broken by unrelated prose resets later suffix reference to unknown",
	// 	pageText: "The commentary begins with Isa 52:13-53:12, then offers a long aside, and only later mentions 53:4b.",
	// 	aliases: [ISA],
	// 	expected: {
	// 		aliasAttached: [
	// 			{
	// 				groupId: GRP_OT,
	// 				matcherId: "isa",
	// 				entryId: "isaiah",
	// 				indexType: "bible",
	// 				segments: [
	// 					{
	// 						refText: "52:13-53:12",
	// 						chapterStart: 52,
	// 						verseStart: 13,
	// 						chapterEnd: 53,
	// 						verseEnd: 12,
	// 					},
	// 				],
	// 			},
	// 		],
	// 		unknownSpans: [
	// 			{
	// 				segments: [
	// 					{
	// 						refText: "53:4b",
	// 						chapterStart: 53,
	// 						verseStart: 4,
	// 						verseSuffix: "b",
	// 					},
	// 				],
	// 			},
	// 		],
	// 	},
	// },
	// {
	// 	name: "chapter trigger in explicit book prose should still remain unknown if no direct alias attachment",
	// 	pageText: "The argument in Romans chapter 8 differs from that in chapter 7.",
	// 	aliases: [ROMANS],
	// 	expected: {
	// 		aliasAttached: [
	// 			{
	// 				groupId: GRP_NT,
	// 				matcherId: "romans",
	// 				entryId: "romans",
	// 				indexType: "bible",
	// 				segments: [],
	// 			},
	// 		],
	// 		unknownSpans: [
	// 			{ segments: [{ refText: "chapter 8", chapterStart: 8 }] },
	// 			{ segments: [{ refText: "chapter 7", chapterStart: 7 }] },
	// 		],
	// 	},
	// },
	// {
	// 	name: "verse trigger prose cluster is unknown",
	// 	pageText: "In verse 3 the emphasis shifts, verses 4-6 elaborate, vv. 7-9 conclude, and v. 10 transitions.",
	// 	aliases: [],
	// 	expected: {
	// 		aliasAttached: [],
	// 		unknownSpans: [
	// 			{ segments: [{ refText: "verse 3", verseStart: 3 }] },
	// 			{ segments: [{ refText: "verses 4-6", verseStart: 4, verseEnd: 6 }] },
	// 			{ segments: [{ refText: "vv. 7-9", verseStart: 7, verseEnd: 9 }] },
	// 			{ segments: [{ refText: "v. 10", verseStart: 10 }] },
	// 		],
	// 	},
	// },
	// {
	// 	name: "mixed explicit citation chain across several books",
	// 	pageText: "A mixed chain reads Gen 1:1-3, 5, 7-9; cf. Exod 3:2-6; Ps 8:4-6; John 1:1-5; Rom 8:28-30; and Rev 21:1-4.",
	// 	aliases: [GEN, EXOD, PS, JOHN, ROM, REV],
	// 	expected: {
	// 		aliasAttached: [
	// 			{
	// 				groupId: GRP_OT,
	// 				matcherId: "exod",
	// 				entryId: "exodus",
	// 				indexType: "bible",
	// 				segments: [{ refText: "3:2-6", chapterStart: 3, verseStart: 2, verseEnd: 6 }],
	// 			},
	// 			{
	// 				groupId: GRP_OT,
	// 				matcherId: "gen",
	// 				entryId: "genesis",
	// 				indexType: "bible",
	// 				segments: [{ refText: "1:1-3, 5, 7-9", chapterStart: 1, verseStart: 1 }],
	// 			},
	// 			{
	// 				groupId: GRP_NT,
	// 				matcherId: "john",
	// 				entryId: "john",
	// 				indexType: "bible",
	// 				segments: [{ refText: "1:1-5", chapterStart: 1, verseStart: 1, verseEnd: 5 }],
	// 			},
	// 			{
	// 				groupId: GRP_OT,
	// 				matcherId: "ps",
	// 				entryId: "psalms",
	// 				indexType: "bible",
	// 				segments: [{ refText: "8:4-6", chapterStart: 8, verseStart: 4, verseEnd: 6 }],
	// 			},
	// 			{
	// 				groupId: GRP_NT,
	// 				matcherId: "rev",
	// 				entryId: "revelation",
	// 				indexType: "bible",
	// 				segments: [{ refText: "21:1-4", chapterStart: 21, verseStart: 1, verseEnd: 4 }],
	// 			},
	// 			{
	// 				groupId: GRP_NT,
	// 				matcherId: "rom",
	// 				entryId: "romans",
	// 				indexType: "bible",
	// 				segments: [{ refText: "8:28-30", chapterStart: 8, verseStart: 28, verseEnd: 30 }],
	// 			},
	// 		],
	// 	},
	// },
	// {
	// 	name: "mixed unknown cluster with implied context only",
	// 	pageText: "Another note gives only 1:1-3, 5; 2:4; 3:1-6; 3:15a-b; 6:1ff.",
	// 	aliases: [],
	// 	expected: {
	// 		aliasAttached: [],
	// 		unknownSpans: [
	// 			{ segments: [{ refText: "1:1-3, 5", chapterStart: 1, verseStart: 1 }] },
	// 			{ segments: [{ refText: "2:4", chapterStart: 2, verseStart: 4 }] },
	// 			{ segments: [{ refText: "3:1-6", chapterStart: 3, verseStart: 1, verseEnd: 6 }] },
	// 			{ segments: [{ refText: "3:15a-b", chapterStart: 3, verseStart: 15 }] },
	// 			{ segments: [{ refText: "6:1ff", chapterStart: 6, verseStart: 1 }] },
	// 		],
	// 	},
	// },
];
