import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { apocryphaOtherMatchers } from "../bible/apocrypha-other/matchers";
import { getDeuterocanonMatchers } from "../bible/deterocanon/matchers";
import { getHebrewBibleMatchers } from "../bible/hebrew-bible/matchers";
import { newTestamentMatchers } from "../bible/new-testament/matchers";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Join paths reliably across operating systems
const matcherDictionaryPath = join(__dirname, "../matcher-dictionary.ts");

import { writeFile } from "node:fs/promises";
import { CHRISTIAN_WRITINGS_MATCHERS } from "../christian-writings/matchers";
import { CLASSICAL_WRITINGS_MATCHERS } from "../classical-writings/matchers";
import { CAVE_1_MATCHERS } from "../dss/cave1/matchers";
import { CAVE_2_MATCHERS } from "../dss/cave2/matchers";
import { CAVE_3_MATCHERS } from "../dss/cave3/matchers";
import { CAVE_4_MATCHERS } from "../dss/cave4/matchers";
import { CAVE_5_MATCHERS } from "../dss/cave5/matchers";
import { CAVE_6_MATCHERS } from "../dss/cave6/matchers";
import { CAVE_7_MATCHERS } from "../dss/cave7/matchers";
import { CAVE_8_MATCHERS } from "../dss/cave8/matchers";
import { CAVE_9_MATCHERS } from "../dss/cave9/matchers";
import { CAVE_10_MATCHERS } from "../dss/cave10/matchers";
import { CAVE_11_MATCHERS } from "../dss/cave11/matchers";
import { JEWISH_WRITINGS_MATCHERS } from "../jewish-writings/matchers";

export const writeFunctionResultToFile = async <T>(
	filePath: string,
	fn: () => T,
): Promise<void> =>
	writeFile(
		filePath,
		`export const matcherDictionary = ${JSON.stringify(fn(), null, 2)}`,
		"utf-8",
	);

// TODO: parameterize texts
export const generateMatcherDictionary = (
	matcherObjects: Record<string, string[]>[],
): Record<string, string[]> =>
	matcherObjects
		.flatMap((obj) =>
			Object.entries(obj).flatMap(([bookKey, matchers]) =>
				matchers.map((matcher) => [matcher, bookKey] as const),
			),
		)
		.reduce<Record<string, string[]>>(
			(acc, [matcher, bookKey]) => ({
				// biome-ignore lint/performance/noAccumulatingSpread: don't care
				...acc,
				[matcher]: acc[matcher] ? [...acc[matcher], bookKey] : [bookKey],
			}),
			{},
		);

(async () => {
	await writeFunctionResultToFile(matcherDictionaryPath, () =>
		generateMatcherDictionary([
			getHebrewBibleMatchers({}),
			getDeuterocanonMatchers({}),
			newTestamentMatchers,
			apocryphaOtherMatchers,
			CAVE_1_MATCHERS,
			CAVE_2_MATCHERS,
			CAVE_3_MATCHERS,
			CAVE_4_MATCHERS,
			CAVE_5_MATCHERS,
			CAVE_6_MATCHERS,
			CAVE_7_MATCHERS,
			CAVE_8_MATCHERS,
			CAVE_9_MATCHERS,
			CAVE_10_MATCHERS,
			CAVE_11_MATCHERS,
			CHRISTIAN_WRITINGS_MATCHERS,
			CLASSICAL_WRITINGS_MATCHERS,
			JEWISH_WRITINGS_MATCHERS,
		]),
	);
})();
