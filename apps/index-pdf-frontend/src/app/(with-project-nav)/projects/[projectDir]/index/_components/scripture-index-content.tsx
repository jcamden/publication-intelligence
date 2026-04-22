"use client";

import { useMemo } from "react";
import { trpc } from "@/app/_common/_trpc/client";
import { useRegionDerivedPageNumbers } from "@/app/projects/[projectDir]/_hooks/use-region-derived-page-numbers";
import type { IndexEntry } from "@/app/projects/[projectDir]/_types/index-entry";
import { formatCrossReferencesAsSegments } from "@/app/projects/[projectDir]/_utils/cross-reference-utils";
import { getChildEntries } from "@/app/projects/[projectDir]/_utils/entry-filters";
import {
	type ScriptureGroupSortMode,
	sortBookEntriesForGroup,
	sortUngroupedBooks,
} from "@/app/projects/[projectDir]/_utils/scripture-sort";
import { documentPageRangeToCanonicalRangeString } from "../_utils/canonical-page-range";
import { IndexColumnLayout } from "./index-column-layout";

const EMPTY_MESSAGE =
	"Create entries and attach mentions in order to see your index.";

const sortRefEntries = (a: IndexEntry, b: IndexEntry) =>
	(a.label ?? "").localeCompare(b.label ?? "", undefined, { numeric: true });

// Enough dots to fill any realistic column width. The overflow-hidden BFC
// trick clips them precisely at the right edge of the floated page numbers.
const LEADER_DOTS = ". ".repeat(80);

// ---------------------------------------------------------------------------
// ScriptureRefRow — a single ch:v reference entry (child of a book)
// ---------------------------------------------------------------------------

type ScriptureRefRowProps = {
	entry: IndexEntry;
	allEntries: IndexEntry[];
	pageRange: string;
};

