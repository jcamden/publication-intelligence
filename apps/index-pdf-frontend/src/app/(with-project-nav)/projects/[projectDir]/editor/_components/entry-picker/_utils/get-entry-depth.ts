import type { IndexEntry } from "@/app/projects/[projectDir]/_types/index-entry";

/**
 * Get entry depth in hierarchy
 */
export const getEntryDepth = ({
	entry,
	entries,
}: {
	entry: IndexEntry;
	entries: IndexEntry[];
}): number => {
	let depth = 0;
	let current = entry;

	while (current.parentId) {
		const parent = entries.find((e) => e.id === current.parentId);
		if (!parent) break;
		depth++;
		current = parent;
	}

	return depth;
};
