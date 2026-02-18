"use client";

import { useMemo } from "react";
import { trpc } from "@/app/_common/_utils/trpc";
import type { IndexEntry } from "@/app/projects/[projectDir]/editor/_types/index-entry";
import { formatCrossReferencesAsSegments } from "@/app/projects/[projectDir]/editor/_utils/cross-reference-utils";

const EMPTY_MESSAGE =
	"Create entries and attach mentions in order to see your index.";

const sortByLabel = (a: { label: string }, b: { label: string }) =>
	a.label.localeCompare(b.label, undefined, { sensitivity: "base" });

type IndexViewRowProps = {
	entry: IndexEntry;
	allEntries: IndexEntry[];
	pageRange: string;
	depth: number;
};

const IndexViewRow = ({
	entry,
	allEntries,
	pageRange,
	depth,
}: IndexViewRowProps) => {
	const crossRefSegments = useMemo(
		() =>
			formatCrossReferencesAsSegments({
				crossReferences: entry.crossReferences ?? [],
				allEntries,
			}),
		[entry.crossReferences, allEntries],
	);

	const hasPageNumbers = pageRange.length > 0;
	const hasCrossRefs = crossRefSegments.length > 0;

	return (
		<div className="py-0.5">
			<div
				className="flex gap-4 items-baseline text-sm text-neutral-900 dark:text-neutral-100"
				style={{ paddingLeft: `${depth * 1.25}rem` }}
			>
				<span className="font-medium">{entry.label}</span>
				{hasPageNumbers && (
					<span className="flex-shrink-0 text-neutral-600 dark:text-neutral-400 tabular-nums">
						{pageRange}
					</span>
				)}
			</div>
			{hasCrossRefs && (
				<div
					className="font-merriweather text-xs text-neutral-600 dark:text-neutral-400 flex gap-1 flex-wrap"
					style={{ paddingLeft: `${(depth + 1) * 1.25}rem` }}
				>
					{crossRefSegments.map((seg, i) =>
						seg.italic ? (
							<em key={`${i}-${seg.text}`}>{seg.text}</em>
						) : (
							<span key={`${i}-${seg.text}`}>{seg.text}</span>
						),
					)}
				</div>
			)}
		</div>
	);
};

type IndexViewTreeProps = {
	entries: IndexEntry[];
	allEntries: IndexEntry[];
	pageRangesByEntryId: Record<string, string>;
	parentId: string | null;
	depth: number;
};

const IndexViewTree = ({
	entries,
	allEntries,
	pageRangesByEntryId,
	parentId,
	depth,
}: IndexViewTreeProps) => {
	const children = useMemo(
		() => entries.filter((e) => e.parentId === parentId).sort(sortByLabel),
		[entries, parentId],
	);

	return (
		<>
			{children.map((entry) => (
				<div key={entry.id}>
					<IndexViewRow
						entry={entry}
						allEntries={allEntries}
						pageRange={pageRangesByEntryId[entry.id] ?? ""}
						depth={depth}
					/>
					<IndexViewTree
						entries={entries}
						allEntries={allEntries}
						pageRangesByEntryId={pageRangesByEntryId}
						parentId={entry.id}
						depth={depth + 1}
					/>
				</div>
			))}
		</>
	);
};

type SubjectIndexContentProps = {
	projectId: string;
	projectIndexTypeId: string;
};

export const SubjectIndexContent = ({
	projectId,
	projectIndexTypeId,
}: SubjectIndexContentProps) => {
	const { data, isLoading, error } = trpc.indexEntry.getIndexView.useQuery(
		{ projectId, projectIndexTypeId },
		{ enabled: !!projectId && !!projectIndexTypeId },
	);

	const allEntries = useMemo((): IndexEntry[] => {
		if (!data) return [];
		return data.entries.map((e) => ({
			id: e.id,
			label: e.label,
			parentId: e.parentId,
			indexType: "subject" as const,
			status: e.status,
			metadata: {
				matchers: e.matchers?.map((m) => m.text) ?? [],
			},
			crossReferences: data.crossReferencesByEntryId[e.id] ?? [],
		}));
	}, [data]);

	if (isLoading) {
		return (
			<div className="font-merriweather py-4 text-center text-muted-foreground">
				Loading index…
			</div>
		);
	}

	if (error) {
		return (
			<div className="font-merriweather py-4 text-center text-destructive text-sm">
				{error.message}
			</div>
		);
	}

	if (!data || data.entries.length === 0) {
		return (
			<div className="font-merriweather py-8 text-center text-muted-foreground italic">
				{EMPTY_MESSAGE}
			</div>
		);
	}

	return (
		<div className="font-merriweather py-4 space-y-0">
			<IndexViewTree
				entries={allEntries}
				allEntries={allEntries}
				pageRangesByEntryId={data.pageRangesByEntryId}
				parentId={null}
				depth={0}
			/>
		</div>
	);
};
