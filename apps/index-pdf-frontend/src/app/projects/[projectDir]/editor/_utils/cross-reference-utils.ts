import type { CrossReference, IndexEntry } from "../_types/index-entry";
import { getEntryPathColonForm } from "./index-entry-utils";

type FormatCrossReferencesOptions = {
	crossReferences: CrossReference[];
	allEntries: IndexEntry[];
};

const PHRASE_ORDER: Array<"see" | "see_also" | "qv"> = [
	"see",
	"qv",
	"see_also",
];

const DIRECTIVE: Record<"see" | "see_also" | "qv", string> = {
	see: "See",
	see_also: "See also",
	qv: "q.v.",
};

const DIRECTIVE_UNDER: Record<"see" | "see_also" | "qv", string> = {
	see: "See under",
	see_also: "See also under",
	qv: "q.v. under",
};

const getTargetAndHasParent = ({
	ref,
	allEntries,
}: {
	ref: CrossReference;
	allEntries: IndexEntry[];
}): { target: string; hasParent: boolean } | null => {
	if (ref.arbitraryValue?.trim()) {
		return { target: ref.arbitraryValue.trim(), hasParent: false };
	}
	if (!ref.toEntryId) return null;
	const fullEntry = allEntries.find((e) => e.id === ref.toEntryId);
	if (!fullEntry)
		return { target: ref.toEntry?.label ?? "Unknown", hasParent: false };
	const target = getEntryPathColonForm({
		entry: fullEntry,
		entries: allEntries,
	});
	const hasParent = fullEntry.parentId != null;
	return { target, hasParent };
};

export const formatCrossReferences = ({
	crossReferences,
	allEntries,
}: FormatCrossReferencesOptions): string => {
	const refsWithTarget = crossReferences
		.map((ref) => ({
			ref,
			...getTargetAndHasParent({ ref, allEntries }),
		}))
		.filter(
			(r): r is { ref: CrossReference; target: string; hasParent: boolean } =>
				r.target != null,
		);

	if (refsWithTarget.length === 0) return "";

	const byType = {
		see: refsWithTarget.filter((r) => r.ref.relationType === "see"),
		see_also: refsWithTarget.filter((r) => r.ref.relationType === "see_also"),
		qv: refsWithTarget.filter((r) => r.ref.relationType === "qv"),
	};

	const phrases: string[] = [];

	for (const type of PHRASE_ORDER) {
		const group = byType[type];
		const nonUnder = group.filter((r) => !r.hasParent);
		const under = group.filter((r) => r.hasParent);

		const emit = (sub: typeof group, useUnder: boolean) => {
			if (sub.length === 0) return;
			const sorted = [...sub].sort((a, b) =>
				a.target.localeCompare(b.target, undefined, { sensitivity: "base" }),
			);
			const targets = sorted.map((r) => r.target).join("; ");
			const directive = useUnder ? DIRECTIVE_UNDER[type] : DIRECTIVE[type];
			phrases.push(`${directive} ${targets}`);
		};
		emit(nonUnder, false);
		emit(under, true);
	}

	return phrases.join(". ");
};

export type CrossReferenceSegment = { italic: boolean; text: string };

export const formatCrossReferencesAsSegments = ({
	crossReferences,
	allEntries,
}: FormatCrossReferencesOptions): CrossReferenceSegment[] => {
	const refsWithTarget = crossReferences
		.map((ref) => ({
			ref,
			...getTargetAndHasParent({ ref, allEntries }),
		}))
		.filter(
			(r): r is { ref: CrossReference; target: string; hasParent: boolean } =>
				r.target != null,
		);

	if (refsWithTarget.length === 0) return [];

	const byType = {
		see: refsWithTarget.filter((r) => r.ref.relationType === "see"),
		see_also: refsWithTarget.filter((r) => r.ref.relationType === "see_also"),
		qv: refsWithTarget.filter((r) => r.ref.relationType === "qv"),
	};

	const segments: CrossReferenceSegment[] = [];

	for (const type of PHRASE_ORDER) {
		const group = byType[type];
		const nonUnder = group.filter((r) => !r.hasParent);
		const under = group.filter((r) => r.hasParent);

		const emit = (sub: typeof group, useUnder: boolean) => {
			if (sub.length === 0) return;
			const sorted = [...sub].sort((a, b) =>
				a.target.localeCompare(b.target, undefined, { sensitivity: "base" }),
			);
			const targets = sorted.map((r) => r.target).join("; ");
			const directive = useUnder ? DIRECTIVE_UNDER[type] : DIRECTIVE[type];
			if (segments.length > 0) segments.push({ italic: false, text: ". " });
			segments.push({ italic: true, text: directive });
			segments.push({ italic: false, text: ` ${targets}` });
		};
		emit(nonUnder, false);
		emit(under, true);
	}

	return segments;
};

export const getDirectiveForSingleRef = ({
	ref,
	allEntries,
}: {
	ref: {
		relationType: "see" | "see_also" | "qv";
		toEntryId: string | null;
		arbitraryValue?: string | null;
	};
	allEntries: IndexEntry[];
}): string => {
	if (ref.arbitraryValue?.trim() || ref.toEntryId == null) {
		return DIRECTIVE[ref.relationType];
	}
	const fullEntry = allEntries.find((e) => e.id === ref.toEntryId);
	const hasParent = fullEntry?.parentId != null;
	return hasParent
		? DIRECTIVE_UNDER[ref.relationType]
		: DIRECTIVE[ref.relationType];
};

export const formatSingleCrossReferenceLabel = ({
	ref,
	allEntries,
}: {
	ref: {
		relationType: "see" | "see_also" | "qv";
		toEntryId: string | null;
		arbitraryValue?: string | null;
		toEntry?: { label: string } | null;
	};
	allEntries: IndexEntry[];
}): string => {
	if (ref.arbitraryValue?.trim()) {
		const directive = getDirectiveForSingleRef({ ref, allEntries });
		return `${directive} ${ref.arbitraryValue.trim()}`;
	}
	if (ref.toEntryId == null) return "Unknown";
	const fullEntry = allEntries.find((e) => e.id === ref.toEntryId);
	if (!fullEntry) {
		const fallback = ref.toEntry?.label ?? "Unknown";
		return `${DIRECTIVE[ref.relationType]} ${fallback}`;
	}
	const target = getEntryPathColonForm({
		entry: fullEntry,
		entries: allEntries,
	});
	const directive = getDirectiveForSingleRef({ ref, allEntries });
	return `${directive} ${target}`;
};
