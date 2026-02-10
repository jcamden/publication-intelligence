import { toast } from "sonner";
import { trpc } from "@/app/_common/_utils/trpc";

export const useDeleteEntry = () => {
	const utils = trpc.useUtils();

	return trpc.indexEntry.delete.useMutation({
		onMutate: async (deleteInput) => {
			await utils.indexEntry.list.cancel({
				projectId: deleteInput.projectId,
				projectIndexTypeId: deleteInput.projectIndexTypeId,
			});

			const previous = utils.indexEntry.list.getData({
				projectId: deleteInput.projectId,
				projectIndexTypeId: deleteInput.projectIndexTypeId,
			});

			// Immediately remove from cache (soft delete)
			utils.indexEntry.list.setData(
				{
					projectId: deleteInput.projectId,
					projectIndexTypeId: deleteInput.projectIndexTypeId,
				},
				(old) => (old || []).filter((e) => e.id !== deleteInput.id),
			);

			return { previous };
		},

		onError: (err, deleteInput, context) => {
			if (context?.previous) {
				utils.indexEntry.list.setData(
					{
						projectId: deleteInput.projectId,
						projectIndexTypeId: deleteInput.projectIndexTypeId,
					},
					context.previous,
				);
			}

			toast.error(`Failed to delete entry: ${err.message}`);
		},

		onSuccess: () => {
			toast.success("Entry deleted");
		},

		onSettled: (_data, _err, variables) => {
			utils.indexEntry.list.invalidate({
				projectId: variables.projectId,
				projectIndexTypeId: variables.projectIndexTypeId,
			});
		},
	});
};
