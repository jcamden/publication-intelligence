import { toast } from "sonner";
import { trpc } from "@/app/_common/_utils/trpc";

export const useDeleteMention = () => {
	const utils = trpc.useUtils();

	return trpc.indexMention.delete.useMutation({
		onMutate: async (deleteInput) => {
			await utils.indexMention.list.cancel({
				projectId: deleteInput.projectId,
				documentId: deleteInput.documentId,
				pageNumber: deleteInput.pageNumber,
			});

			const previous = utils.indexMention.list.getData({
				projectId: deleteInput.projectId,
				documentId: deleteInput.documentId,
				pageNumber: deleteInput.pageNumber,
			});

			// Immediately remove (soft delete)
			utils.indexMention.list.setData(
				{
					projectId: deleteInput.projectId,
					documentId: deleteInput.documentId,
					pageNumber: deleteInput.pageNumber,
				},
				(old) => (old || []).filter((m) => m.id !== deleteInput.id),
			);

			return { previous };
		},

		onError: (err, deleteInput, context) => {
			if (context?.previous) {
				utils.indexMention.list.setData(
					{
						projectId: deleteInput.projectId,
						documentId: deleteInput.documentId,
						pageNumber: deleteInput.pageNumber,
					},
					context.previous,
				);
			}

			toast.error(`Failed to delete mention: ${err.message}`);
		},

		onSuccess: () => {
			toast.success("Mention deleted");
		},

		onSettled: (_data, _err, variables) => {
			utils.indexMention.list.invalidate({
				projectId: variables.projectId,
				documentId: variables.documentId,
				pageNumber: variables.pageNumber,
			});
			utils.indexEntry.getIndexView.invalidate();
		},
	});
};
