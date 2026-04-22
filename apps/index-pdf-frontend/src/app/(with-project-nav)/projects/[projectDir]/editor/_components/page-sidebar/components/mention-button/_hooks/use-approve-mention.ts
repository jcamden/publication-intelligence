"use client";

import { toast } from "sonner";
import { trpc } from "@/app/_common/_trpc/client";

type UseApproveMentionInput = {
	projectId: string;
	documentId?: string;
	pageNumber?: number;
};

export const useApproveMention = ({
	projectId,
	documentId,
	pageNumber,
}: UseApproveMentionInput) => {
	const utils = trpc.useUtils();

	return trpc.indexMention.approve.useMutation({
		onMutate: async (approveInput) => {
			await utils.indexMention.listForPage.cancel();

			let previousPage: unknown;
			if (documentId && pageNumber !== undefined) {
				const pageCacheKey = { projectId, documentId, pageNumber };
				previousPage = utils.indexMention.listForPage.getData(pageCacheKey);

				utils.indexMention.listForPage.setData(pageCacheKey, (old) =>
					(old || []).map((mention) =>
						mention.id === approveInput.id
							? { ...mention, detectionRunId: null }
							: mention,
					),
				);
			}

			return { previousPage };
		},

		onError: (err, _approveInput, context) => {
			// Rollback on error
			if (
				context?.previousPage &&
				documentId &&
				pageNumber !== undefined &&
				pageNumber >= 1
			) {
				utils.indexMention.listForPage.setData(
					{ projectId, documentId, pageNumber },
					context.previousPage as never,
				);
			}
			toast.error(`Failed to approve mention: ${err.message}`);
		},

		onSuccess: () => {
			toast.success("Mention approved");
		},

		onSettled: () => {
			if (documentId && pageNumber !== undefined && pageNumber >= 1) {
				utils.indexMention.listForPage.invalidate({
					projectId,
					documentId,
					pageNumber,
				});
			}
			utils.indexMention.countsByEntry.invalidate();
			utils.indexEntry.getIndexView.invalidate();
		},
	});
};
