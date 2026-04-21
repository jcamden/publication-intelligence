import { useMemo } from "react";
import type { IndexEntry } from "../../../_types/index-entry";
import { getEntryDepth } from "../../../_utils/index-entry-utils";

export type EntryLabelProps = {
	entry: IndexEntry;
	entries: IndexEntry[]; // For looking up parent
	showHierarchy?: boolean; // Default: true
};

export const EntryLabel = ({
	entry,
	entries,
	showHierarchy = true,
}: EntryLabelProps) => {
	const depth = useMemo(
		() => getEntryDepth({ entry, entries }),
		[entry, entries],
	);

	const parentLabel = useMemo(() => {
		if (!entry.parentId) return null;
		const parent = entries.find((e) => e.id === entry.parentId);
		return parent?.label ?? null;
	}, [entry.parentId, entries]);

	return (
		<div
			className="flex items-center gap-2"
			style={showHierarchy ? { paddingLeft: `${depth * 12}px` } : undefined}
		>
			<span className="font-medium">{entry.label}</span>
			{parentLabel && (
				<span className="text-xs text-gray-500">→ {parentLabel}</span>
			)}
		</div>
	);
};
