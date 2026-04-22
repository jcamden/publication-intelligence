import type { IndexEntry } from "../_types/index-entry";

/**
 * Precomputed indices over an entries list. Building these once and sharing them
 * downstream collapses repeated O(N) scans (find by id, children by parentId,
 * mentions filtered per entry) down to O(1) / O(children) lookups.
 */
export type EntryMaps<T extends IndexEntry = IndexEntry> = {
	/** Look up an entry by id. */
	byId: Map<string, T>;
	/** Direct children of parent id, or roots when key is null. */
	childrenByParent: Map<string | null, T[]>;
};

/** Build both lookup maps in a single pass. */
export const buildEntryMaps = <T extends IndexEntry>(
	entries: readonly T[],
): EntryMaps<T> => {
	const byId = new Map<string, T>();
	const childrenByParent = new Map<string | null, T[]>();
	for (const entry of entries) {
		byId.set(entry.id, entry);
		const key = entry.parentId ?? null;
		const list = childrenByParent.get(key);
		if (list) list.push(entry);
		else childrenByParent.set(key, [entry]);
	}
	return { byId, childrenByParent };
};

/**
 * Chicago-style label using an `entriesById` map for O(depth) work per call.
 * Prefer this over `getEntryDisplayLabel` when rendering many rows.
 */
export const getEntryDisplayLabelFromMap = ({
	entry,
	byId,
}: {
	entry: IndexEntry;
	byId: Map<string, IndexEntry>;
}): string => {
	const path: string[] = [];
	let current: IndexEntry | undefined = entry;
	// Guard against cycles (should never happen, but cheap insurance).
	const seen = new Set<string>();
	while (current && !seen.has(current.id)) {
		seen.add(current.id);
		path.unshift(current.label);
		const parentId = current.parentId;
		if (!parentId) break;
		current = byId.get(parentId);
	}
	return path.join(":");
};

/** Colon-space variant used for cross-references. */
export const getEntryPathColonFormFromMap = ({
	entry,
	byId,
}: {
	entry: IndexEntry;
	byId: Map<string, IndexEntry>;
}): string => {
	const path: string[] = [];
	let current: IndexEntry | undefined = entry;
	const seen = new Set<string>();
	while (current && !seen.has(current.id)) {
		seen.add(current.id);
		path.unshift(current.label);
		const parentId = current.parentId;
		if (!parentId) break;
		current = byId.get(parentId);
	}
	return path.join(": ");
};
