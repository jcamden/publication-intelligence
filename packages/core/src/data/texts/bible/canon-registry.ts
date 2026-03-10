/**
 * Canon registry: stable ids for canon definitions in canons.ts.
 * Used for scripture index config (selected_canon) and bootstrap.
 */

import {
	easternOrthodoxCanon,
	protestantCanon,
	romanCatholicCanon,
	tanakh,
} from "./canons";

export const CANON_IDS = [
	"protestant",
	"roman_catholic",
	"tanakh",
	"eastern_orthodox",
] as const;

export type CanonId = (typeof CANON_IDS)[number];

const canonBookKeys: Record<CanonId, readonly string[]> = {
	protestant: protestantCanon,
	roman_catholic: romanCatholicCanon,
	tanakh,
	eastern_orthodox: easternOrthodoxCanon,
};

export function getCanonBookKeys(canonId: CanonId): readonly string[] {
	const books = canonBookKeys[canonId];
	if (!books) {
		throw new Error(`Unknown canon id: ${canonId}`);
	}
	return books;
}

export function isValidCanonId(value: string): value is CanonId {
	return CANON_IDS.includes(value as CanonId);
}
