import { getCanonBookKeys, isValidCanonId } from "@pubint/core";
import type { IndexEntry } from "../_types/index-entry";

export type ScriptureGroupSortMode =
	| "a_z"
	| "canon_book_order"
	| "custom"
	| "protestant"
	| "roman_catholic"
	| "tanakh"
	| "eastern_orthodox";

type CanonId = "protestant" | "roman_catholic" | "tanakh" | "eastern_orthodox";

/** Maps a group sortMode to a canon ID. Returns null for a_z, custom, and unknown modes. */
export const canonIdFromSortMode = (
	mode: ScriptureGroupSortMode | null | undefined,
): CanonId | null => {
	if (mode === "canon_book_order") return "protestant"; // legacy alias
	if (mode && isValidCanonId(mode)) return mode as CanonId;
	return null;
};

/**
 * Comparator that sorts the "unknown" book entry to the front.
 * Returns 0 if neither (or both) are unknown — caller should apply secondary sort.
 */
export const unknownFirstCompare = (a: IndexEntry, b: IndexEntry): number => {
	const aUnknown = a.slug === "unknown";
	const bUnknown = b.slug === "unknown";
	if (aUnknown && !bUnknown) return -1;
	if (!aUnknown && bUnknown) return 1;
	return 0;
};

/**
 * Sort book-level entries (root entries) within a group in place.
 *
 * - `custom` → groupPosition ascending, localeCompare tiebreaker
 * - canonical modes → getCanonBookKeys order by slug prefix before "--"
 * - `a_z` / fallback → localeCompare by label
 * - unknown book is always first
 */
export const sortBookEntriesForGroup = (
	entries: IndexEntry[],
	sortMode: ScriptureGroupSortMode | null | undefined,
): void => {
	if (entries.length <= 1) return;

	if (sortMode === "custom") {
		entries.sort((a, b) => {
			const cmp = unknownFirstCompare(a, b);
			if (cmp !== 0) return cmp;
			const posA = a.groupPosition ?? 999999;
			const posB = b.groupPosition ?? 999999;
			if (posA !== posB) return posA - posB;
			return (a.label ?? "").localeCompare(b.label ?? "", undefined, {
				sensitivity: "base",
			});
		});
		return;
	}

	const canonId = canonIdFromSortMode(sortMode);
	if (canonId) {
		const canonBookOrder = getCanonBookKeys(canonId);
		const getBookKey = (e: IndexEntry) =>
			(e.slug ?? "").split("--")[0]?.trim() ?? "";
		entries.sort((a, b) => {
			const cmp = unknownFirstCompare(a, b);
			if (cmp !== 0) return cmp;
			const keyA = getBookKey(a);
			const keyB = getBookKey(b);
			const idxA = canonBookOrder.indexOf(keyA);
			const idxB = canonBookOrder.indexOf(keyB);
			if (idxA >= 0 && idxB >= 0) return idxA - idxB;
			if (idxA >= 0) return -1;
			if (idxB >= 0) return 1;
			return (a.label ?? "").localeCompare(b.label ?? "", undefined, {
				sensitivity: "base",
			});
		});
		return;
	}

	// a_z or unknown mode → unknown first, then A-Z
	entries.sort((a, b) => {
		const cmp = unknownFirstCompare(a, b);
		if (cmp !== 0) return cmp;
		return (a.label ?? "").localeCompare(b.label ?? "", undefined, {
			sensitivity: "base",
		});
	});
};

/**
 * Sort ungrouped book-level entries in place: unknown first, then A-Z by label.
 */
export const sortUngroupedBooks = (entries: IndexEntry[]): void => {
	if (entries.length <= 1) return;
	entries.sort((a, b) => {
		const cmp = unknownFirstCompare(a, b);
		if (cmp !== 0) return cmp;
		return (a.label ?? "").localeCompare(b.label ?? "", undefined, {
			sensitivity: "base",
		});
	});
};
