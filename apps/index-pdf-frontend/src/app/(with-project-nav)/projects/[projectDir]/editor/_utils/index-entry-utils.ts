import type { IndexEntry } from "../_types/index-entry";

/**
 * Get entries for specific index type
 */
export const getEntriesForType = ({
	entries,
	indexType,
}: {
	entries: IndexEntry[];
	indexType: string;
}): IndexEntry[] => {
	return entries.filter((e) => e.indexType === indexType);
};

/**
 * Get children of a parent entry
 */
export const getChildEntries = ({
	entries,
	parentId,
}: {
	entries: IndexEntry[];
	parentId: string | null;
}): IndexEntry[] => {
	return entries.filter((e) => e.parentId === parentId);
};

/**
 * Find entry by exact label or alias match (case-insensitive)
 */
export const findEntryByText = ({
	entries,
	text,
}: {
	entries: IndexEntry[];
	text: string;
}): IndexEntry | null => {
	const normalized = text.trim().toLowerCase();

	return (
		entries.find((entry) => {
			if (entry.label.toLowerCase() === normalized) return true;
			const matchers = entry.metadata?.matchers || [];
			return matchers.some((alias) => alias.toLowerCase() === normalized);
		}) || null
	);
};

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

/**
 * Colon-form path for cross-references: "parent:child" or "grandparent:parent:child".
 * Top-level entry returns entry.label only.
 */
export const getEntryPathColonForm = ({
	entry,
	entries,
}: {
	entry: IndexEntry;
	entries: IndexEntry[];
}): string => {
	const path: string[] = [];
	let current: IndexEntry | undefined = entry;

	while (current) {
		path.unshift(current.label);
		const parentId: string | null = current.parentId;
		if (!parentId) break;
		current = entries.find((e) => e.id === parentId);
	}

	return path.join(": ");
};

/**
 * Get entry display label in Chicago style: "parent:child" or "grandparent:parent:child".
 * Top-level entry returns entry.label only.
 */
export const getEntryDisplayLabel = ({
	entry,
	entries,
}: {
	entry: IndexEntry;
	entries: IndexEntry[];
}): string => {
	const path: string[] = [];
	let current: IndexEntry | undefined = entry;

	while (current) {
		path.unshift(current.label);
		const parentId: string | null = current.parentId;
		if (!parentId) break;
		current = entries.find((e) => e.id === parentId);
	}

	return path.join(":");
};

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
	const children = entries.filter((e) => e.parentId === parentId);
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
	// Filter to same index type
	let filtered = entries.filter((e) => e.indexType === indexType);

	// Exclude self (when editing)
	if (excludeId) {
		filtered = filtered.filter((e) => e.id !== excludeId);

		// Exclude descendants to prevent circular references
		const descendants = getDescendants({ entries, parentId: excludeId });
		const descendantIds = new Set(descendants.map((d) => d.id));
		filtered = filtered.filter((e) => !descendantIds.has(e.id));
	}

	return filtered;
};
