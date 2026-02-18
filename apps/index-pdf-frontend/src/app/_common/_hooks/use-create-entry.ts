import { toast } from "sonner";
import { trpc } from "@/app/_common/_utils/trpc";
import type { IndexEntryListItem } from "@/app/_common/_utils/trpc-types";

export const useCreateEntry = () => {
	const utils = trpc.useUtils();

	return trpc.indexEntry.create.useMutation({
		onMutate: async (newEntry) => {
			console.log("[useCreateEntry] onMutate - creating entry:", {
				label: newEntry.label,
				projectId: newEntry.projectId,
				projectIndexTypeId: newEntry.projectIndexTypeId,
				parentId: newEntry.parentId,
			});

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

			const previousAll = utils.indexEntry.list.getData({
				projectId: newEntry.projectId,
			});

			console.log("[useCreateEntry] Cache before create:", {
				specificTypeCount: previous?.length,
				allEntriesCount: previousAll?.length,
				entriesWithSameLabel: previousAll?.filter(
					(e) => e.label.toLowerCase() === newEntry.label.toLowerCase(),
				),
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
						status: "active",
						projectIndexTypeId: newEntry.projectIndexTypeId,
						projectIndexType: {
							id: newEntry.projectIndexTypeId,
							indexType: "",
							colorHue: 0,
						},
						parentId: newEntry.parentId || null,
						matchers: [],
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
			console.log("[useCreateEntry] onSuccess - entry created:", {
				id: data.id,
				label: data.label,
				slug: data.slug,
				projectId: data.projectId,
				projectIndexTypeId: data.projectIndexTypeId,
			});

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
									matchers: data.matchers ?? [],
									mentionCount: data.mentionCount ?? 0,
									childCount: data.childCount ?? 0,
								} satisfies IndexEntryListItem)
							: entry,
					),
			);

			const afterUpdate = utils.indexEntry.list.getData({
				projectId: variables.projectId,
				projectIndexTypeId: variables.projectIndexTypeId,
			});

			console.log("[useCreateEntry] Cache after success update:", {
				count: afterUpdate?.length,
				newEntry: afterUpdate?.find((e) => e.id === data.id),
			});

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
			utils.indexEntry.getIndexView.invalidate();
		},
	});
};
