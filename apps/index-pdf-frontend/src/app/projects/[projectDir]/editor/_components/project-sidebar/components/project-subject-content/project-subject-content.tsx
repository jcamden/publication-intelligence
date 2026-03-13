"use client";

import { OklchColorPicker } from "@pubint/yaboujee/components/ui/oklch-color-picker/oklch-color-picker";
import { useAtom } from "jotai";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/app/_common/_utils/trpc";
import { colorConfigAtom } from "@/app/projects/[projectDir]/editor/_atoms/editor-atoms";
import { EditGroupModal } from "@/app/projects/[projectDir]/editor/_components/edit-group-modal";
import { useProjectContext } from "@/app/projects/[projectDir]/editor/_context/project-context";
import { usePersistColorChange } from "@/app/projects/[projectDir]/editor/_hooks/use-persist-color-change";
import { EntryCreationModal } from "../../../entry-creation-modal";
import { EntryTree } from "../../../entry-tree";
import { MatcherRunControls } from "../matcher-run-controls";

export const ProjectSubjectContent = () => {
	const [colorConfig, setColorConfig] = useAtom(colorConfigAtom);
	const { projectId, documentId } = useProjectContext();

	const [modalOpen, setModalOpen] = useState(false);
	/** "create" | groupId | null. When "create", show EditGroupModal in create mode. */
	const [groupModalState, setGroupModalState] = useState<
		"create" | string | null
	>(null);

	// Fetch project index types to get the projectIndexTypeId
	const { data: projectIndexTypes, isLoading: isLoadingIndexTypes } =
		trpc.projectIndexType.list.useQuery(
			{ projectId: projectId || "" },
			{ enabled: !!projectId },
		);

	const subjectProjectIndexTypeId = useMemo(
		() =>
			projectIndexTypes?.find((t) => t.indexType === "subject")?.id ||
			undefined,
		[projectIndexTypes],
	);

	// Fetch entries from backend
	const {
		data: backendEntries = [],
		isLoading: isLoadingEntries,
		error: entriesError,
	} = trpc.indexEntry.list.useQuery(
		{
			projectId: projectId || "",
			projectIndexTypeId: subjectProjectIndexTypeId,
		},
		{ enabled: !!projectId && !!subjectProjectIndexTypeId },
	);

	// Fetch cross references for all entries
	const crossReferencesQueries = trpc.useQueries((t) =>
		backendEntries.map((entry) =>
			t.indexEntry.crossReference.list(
				{ entryId: entry.id },
				{ enabled: !!entry.id },
			),
		),
	);

	const allCrossReferences = useMemo(() => {
		const map = new Map<
			string,
			Array<{
				id: string;
				toEntryId: string | null;
				arbitraryValue: string | null;
				relationType: "see" | "see_also" | "qv";
				toEntry?: { id: string; label: string } | null;
			}>
		>();
		backendEntries.forEach((entry, index) => {
			const data = crossReferencesQueries[index]?.data || [];
			map.set(entry.id, data);
		});
		return map;
	}, [backendEntries, crossReferencesQueries]);

	// Convert backend entries to frontend format (add indexType field and cross references)
	const entries = backendEntries.map((e) => ({
		...e,
		indexType: "subject" as const,
		projectId: projectId || undefined,
		projectIndexTypeId: subjectProjectIndexTypeId,
		groupId: e.groupId ?? null,
		groupPosition: e.groupPosition ?? null,
		metadata: {
			matchers: e.matchers?.map((m) => m.text) || [],
		},
		crossReferences: allCrossReferences.get(e.id) || [],
	}));

	// Fetch groups for this index type
	const { data: groups = [] } = trpc.detection.listIndexEntryGroups.useQuery(
		{
			projectId: projectId || "",
			projectIndexTypeId: subjectProjectIndexTypeId ?? "",
		},
		{ enabled: !!projectId && !!subjectProjectIndexTypeId },
	);

	// Fetch mentions for this document
	const { data: backendMentions = [], isLoading: isLoadingMentions } =
		trpc.indexMention.list.useQuery(
			{
				projectId: projectId || "",
				documentId: documentId || "",
			},
			{ enabled: !!projectId && !!documentId },
		);

	// Convert backend mentions to frontend format
	const allMentions = backendMentions.map((m) => ({
		id: m.id,
		pageNumber: m.pageNumber ?? 1,
		text: m.textSpan,
		bboxes: m.bboxes ?? [],
		entryId: m.entryId,
		entryLabel: m.entry.label,
		indexType: m.indexTypes[0]?.indexType ?? "",
		type: m.mentionType as "text" | "region",
		pageSublocation: m.pageSublocation ?? null,
		createdAt: new Date(m.createdAt),
	}));

	// Persist color changes to backend
	usePersistColorChange({
		projectId,
		highlightType: "subject",
		colorHue: colorConfig.subject.hue,
		enabled: !!projectId,
	});

	const utils = trpc.useUtils();
	const addEntryToGroup = trpc.detection.addEntryToGroup.useMutation({
		onSuccess: (result, variables) => {
			if (result.transferredFrom) {
				toast.info("Entry transferred to this group");
				utils.detection.getIndexEntryGroup.invalidate({
					groupId: result.transferredFrom,
				});
			}
			utils.detection.getIndexEntryGroup.invalidate({
				groupId: variables.groupId,
			});
			utils.detection.listIndexEntryGroups.invalidate({
				projectId: projectId || "",
				projectIndexTypeId: subjectProjectIndexTypeId ?? "",
			});
			utils.indexEntry.list.invalidate({
				projectId: projectId || "",
				projectIndexTypeId: subjectProjectIndexTypeId,
			});
		},
		onError: (error) => {
			toast.error(`Failed to add entry to group: ${error.message}`);
		},
	});

	const handleAddEntryToGroup = useCallback(
		(groupId: string, entryId: string) => {
			addEntryToGroup.mutate({ groupId, entryId });
		},
		[addEntryToGroup],
	);

	const reorderGroups = trpc.detection.reorderGroups.useMutation({
		onSuccess: () => {
			utils.detection.listIndexEntryGroups.invalidate({
				projectId: projectId || "",
				projectIndexTypeId: subjectProjectIndexTypeId ?? "",
			});
		},
		onError: (error) => {
			toast.error(`Failed to reorder groups: ${error.message}`);
		},
	});

	const handleReorderGroups = useCallback(
		(groupIds: string[]) => {
			reorderGroups.mutate({
				projectId: projectId || "",
				projectIndexTypeId: subjectProjectIndexTypeId ?? "",
				groupIds,
			});
		},
		[reorderGroups, projectId, subjectProjectIndexTypeId],
	);

	const reorderGroupEntries = trpc.detection.reorderGroupEntries.useMutation({
		onSuccess: (_, variables) => {
			utils.detection.getIndexEntryGroup.invalidate({
				groupId: variables.groupId,
			});
			utils.indexEntry.list.invalidate({
				projectId: projectId || "",
				projectIndexTypeId: subjectProjectIndexTypeId,
			});
		},
		onError: (error) => {
			toast.error(`Failed to reorder entries: ${error.message}`);
		},
	});

	const handleReorderEntriesInGroup = useCallback(
		(groupId: string, entryIds: string[]) => {
			reorderGroupEntries.mutate({ groupId, entryIds });
		},
		[reorderGroupEntries],
	);

	const isLoading =
		isLoadingIndexTypes ||
		isLoadingEntries ||
		(isLoadingMentions && !!documentId);

	return (
		<>
			{subjectProjectIndexTypeId && projectId && (
				<div className="p-3 border-b border-gray-200 dark:border-gray-700">
					<MatcherRunControls
						projectId={projectId}
						projectIndexTypeId={subjectProjectIndexTypeId}
						indexType="subject"
						emptyStateMessage="Create groups and matchers in this index, then run detection."
					/>
				</div>
			)}
			<div className="p-3 border-b border-gray-200 dark:border-gray-700">
				<div className="flex items-center justify-between gap-3">
					<span className="text-sm font-medium text-gray-700 dark:text-gray-300">
						Subject Color
					</span>
					<OklchColorPicker
						value={colorConfig.subject}
						onChange={(color) => {
							setColorConfig((prev) => ({
								...prev,
								subject: color,
							}));
						}}
						label="Subject color"
					/>
				</div>
			</div>
			<EntryTree
				entries={entries}
				mentions={allMentions}
				groups={groups.map((g) => ({
					id: g.id,
					name: g.name,
					sortMode: g.sortMode,
				}))}
				projectId={projectId}
				projectIndexTypeId={subjectProjectIndexTypeId}
				onCreateEntry={() => setModalOpen(true)}
				onCreateGroup={() => setGroupModalState("create")}
				onEditGroup={(id) => setGroupModalState(id)}
				onAddEntryToGroup={handleAddEntryToGroup}
				onReorderGroups={handleReorderGroups}
				onReorderEntriesInGroup={handleReorderEntriesInGroup}
				isLoading={isLoading}
				error={entriesError ? (entriesError as unknown as Error) : null}
			/>
			{subjectProjectIndexTypeId && projectId && (
				<>
					<EntryCreationModal
						open={modalOpen}
						onClose={() => setModalOpen(false)}
						projectId={projectId}
						projectIndexTypeId={subjectProjectIndexTypeId}
						existingEntries={entries}
					/>
					{groupModalState !== null && (
						<EditGroupModal
							open={true}
							onClose={() => setGroupModalState(null)}
							groupId={groupModalState === "create" ? null : groupModalState}
							projectId={projectId}
							projectIndexTypeId={subjectProjectIndexTypeId}
							existingEntries={entries}
						/>
					)}
				</>
			)}
		</>
	);
};
