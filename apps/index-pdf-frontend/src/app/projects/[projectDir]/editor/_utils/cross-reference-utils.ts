import type { CrossReference, IndexEntry } from "../_types/index-entry";
import { getEntryDisplayLabel } from "./index-entry-utils";

type FormatCrossReferencesOptions = {
	crossReferences: CrossReference[];
	allEntries: IndexEntry[];
};

export const formatCrossReferences = ({
	crossReferences,
	allEntries,
}: FormatCrossReferencesOptions): string[] => {
	if (!crossReferences || crossReferences.length === 0) {
		return [];
	}

	const sortedRefs = [...crossReferences].sort((a, b) => {
		const labelA = a.toEntry?.label || a.arbitraryValue || "";
		const labelB = b.toEntry?.label || b.arbitraryValue || "";
		return labelA.localeCompare(labelB);
	});

	return sortedRefs.map((ref) => {
		const prefix =
			ref.relationType === "see"
				? "See"
				: ref.relationType === "see_also"
					? "See also"
					: "q.v.";

		if (ref.toEntry && ref.toEntryId) {
			const fullEntry = allEntries.find((e) => e.id === ref.toEntryId);
			if (fullEntry) {
				return `${prefix} ${getEntryDisplayLabel({ entry: fullEntry, entries: allEntries })}.`;
			}
			return `${prefix} ${ref.toEntry.label}.`;
		}

		return `${prefix} ${ref.arbitraryValue}.`;
	});
};
