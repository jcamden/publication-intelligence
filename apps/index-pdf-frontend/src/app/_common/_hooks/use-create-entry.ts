import { toast } from "sonner";
import { trpc } from "@/app/_common/_utils/trpc";
import type { IndexEntryListItem } from "@/app/_common/_utils/trpc-types";

export const useCreateEntry = () => {
	const utils = trpc.useUtils();

	return trpc.indexEntry.create.useMutation({
		onMutate: async (newEntry) => {
			// Cancel outgoing queries to prevent race conditions
			await utils.indexEntry.list.cancel({
				projectId: newEntry.projectId,
				projectIndexTypeId: newEntry.projectIndexTypeId,
			});

			// Snapshot current state for rollback
			const previous = utils.indexEntry.list.getData({
				projectId: newEntry.projectId,
				projectIndexTypeId: newEntry.projectIndexTypeId,
			});

			// Optimistically add to cache
			utils.indexEntry.list.setData(
				{
					projectId: newEntry.projectId,
					projectIndexTypeId: newEntry.projectIndexTypeId,
				},
				(old) => [
					...(old || []),
					{
						id: `temp-${Date.now()}`,
						label: newEntry.label,
						slug: `temp-slug-${Date.now()}`,
						description: newEntry.description || null,
						status: "active",
						projectIndexTypeId: newEntry.projectIndexTypeId,
						projectIndexType: {
							id: newEntry.projectIndexTypeId,
							indexType: "",
							colorHue: 0,
						},
						parentId: newEntry.parentId || null,
						variants: [],
						mentionCount: 0,
						childCount: 0,
						createdAt: new Date().toISOString(),
						updatedAt: null,
					} satisfies IndexEntryListItem,
				],
			);

			return { previous };
		},

		onError: (err, newEntry, context) => {
			// Rollback optimistic update
			if (context?.previous) {
				utils.indexEntry.list.setData(
					{
						projectId: newEntry.projectId,
						projectIndexTypeId: newEntry.projectIndexTypeId,
					},
					context.previous,
				);
			}

			toast.error(`Failed to create entry: ${err.message}`);
		},

		onSuccess: (data, variables) => {
			// Replace temp entry with real data from server
			// Need to ensure the returned data matches IndexEntryListItem structure
			utils.indexEntry.list.setData(
				{
					projectId: variables.projectId,
					projectIndexTypeId: variables.projectIndexTypeId,
				},
				(old) =>
					(old || []).map((entry) =>
						entry.id.startsWith("temp-")
							? ({
									...data,
									projectIndexType: data.projectIndexType ?? {
										id: data.projectIndexTypeId,
										indexType: "",
										colorHue: 0,
									},
									variants: data.variants ?? [],
									mentionCount: data.mentionCount ?? 0,
									childCount: data.childCount ?? 0,
								} satisfies IndexEntryListItem)
							: entry,
					),
			);

			toast.success(`Entry created: "${data.label}"`);
		},

		onSettled: (_data, _err, variables) => {
			// Refetch to ensure consistency
			// Invalidate both the specific query (for sidebar) and the general query (for editor)
			utils.indexEntry.list.invalidate({
				projectId: variables.projectId,
				projectIndexTypeId: variables.projectIndexTypeId,
			});
			utils.indexEntry.list.invalidate({
				projectId: variables.projectId,
			});
		},
	});
};
