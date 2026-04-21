"use client";

import { useMemo } from "react";
import { trpc } from "@/app/_common/_trpc/client";
import { useRegionDerivedPageNumbers } from "@/app/projects/[projectDir]/editor/_hooks/use-region-derived-page-numbers";
import type { IndexEntry } from "@/app/projects/[projectDir]/editor/_types/index-entry";
import { formatCrossReferencesAsSegments } from "@/app/projects/[projectDir]/editor/_utils/cross-reference-utils";
import { documentPageRangeToCanonicalRangeString } from "../_utils/canonical-page-range";

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
	/** When parentId is null, optionally restrict to only these root entry IDs (for group-as-section). */
	rootEntryIds?: string[] | null;
};

const IndexViewTree = ({
	entries,
	allEntries,
	pageRangesByEntryId,
	parentId,
	depth,
	rootEntryIds,
}: IndexViewTreeProps) => {
	const children = useMemo(() => {
		let filtered = entries.filter((e) => e.parentId === parentId);
		if (parentId === null && rootEntryIds && rootEntryIds.length > 0) {
			filtered = filtered.filter((e) => rootEntryIds.includes(e.id));
		}
		return filtered.sort(sortByLabel);
	}, [entries, parentId, rootEntryIds]);

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

	const { data: groups = [] } = trpc.detection.listIndexEntryGroups.useQuery(
		{ projectId, projectIndexTypeId },
		{ enabled: !!projectId && !!projectIndexTypeId && !!data },
	);

	const { data: regions = [] } = trpc.region.list.useQuery(
		{ projectId },
		{ enabled: !!projectId },
	);

	const { regionDerivedPageNumbers } = useRegionDerivedPageNumbers({
		regions,
		projectId: projectId ?? undefined,
		enabled: !!projectId,
	});

	const docToCanonical = useMemo(() => {
		const map = new Map<number, string>();
		for (const d of regionDerivedPageNumbers) {
			map.set(d.documentPage, d.canonicalPage);
		}
		return map;
	}, [regionDerivedPageNumbers]);

	const allEntries = useMemo((): IndexEntry[] => {
		if (!data) return [];
		return data.entries.map((e) => ({
			id: e.id,
			label: e.label,
			parentId: e.parentId,
			indexType: "subject" as const,
			status: e.status,
			groupId: e.groupId ?? undefined,
			groupPosition: e.groupPosition ?? undefined,
			metadata: {
				matchers: e.matchers?.map((m) => m.text) ?? [],
			},
			crossReferences: data.crossReferencesByEntryId[e.id] ?? [],
		}));
	}, [data]);

	const canonicalPageRangesByEntryId = useMemo(() => {
		if (!data?.pageRangesByEntryId) return {};
		const out: Record<string, string> = {};
		for (const entryId of Object.keys(data.pageRangesByEntryId)) {
			const docRangeStr = data.pageRangesByEntryId[entryId];
			out[entryId] = documentPageRangeToCanonicalRangeString({
				documentPageRangeStr: docRangeStr,
				docToCanonical,
			});
		}
		return out;
	}, [data?.pageRangesByEntryId, docToCanonical]);

	// Group-as-section: partition root entries by group (must run before early returns)
	const { ungroupedRootIds, groupIdToRootIds, hasGroups, hasUngrouped } =
		useMemo(() => {
			const entries = allEntries;
			const groupIds = new Set(groups.map((g) => g.id));
			const roots = entries.filter((e) => e.parentId === null);
			const ungrouped = roots
				.filter((e) => !e.groupId || !groupIds.has(e.groupId))
				.sort(sortByLabel)
				.map((e) => e.id);
			const map = new Map<string, string[]>();
			for (const e of roots) {
				if (e.groupId && groupIds.has(e.groupId)) {
					const list = map.get(e.groupId) ?? [];
					list.push(e.id);
					map.set(e.groupId, list);
				}
			}
			for (const [gid, ids] of map) {
				const group = groups.find((g) => g.id === gid);
				const entriesInGroup = ids
					.map((id) => entries.find((e) => e.id === id))
					.filter((e): e is IndexEntry => Boolean(e));
				if (group?.sortMode === "custom") {
					entriesInGroup.sort(
						(a, b) =>
							(a.groupPosition ?? 999) - (b.groupPosition ?? 999) ||
							sortByLabel(a, b),
					);
				} else {
					entriesInGroup.sort(sortByLabel);
				}
				map.set(
					gid,
					entriesInGroup.map((e) => e.id),
				);
			}
			return {
				ungroupedRootIds: ungrouped,
				groupIdToRootIds: map,
				hasGroups: groups.length > 0,
				hasUngrouped: ungrouped.length > 0,
			};
		}, [allEntries, groups]);

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

	// When no groups exist, render flat tree. Otherwise render group-as-section.
	if (!hasGroups) {
		return (
			<div className="font-merriweather py-4 space-y-0">
				<IndexViewTree
					entries={allEntries}
					allEntries={allEntries}
					pageRangesByEntryId={canonicalPageRangesByEntryId}
					parentId={null}
					depth={0}
				/>
			</div>
		);
	}

	return (
		<div className="font-merriweather py-4 space-y-0">
			{/* Ungrouped entries first */}
			{hasUngrouped && (
				<div className="space-y-0">
					<IndexViewTree
						entries={allEntries}
						allEntries={allEntries}
						pageRangesByEntryId={canonicalPageRangesByEntryId}
						parentId={null}
						depth={0}
						rootEntryIds={ungroupedRootIds}
					/>
				</div>
			)}
			{/* Group sections */}
			{groups.map((group) => {
				const rootIds = groupIdToRootIds.get(group.id) ?? [];
				if (rootIds.length === 0) return null;
				return (
					<div
						key={group.id}
						className="mt-6 first:mt-0 space-y-0"
						data-group-id={group.id}
					>
						<div className="mb-2 text-base font-semibold text-neutral-700 dark:text-neutral-300">
							{group.name}
						</div>
						<IndexViewTree
							entries={allEntries}
							allEntries={allEntries}
							pageRangesByEntryId={canonicalPageRangesByEntryId}
							parentId={null}
							depth={0}
							rootEntryIds={rootIds}
						/>
					</div>
				);
			})}
		</div>
	);
};
