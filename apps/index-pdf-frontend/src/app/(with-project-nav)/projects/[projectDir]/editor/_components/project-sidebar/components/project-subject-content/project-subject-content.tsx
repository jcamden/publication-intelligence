"use client";

import { useAtomValue } from "jotai";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/app/_common/_trpc/client";
import {
	colorConfigAtom,
	indexEntryGroupsEnabledAtom,
} from "@/app/projects/[projectDir]/editor/_atoms/highlight-atoms";
import { EditGroupModal } from "@/app/projects/[projectDir]/editor/_components/edit-group-modal";
import { IndexEntryToolbar } from "@/app/projects/[projectDir]/editor/_components/index-entry-toolbar";
import { IndexPanelScrollArea } from "@/app/projects/[projectDir]/editor/_components/index-panel-scroll-area";
import { IndexSettingsModal } from "@/app/projects/[projectDir]/editor/_components/index-settings-modal";
import { MatcherDetectionModal } from "@/app/projects/[projectDir]/editor/_components/matcher-detection-modal";
import { usePersistColorChange } from "@/app/projects/[projectDir]/editor/_components/project-sidebar/_hooks/use-persist-color-change";
import { useScrollViewportRef } from "@/app/projects/[projectDir]/editor/_components/project-sidebar/_hooks/use-scroll-viewport-ref";
import { useProjectContext } from "@/app/projects/[projectDir]/editor/_context/project-context";
import { EntryCreationModal } from "../../../entry-creation-modal";
import { EntryTree } from "../../../entry-tree";

export const ProjectSubjectContent = () => {
	const colorConfig = useAtomValue(colorConfigAtom);
	const groupsEnabled = useAtomValue(indexEntryGroupsEnabledAtom).subject;
	const { projectId, documentId } = useProjectContext();

	const [modalOpen, setModalOpen] = useState(false);
	const [matcherModalOpen, setMatcherModalOpen] = useState(false);
	const [settingsModalOpen, setSettingsModalOpen] = useState(false);
	/** "create" | groupId | null. When "create", show EditGroupModal in create mode. */
	const [groupModalState, setGroupModalState] = useState<
		"create" | string | null
	>(null);
	const { scrollViewportRef, setScrollViewportRef } = useScrollViewportRef();

	// Fetch project index types to get the projectIndexTypeId
	const { data: projectIndexTypes, isLoading: isLoadingIndexTypes } =
		trpc.projectHighlightConfig.list.useQuery(
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
	} = trpc.indexEntry.listLean.useQuery(
		{
			projectId: projectId || "",
		},
		{ enabled: !!projectId },
	);

	// Fetch cross references for all entries in a single query
	const { data: crossReferencesData = {} } =
		trpc.indexEntry.crossReference.listByProjectIndexType.useQuery(
			{
				projectId: projectId || "",
				projectIndexTypeId: subjectProjectIndexTypeId,
			},
			{ enabled: !!projectId && !!subjectProjectIndexTypeId },
		);

	const allCrossReferences = useMemo(
		() => new Map(Object.entries(crossReferencesData)),
		[crossReferencesData],
	);

	// Convert backend entries to frontend format (add indexType field and cross references)
	const entries = useMemo(() => {
		if (!subjectProjectIndexTypeId) return [];
		return backendEntries
			.filter((e) => e.projectIndexTypeId === subjectProjectIndexTypeId)
			.map((e) => ({
				...e,
				indexType: "subject" as const,
				projectId: projectId || undefined,
				projectIndexTypeId: subjectProjectIndexTypeId,
				groupId: e.groupId ?? null,
				groupPosition: e.groupPosition ?? null,
				metadata: {
					matchers: [],
				},
				crossReferences: allCrossReferences.get(e.id) || [],
			}));
	}, [
		backendEntries,
		subjectProjectIndexTypeId,
		projectId,
		allCrossReferences,
	]);

	// Fetch groups for this index type
	const { data: groups = [] } = trpc.detection.listIndexEntryGroups.useQuery(
		{
			projectId: projectId || "",
			projectIndexTypeId: subjectProjectIndexTypeId ?? "",
		},
		{ enabled: !!projectId && !!subjectProjectIndexTypeId },
	);

	// Fetch mentions for this document
	const { data: mentionCountsByEntryId = {}, isLoading: isLoadingMentions } =
		trpc.indexMention.countsByEntry.useQuery(
			{
				projectId: projectId || "",
				documentId: documentId || "",
			},
			{ enabled: !!projectId && !!documentId, gcTime: 2 * 60 * 1000 },
		);

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
			utils.indexEntry.listLean.invalidate({
				projectId: projectId || "",
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
			utils.indexEntry.listLean.invalidate({
				projectId: projectId || "",
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
				<div className="p-2 pt-0">
					<IndexEntryToolbar
						onCreateEntry={() => setModalOpen(true)}
						onCreateGroup={() => setGroupModalState("create")}
						onMatcherDetection={() => setMatcherModalOpen(true)}
						onSettings={() => setSettingsModalOpen(true)}
						groupsEnabled={groupsEnabled}
						showMatcherDetection={true}
						hasEntriesWithMatchers={true}
					/>
					<MatcherDetectionModal
						open={matcherModalOpen}
						onClose={() => setMatcherModalOpen(false)}
						scope="project"
						projectId={projectId}
						projectIndexTypeId={subjectProjectIndexTypeId}
						indexType="subject"
						emptyStateMessage="Create groups and matchers in this index, then run detection."
					/>
					<IndexSettingsModal
						open={settingsModalOpen}
						onClose={() => setSettingsModalOpen(false)}
						indexType="subject"
					/>
				</div>
			)}
			<IndexPanelScrollArea viewportRef={setScrollViewportRef}>
				<EntryTree
					entries={entries}
					mentionCountsByEntryId={mentionCountsByEntryId}
					groups={
						groupsEnabled
							? groups.map((g) => ({
									id: g.id,
									name: g.name,
									sortMode: g.sortMode,
								}))
							: []
					}
					projectId={projectId}
					projectIndexTypeId={subjectProjectIndexTypeId}
					onEditGroup={(id) => setGroupModalState(id)}
					onAddEntryToGroup={handleAddEntryToGroup}
					onReorderGroups={handleReorderGroups}
					onReorderEntriesInGroup={handleReorderEntriesInGroup}
					scrollViewportRef={scrollViewportRef}
					isLoading={isLoading}
					error={entriesError ? (entriesError as unknown as Error) : null}
				/>
			</IndexPanelScrollArea>
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
							indexType="subject"
							existingEntries={entries}
						/>
					)}
				</>
			)}
		</>
	);
};
