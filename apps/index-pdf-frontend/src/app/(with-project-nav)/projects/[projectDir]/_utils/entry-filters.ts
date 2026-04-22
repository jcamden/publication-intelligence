import type { IndexEntry } from "../_types/index-entry";

/**
 * Entries for a specific index type (subject / author / scripture).
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
 * Direct children of a parent entry (or roots when parentId is null).
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
