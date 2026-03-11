/**
 * Scripture bootstrap: canon book lists, labels, and matcher dictionaries
 * for seeding index entries and matchers from config (Task 7.2).
 */

import type { CanonId } from "./bible/canon-registry";
import { getCanonBookKeys } from "./bible/canon-registry";
import { getHebrewBibleMatchers } from "./bible/hebrew-bible/matchers";
import { newTestamentMatchers } from "./bible/new-testament/matchers";
import {
	getEasternOrthodoxLabel,
	getHebrewLabel,
	getProtestantLabel,
	getRomanCatholicLabel,
} from "./bible/text-labels-per-canon";
import { apocryphaOtherMatchers } from "./bible/apocrypha-other/matchers";
import { getDeuterocanonMatchers } from "./bible/deterocanon/matchers";
import { JEWISH_WRITINGS_MATCHERS } from "./jewish-writings/matchers";
import { CLASSICAL_WRITINGS_MATCHERS } from "./classical-writings/matchers";
import { CHRISTIAN_WRITINGS_MATCHERS } from "./christian-writings/matchers";
import { CAVE_1_MATCHERS } from "./dss/cave1/matchers";
import { CAVE_2_MATCHERS } from "./dss/cave2/matchers";
import { CAVE_3_MATCHERS } from "./dss/cave3/matchers";
import { CAVE_4_MATCHERS } from "./dss/cave4/matchers";
import { CAVE_5_MATCHERS } from "./dss/cave5/matchers";
import { CAVE_6_MATCHERS } from "./dss/cave6/matchers";
import { CAVE_7_MATCHERS } from "./dss/cave7/matchers";
import { CAVE_8_MATCHERS } from "./dss/cave8/matchers";
import { CAVE_9_MATCHERS } from "./dss/cave9/matchers";
import { CAVE_10_MATCHERS } from "./dss/cave10/matchers";
import { CAVE_11_MATCHERS } from "./dss/cave11/matchers";

export { getCanonBookKeys };

/** Display label for a book key given the selected canon (for canon and deuterocanon books). */
export function getBookLabel(bookKey: string, canonId: CanonId): string {
	switch (canonId) {
		case "protestant":
			return getProtestantLabel(bookKey);
		case "roman_catholic":
			return getRomanCatholicLabel(bookKey);
		case "eastern_orthodox":
			return getEasternOrthodoxLabel(bookKey);
		case "tanakh":
			return getHebrewLabel(bookKey);
		default:
			return getProtestantLabel(bookKey);
	}
}

/** Canon-specific matchers for HB + NT (and deuterocanon when part of canon). Tanakh = HB only. */
export function getBootstrapCanonMatchers(
	canonId: CanonId,
): Record<string, string[]> {
	const catholic = canonId === "roman_catholic" || canonId === "eastern_orthodox";
	const hb = getHebrewBibleMatchers({
		canon: catholic ? "catholic" : "protestant",
	});
	if (canonId === "tanakh") return hb;
	const nt = newTestamentMatchers;
	const deut = catholic ? getDeuterocanonMatchers({ canon: "catholic" }) : {};
	return { ...hb, ...nt, ...deut };
}

/** Apocrypha corpus: deuterocanonical + other apocrypha (outside selected canon). */
export function getBootstrapApocryphaMatchers(): Record<string, string[]> {
	return {
		...getDeuterocanonMatchers({ canon: "catholic" }),
		...apocryphaOtherMatchers,
	};
}

export function getBootstrapJewishWritingsMatchers(): Record<string, string[]> {
	return JEWISH_WRITINGS_MATCHERS;
}

export function getBootstrapClassicalWritingsMatchers(): Record<
	string,
	string[]
> {
	return CLASSICAL_WRITINGS_MATCHERS;
}

export function getBootstrapChristianWritingsMatchers(): Record<
	string,
	string[]
> {
	return CHRISTIAN_WRITINGS_MATCHERS;
}

/** Dead Sea Scrolls: all caves merged. */
export function getBootstrapDeadSeaScrollsMatchers(): Record<string, string[]> {
	return {
		...CAVE_1_MATCHERS,
		...CAVE_2_MATCHERS,
		...CAVE_3_MATCHERS,
		...CAVE_4_MATCHERS,
		...CAVE_5_MATCHERS,
		...CAVE_6_MATCHERS,
		...CAVE_7_MATCHERS,
		...CAVE_8_MATCHERS,
		...CAVE_9_MATCHERS,
		...CAVE_10_MATCHERS,
		...CAVE_11_MATCHERS,
	};
}

/** Matchers for a single book key (HB, NT, deuterocanon, or apocrypha other). Used for extra_book_keys. */
export function getMatchersForExtraBookKey(bookKey: string): string[] {
	const hb = getHebrewBibleMatchers({});
	const nt = newTestamentMatchers;
	const deut = getDeuterocanonMatchers({ canon: "catholic" });
	const other = apocryphaOtherMatchers;
	const all: Record<string, string[]> = { ...hb, ...nt, ...deut, ...other };
	return all[bookKey] ?? [];
}

/** Deterministic slug for bootstrap entries. Use bookKey for canon/apocrypha; slugify for other corpora. */
export function slugifyBootstrapKey(key: string): string {
	return key
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "_")
		.replace(/^_|_$/g, "") || key;
}
