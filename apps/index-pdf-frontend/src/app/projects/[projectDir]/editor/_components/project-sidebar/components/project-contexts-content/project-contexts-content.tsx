"use client";

import { OklchColorPicker } from "@pubint/yabasic/components/ui/oklch-color-picker";
import { useAtom } from "jotai";
import { useMemo, useState } from "react";
import { trpc } from "@/app/_common/_utils/trpc";
import { colorConfigAtom } from "@/app/projects/[projectDir]/editor/_atoms/editor-atoms";
import { useProjectContext } from "@/app/projects/[projectDir]/editor/_context/project-context";
import { usePersistColorChange } from "@/app/projects/[projectDir]/editor/_hooks/use-persist-color-change";
import { EntryCreationModal } from "../../../entry-creation-modal";
import { EntryTree } from "../../../entry-tree";

export const ProjectContextsContent = () => {
	const [colorConfig, setColorConfig] = useAtom(colorConfigAtom);
	const { projectId, documentId } = useProjectContext();

	const [modalOpen, setModalOpen] = useState(false);

	const { data: projectIndexTypes, isLoading: isLoadingIndexTypes } =
		trpc.projectIndexType.list.useQuery(
			{ projectId: projectId || "" },
			{ enabled: !!projectId },
		);

	// Note: "context" index type not yet implemented in backend
	// Backend only supports: "subject", "author", "scripture"
	const contextProjectIndexTypeId = useMemo(
		() =>
			// biome-ignore lint/suspicious/noExplicitAny: Context index type not yet in backend enum
			projectIndexTypes?.find((t) => t.indexType === ("context" as any))?.id ||
			undefined,
		[projectIndexTypes],
	);

	// Fetch entries from backend (will be empty until context type is added)
	const {
		data: backendEntries = [],
		isLoading: isLoadingEntries,
		error: entriesError,
	} = trpc.indexEntry.list.useQuery(
		{
			projectId: projectId || "",
			projectIndexTypeId: contextProjectIndexTypeId,
		},
		{ enabled: !!projectId && !!contextProjectIndexTypeId },
	);

	// Convert backend entries to frontend format (add indexType field)
	const entries = backendEntries.map((e) => ({
		...e,
		indexType: "context",
		projectId: projectId || undefined,
		projectIndexTypeId: contextProjectIndexTypeId,
		metadata: {
			aliases: e.variants.map((v) => v.text),
		},
	}));

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
		indexTypes: m.indexTypes.map((t) => t.indexType),
		type: m.mentionType as "text" | "region",
		createdAt: new Date(m.createdAt),
	}));

	// Persist color changes to backend
	usePersistColorChange({
		projectId,
		indexType: "context",
		colorHue: colorConfig.context.hue,
		enabled: !!projectId,
	});

	const isLoading =
		isLoadingIndexTypes ||
		isLoadingEntries ||
		(isLoadingMentions && !!documentId);

	return (
		<>
			<div className="p-3 border-b border-gray-200 dark:border-gray-700">
				<div className="flex items-center justify-between gap-3">
					<span className="text-sm font-medium text-gray-700 dark:text-gray-300">
						Context Color
					</span>
					<OklchColorPicker
						value={colorConfig.context}
						onChange={(color) => {
							setColorConfig((prev) => ({
								...prev,
								context: color,
							}));
						}}
						label="Context color"
					/>
				</div>
			</div>
			<EntryTree
				entries={entries}
				mentions={allMentions}
				projectId={projectId}
				onCreateEntry={() => setModalOpen(true)}
				isLoading={isLoading}
				error={entriesError ? (entriesError as unknown as Error) : null}
			/>
			{contextProjectIndexTypeId && projectId && (
				<EntryCreationModal
					open={modalOpen}
					onClose={() => setModalOpen(false)}
					projectId={projectId}
					projectIndexTypeId={contextProjectIndexTypeId}
					existingEntries={entries}
				/>
			)}
		</>
	);
};
