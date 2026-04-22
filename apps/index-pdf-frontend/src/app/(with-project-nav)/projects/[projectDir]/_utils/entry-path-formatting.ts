import type { IndexEntry } from "../_types/index-entry";

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