const ScriptureRefRow = ({
	entry,
	allEntries,
	pageRange,
}: ScriptureRefRowProps) => {
	const crossRefSegments = useMemo(
		() =>
			formatCrossReferencesAsSegments({
				crossReferences: entry.crossReferences ?? [],
				allEntries,
			}),
		[entry.crossReferences, allEntries],
	);

	const hasCrossRefs = crossRefSegments.length > 0;

	return (
		// overflow-hidden turns this div into a block formatting context so the
		// float-right page numbers are contained within it and clear correctly.
		<div className="py-0.5 text-sm overflow-hidden">
			{pageRange && (
				// Float must appear before the BFC label span in DOM order so the
				// BFC positions itself to the left of the float.
				<span className="float-right text-right tabular-nums text-neutral-700 dark:text-neutral-300 ml-2">
					{pageRange}
				</span>
			)}
			{/* overflow-hidden creates a new BFC that won't overlap the float.
			    whitespace-nowrap lets the dots fill the entire available width;
			    the BFC boundary clips them exactly where the float begins. */}
			<span className="block overflow-hidden whitespace-nowrap text-neutral-900 dark:text-neutral-100">
				{entry.label}
				{pageRange && (
					<span
						className="text-neutral-400 dark:text-neutral-500"
						aria-hidden="true"
					>
						{LEADER_DOTS}
					</span>
				)}
			</span>
			{hasCrossRefs && (
				<div className="text-xs text-neutral-600 dark:text-neutral-400 flex gap-1 flex-wrap pl-4">
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

// ---------------------------------------------------------------------------
// ScriptureBookSection — a single book heading + its ch:v children
// ---------------------------------------------------------------------------

type ScriptureBookSectionProps = {
	book: IndexEntry;
	allEntries: IndexEntry[];
	pageRangesByEntryId: Record<string, string>;
};

const ScriptureBookSection = ({
	book,
	allEntries,
	pageRangesByEntryId,
}: ScriptureBookSectionProps) => {
	const refs = useMemo(() => {
		const children = getChildEntries({
			entries: allEntries,
			parentId: book.id,
		});
		return [...children].sort(sortRefEntries);
	}, [allEntries, book.id]);

	const bookPageRange = pageRangesByEntryId[book.id] ?? "";

	return (
		<div className="mt-3 first:mt-0">
			<h3
				className={`text-sm font-bold text-neutral-900 dark:text-neutral-100${refs.length > 0 ? " break-after-avoid" : ""}`}
			>
				{book.label}
				{bookPageRange && refs.length === 0 && (
					<>
						<span className="font-normal text-neutral-400 dark:text-neutral-500">
							...
						</span>
						<span className="font-normal tabular-nums text-neutral-700 dark:text-neutral-300">
							{bookPageRange}
						</span>
					</>
				)}
			</h3>
			{refs.map((ref) => (
				<ScriptureRefRow
					key={ref.id}
					entry={ref}
					allEntries={allEntries}
					pageRange={pageRangesByEntryId[ref.id] ?? ""}
				/>
			))}
		</div>
	);
};

// ---------------------------------------------------------------------------
// ScriptureIndexContent — main exported component
// ---------------------------------------------------------------------------

type ScriptureIndexContentProps = {
	projectId: string;
	projectIndexTypeId: string;
	/** When false (default), books with no mentions are hidden. */
	showBooksWithNoMentions?: boolean;
};

export const ScriptureIndexContent = ({
	projectId,
	projectIndexTypeId,
	showBooksWithNoMentions = false,
}: ScriptureIndexContentProps) => {
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
			indexType: "scripture" as const,
			status: e.status,
			slug: e.slug ?? undefined,
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

	// Partition root (book) entries by group, applying canon/custom sort within each group.
	// Must run unconditionally before early returns.
	const { ungroupedBooks, groupIdToBooks, hasGroups, hasUngrouped } =
		useMemo(() => {
			const groupIds = new Set(groups.map((g) => g.id));
			const roots = getChildEntries({ entries: allEntries, parentId: null });

			const bookHasMentions = (book: IndexEntry) => {
				if (canonicalPageRangesByEntryId[book.id]?.length) return true;
				return getChildEntries({ entries: allEntries, parentId: book.id }).some(
					(child) => canonicalPageRangesByEntryId[child.id]?.length,
				);
			};

			const shouldShow = (book: IndexEntry) =>
				showBooksWithNoMentions || bookHasMentions(book);

			const ungrouped = roots.filter(
				(e) => (!e.groupId || !groupIds.has(e.groupId)) && shouldShow(e),
			);
			sortUngroupedBooks(ungrouped);

			const map = new Map<string, IndexEntry[]>();
			for (const e of roots) {
				if (e.groupId && groupIds.has(e.groupId) && shouldShow(e)) {
					const list = map.get(e.groupId) ?? [];
					list.push(e);
					map.set(e.groupId, list);
				}
			}
			for (const group of groups) {
				const list = map.get(group.id);
				if (list) {
					sortBookEntriesForGroup(
						list,
						group.sortMode as ScriptureGroupSortMode | undefined,
					);
				}
			}

			return {
				ungroupedBooks: ungrouped,
				groupIdToBooks: map,
				hasGroups: groups.length > 0,
				hasUngrouped: ungrouped.length > 0,
			};
		}, [
			allEntries,
			groups,
			canonicalPageRangesByEntryId,
			showBooksWithNoMentions,
		]);

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

	const renderBooks = (books: IndexEntry[]) =>
		books.map((book) => (
			<ScriptureBookSection
				key={book.id}
				book={book}
				allEntries={allEntries}
				pageRangesByEntryId={canonicalPageRangesByEntryId}
			/>
		));

	const columnContent = (
		<>
			{hasUngrouped && (
				<div className={hasGroups ? "mb-6" : undefined}>
					{renderBooks(ungroupedBooks)}
				</div>
			)}
			{groups.map((group) => {
				const books = groupIdToBooks.get(group.id) ?? [];
				if (books.length === 0) return null;
				return (
					<div
						key={group.id}
						className="mt-6 first:mt-0"
						data-group-id={group.id}
					>
						<h2 className="text-base font-bold italic text-neutral-800 dark:text-neutral-200 mb-1 break-after-avoid">
							{group.name}
						</h2>
						{renderBooks(books)}
					</div>
				);
			})}
		</>
	);

	return <IndexColumnLayout>{columnContent}</IndexColumnLayout>;
};
