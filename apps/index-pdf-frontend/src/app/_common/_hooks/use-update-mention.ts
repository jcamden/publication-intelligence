import { toast } from "sonner";
import { trpc } from "@/app/_common/_utils/trpc";

export const useUpdateMention = () => {
	const utils = trpc.useUtils();

	return trpc.indexMention.update.useMutation({
		onMutate: async (update) => {
			await utils.indexMention.list.cancel({
				projectId: update.projectId,
				documentId: update.documentId,
				pageNumber: update.pageNumber,
			});

			const previous = utils.indexMention.list.getData({
				projectId: update.projectId,
				documentId: update.documentId,
				pageNumber: update.pageNumber,
			});

			// Optimistically update
			utils.indexMention.list.setData(
				{
					projectId: update.projectId,
					documentId: update.documentId,
					pageNumber: update.pageNumber,
				},
				(old) =>
					(old || []).map((m) =>
						m.id === update.id
							? {
									...m,
									entryId: update.entryId ?? m.entryId,
									textSpan: update.textSpan ?? m.textSpan,
								}
							: m,
					),
			);

			return { previous };
		},

		onError: (err, update, context) => {
			if (context?.previous) {
				utils.indexMention.list.setData(
					{
						projectId: update.projectId,
						documentId: update.documentId,
						pageNumber: update.pageNumber,
					},
					context.previous,
				);
			}

			toast.error(`Failed to update mention: ${err.message}`);
		},

		onSuccess: () => {
			toast.success("Mention updated");
		},

		onSettled: (_data, _err, variables) => {
			utils.indexMention.list.invalidate({
				projectId: variables.projectId,
				documentId: variables.documentId,
				pageNumber: variables.pageNumber,
			});
		},
	});
};
