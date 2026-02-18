import { toast } from "sonner";
import { trpc } from "@/app/_common/_utils/trpc";

export const useDeleteEntry = () => {
	const utils = trpc.useUtils();

	return trpc.indexEntry.delete.useMutation({
		onMutate: async (deleteInput) => {
			console.log("[useDeleteEntry] onMutate - deleting entry:", {
				id: deleteInput.id,
				projectId: deleteInput.projectId,
				projectIndexTypeId: deleteInput.projectIndexTypeId,
			});

			// Cancel specific type query
			await utils.indexEntry.list.cancel({
				projectId: deleteInput.projectId,
				projectIndexTypeId: deleteInput.projectIndexTypeId,
			});

			// Cancel all entries query (used by editor for MentionCreationPopover)
			await utils.indexEntry.list.cancel({
				projectId: deleteInput.projectId,
			});

			const previous = utils.indexEntry.list.getData({
				projectId: deleteInput.projectId,
				projectIndexTypeId: deleteInput.projectIndexTypeId,
			});

			const previousAll = utils.indexEntry.list.getData({
				projectId: deleteInput.projectId,
			});

			console.log("[useDeleteEntry] Cache before delete:", {
				specificTypeCount: previous?.length,
				allEntriesCount: previousAll?.length,
				entryToDelete: previousAll?.find((e) => e.id === deleteInput.id),
			});

			// Update specific type cache
			utils.indexEntry.list.setData(
				{
					projectId: deleteInput.projectId,
					projectIndexTypeId: deleteInput.projectIndexTypeId,
				},
				(old) => (old || []).filter((e) => e.id !== deleteInput.id),
			);

			// Update all entries cache
			utils.indexEntry.list.setData(
				{ projectId: deleteInput.projectId },
				(old) => (old || []).filter((e) => e.id !== deleteInput.id),
			);

			const afterSpecific = utils.indexEntry.list.getData({
				projectId: deleteInput.projectId,
				projectIndexTypeId: deleteInput.projectIndexTypeId,
			});

			const afterAll = utils.indexEntry.list.getData({
				projectId: deleteInput.projectId,
			});

			console.log("[useDeleteEntry] Cache after delete:", {
				specificTypeCount: afterSpecific?.length,
				allEntriesCount: afterAll?.length,
			});

			return { previous, previousAll };
		},

		onError: (err, deleteInput, context) => {
			// Rollback specific type cache
			if (context?.previous) {
				utils.indexEntry.list.setData(
					{
						projectId: deleteInput.projectId,
						projectIndexTypeId: deleteInput.projectIndexTypeId,
					},
					context.previous,
				);
			}

			// Rollback all entries cache
			if (context?.previousAll) {
				utils.indexEntry.list.setData(
					{ projectId: deleteInput.projectId },
					context.previousAll,
				);
			}

			toast.error(`Failed to delete entry: ${err.message}`);
		},

		onSuccess: () => {
			toast.success("Entry deleted");
		},

		onSettled: (_data, _err, variables) => {
			// Invalidate specific type query
			utils.indexEntry.list.invalidate({
				projectId: variables.projectId,
				projectIndexTypeId: variables.projectIndexTypeId,
			});

			// Invalidate all entries query
			utils.indexEntry.list.invalidate({
				projectId: variables.projectId,
			});

			// Invalidate mentions since they cascade delete with the entry
			utils.indexMention.list.invalidate({
				projectId: variables.projectId,
			});

			utils.indexEntry.getIndexView.invalidate();
		},
	});
};
