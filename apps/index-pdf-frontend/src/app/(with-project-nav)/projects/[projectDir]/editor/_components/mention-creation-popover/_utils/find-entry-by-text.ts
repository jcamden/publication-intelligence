import type { IndexEntry } from "@/app/projects/[projectDir]/_types/index-entry";

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
