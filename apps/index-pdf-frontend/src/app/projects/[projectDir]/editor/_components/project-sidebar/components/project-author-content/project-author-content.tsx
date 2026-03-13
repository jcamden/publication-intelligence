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

export const ProjectAuthorContent = () => {
	const [colorConfig, setColorConfig] = useAtom(colorConfigAtom);
	const { projectId, documentId } = useProjectContext();

	const [modalOpen, setModalOpen] = useState(false);
	/** "create" | groupId | null. When "create", show EditGroupModal in create mode. */
	const [groupModalState, setGroupModalState] = useState<
		"create" | string | null
	>(null);

	const { data: projectIndexTypes, isLoading: isLoadingIndexTypes } =
		trpc.projectIndexType.list.useQuery(
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
		indexType: "author" as const,
		projectId: projectId || undefined,
		projectIndexTypeId: authorProjectIndexTypeId,
		groupId: e.groupId ?? null,
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

	const isLoading =
		isLoadingIndexTypes ||
		isLoadingEntries ||
		(isLoadingMentions && !!documentId);

	return (
		<>
			<div className="p-3 border-b border-gray-200 dark:border-gray-700">
				<div className="flex items-center justify-between gap-3">
					<span className="text-sm font-medium text-gray-700 dark:text-gray-300">
						Author Color
					</span>
					<OklchColorPicker
						value={colorConfig.author}
						onChange={(color) => {
							setColorConfig((prev) => ({
								...prev,
								author: color,
							}));
						}}
						label="Author color"
					/>
				</div>
			</div>
			<EntryTree
				entries={entries}
				mentions={allMentions}
				groups={groups.map((g) => ({ id: g.id, name: g.name }))}
				projectId={projectId}
				projectIndexTypeId={authorProjectIndexTypeId}
				onCreateEntry={() => setModalOpen(true)}
				onCreateGroup={() => setGroupModalState("create")}
				onEditGroup={(id) => setGroupModalState(id)}
				onAddEntryToGroup={handleAddEntryToGroup}
				isLoading={isLoading}
				error={entriesError ? (entriesError as unknown as Error) : null}
			/>
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
							existingEntries={entries}
						/>
					)}
				</>
			)}
		</>
	);
};
