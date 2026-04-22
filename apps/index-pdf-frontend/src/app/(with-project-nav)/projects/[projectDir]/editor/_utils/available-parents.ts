import type { IndexEntry } from "../../_types/index-entry";
import { getChildEntries, getEntriesForType } from "../../_utils/entry-filters";

/**
 * Get all descendants of an entry (children, grandchildren, etc.)
 */
export const getDescendants = ({
	entries,
	parentId,
}: {
	entries: IndexEntry[];
	parentId: string;
}): IndexEntry[] => {
	const children = getChildEntries({ entries, parentId });
	const grandchildren = children.flatMap((child) =>
		getDescendants({ entries, parentId: child.id }),
	);
	return [...children, ...grandchildren];
};

/**
 * Get available parents for entry creation/editing
 * Excludes the entry itself and its descendants to prevent circular references
 */
export const getAvailableParents = ({
	entries,
	indexType,
	excludeId,
}: {
	entries: IndexEntry[];
	indexType: string;
	excludeId?: string;
}): IndexEntry[] => {
	let filtered = getEntriesForType({ entries, indexType });

	if (excludeId) {
		filtered = filtered.filter((e) => e.id !== excludeId);

		const descendants = getDescendants({ entries, parentId: excludeId });
		const descendantIds = new Set(descendants.map((d) => d.id));
		filtered = filtered.filter((e) => !descendantIds.has(e.id));
	}

	return filtered;
};
