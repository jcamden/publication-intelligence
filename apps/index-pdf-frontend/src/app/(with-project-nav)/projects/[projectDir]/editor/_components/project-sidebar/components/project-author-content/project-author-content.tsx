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
import { useProjectContext } from "@/app/projects/[projectDir]/editor/_context/project-context";
import { EntryCreationModal } from "../../../entry-creation-modal";
import { EntryTree } from "../../../entry-tree";

export const ProjectAuthorContent = () => {
	const colorConfig = useAtomValue(colorConfigAtom);
	const groupsEnabled = useAtomValue(indexEntryGroupsEnabledAtom).author;
	const { projectId, documentId } = useProjectContext();

	const [modalOpen, setModalOpen] = useState(false);
	const [matcherModalOpen, setMatcherModalOpen] = useState(false);
	const [settingsModalOpen, setSettingsModalOpen] = useState(false);
	/** "create" | groupId | null. When "create", show EditGroupModal in create mode. */
	const [groupModalState, setGroupModalState] = useState<
		"create" | string | null
	>(null);

	const { data: projectIndexTypes, isLoading: isLoadingIndexTypes } =
		trpc.projectHighlightConfig.list.useQuery(
			{ projectId: projectId || "" },
			{ enabled: !!projectId },
		);

	const authorProjectIndexTypeId = useMemo(
		() =>
			projectIndexTypes?.find((t) => t.indexType === "author")?.id || undefined,
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
			projectIndexTypeId: authorProjectIndexTypeId,
		},
		{ enabled: !!projectId && !!authorProjectIndexTypeId },
	);

	// Fetch cross references for all entries in a single query
	const { data: crossReferencesData = {} } =
		trpc.indexEntry.crossReference.listByProjectIndexType.useQuery(
			{
				projectId: projectId || "",
				projectIndexTypeId: authorProjectIndexTypeId,
			},
			{ enabled: !!projectId && !!authorProjectIndexTypeId },
		);

	const allCrossReferences = useMemo(
		() => new Map(Object.entries(crossReferencesData)),
		[crossReferencesData],
	);

	// Convert backend entries to frontend format (add indexType field and cross references)
	const entries = backendEntries.map((e) => ({
		...e,
		indexType: "author" as const,
		projectId: projectId || undefined,
		projectIndexTypeId: authorProjectIndexTypeId,
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
			projectIndexTypeId: authorProjectIndexTypeId ?? "",
		},
		{ enabled: !!projectId && !!authorProjectIndexTypeId },
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
		pageSublocation: m.pageSublocation ?? null,
		type: m.mentionType as "text" | "region",
		createdAt: new Date(m.createdAt),
	}));

	// Persist color changes to backend
	usePersistColorChange({
		projectId,
		highlightType: "author",
		colorHue: colorConfig.author.hue,
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
				projectIndexTypeId: authorProjectIndexTypeId ?? "",
			});
			utils.indexEntry.list.invalidate({
				projectId: projectId || "",
				projectIndexTypeId: authorProjectIndexTypeId,
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
				projectIndexTypeId: authorProjectIndexTypeId ?? "",
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
				projectIndexTypeId: authorProjectIndexTypeId ?? "",
				groupIds,
			});
		},
		[reorderGroups, projectId, authorProjectIndexTypeId],
	);

	const reorderGroupEntries = trpc.detection.reorderGroupEntries.useMutation({
		onSuccess: (_, variables) => {
			utils.detection.getIndexEntryGroup.invalidate({
				groupId: variables.groupId,
			});
			utils.indexEntry.list.invalidate({
				projectId: projectId || "",
				projectIndexTypeId: authorProjectIndexTypeId,
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
			{authorProjectIndexTypeId && projectId && (
				<div className="p-2 pt-0">
					<IndexEntryToolbar
						onCreateEntry={() => setModalOpen(true)}
						onCreateGroup={() => setGroupModalState("create")}
						onMatcherDetection={() => setMatcherModalOpen(true)}
						onSettings={() => setSettingsModalOpen(true)}
						groupsEnabled={groupsEnabled}
						showMatcherDetection={true}
						hasEntriesWithMatchers={entries.some(
							(e) => (e.metadata?.matchers?.length ?? 0) > 0,
						)}
					/>
					<MatcherDetectionModal
						open={matcherModalOpen}
						onClose={() => setMatcherModalOpen(false)}
						scope="project"
						projectId={projectId}
						projectIndexTypeId={authorProjectIndexTypeId}
						indexType="author"
						emptyStateMessage="Create groups and matchers in this index, then run detection."
					/>
					<IndexSettingsModal
						open={settingsModalOpen}
						onClose={() => setSettingsModalOpen(false)}
						indexType="author"
					/>
				</div>
			)}
			<IndexPanelScrollArea>
				<EntryTree
					entries={entries}
					mentions={allMentions}
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
					projectIndexTypeId={authorProjectIndexTypeId}
					onEditGroup={(id) => setGroupModalState(id)}
					onAddEntryToGroup={handleAddEntryToGroup}
					onReorderGroups={handleReorderGroups}
					onReorderEntriesInGroup={handleReorderEntriesInGroup}
					isLoading={isLoading}
					error={entriesError ? (entriesError as unknown as Error) : null}
				/>
			</IndexPanelScrollArea>
			{authorProjectIndexTypeId && projectId && (
				<>
					<EntryCreationModal
						open={modalOpen}
						onClose={() => setModalOpen(false)}
						projectId={projectId}
						projectIndexTypeId={authorProjectIndexTypeId}
						existingEntries={entries}
					/>
					{groupModalState !== null && (
						<EditGroupModal
							open={true}
							onClose={() => setGroupModalState(null)}
							groupId={groupModalState === "create" ? null : groupModalState}
							projectId={projectId}
							projectIndexTypeId={authorProjectIndexTypeId}
							indexType="author"
							existingEntries={entries}
						/>
					)}
				</>
			)}
		</>
	);
};
