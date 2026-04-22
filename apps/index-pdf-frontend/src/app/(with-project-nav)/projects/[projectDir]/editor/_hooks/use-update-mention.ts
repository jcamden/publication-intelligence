import { toast } from "sonner";
import { trpc } from "@/app/_common/_trpc/client";

export const useUpdateMention = () => {
	const utils = trpc.useUtils();

	return trpc.indexMention.update.useMutation({
		onMutate: async (update) => {
			await utils.indexMention.listForPage.cancel({
				projectId: update.projectId,
				documentId: update.documentId,
				pageNumber: update.pageNumber,
			});

			const previous = utils.indexMention.listForPage.getData({
				projectId: update.projectId,
				documentId: update.documentId,
				pageNumber: update.pageNumber,
			});

			// Optimistically update
			utils.indexMention.listForPage.setData(
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
				utils.indexMention.listForPage.setData(
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
			utils.indexMention.listForPage.invalidate({
				projectId: variables.projectId,
				documentId: variables.documentId,
				pageNumber: variables.pageNumber,
			});
			utils.indexMention.countsByEntry.invalidate();
			utils.indexEntry.getIndexView.invalidate();
		},
	});
};
