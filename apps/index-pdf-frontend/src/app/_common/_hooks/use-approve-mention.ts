"use client";

import { toast } from "sonner";
import { trpc } from "@/app/_common/_utils/trpc";

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
			// Cancel all potentially affected queries
			await utils.indexMention.list.cancel();

			// Update the main editor cache (projectId + documentId only)
			const editorCacheKey = { projectId, documentId };
			const previousEditor = utils.indexMention.list.getData(editorCacheKey);

			utils.indexMention.list.setData(editorCacheKey, (old) =>
				(old || []).map((mention) =>
					mention.id === approveInput.id
						? { ...mention, detectionRunId: null }
						: mention,
				),
			);

			// Also update page-specific cache if pageNumber is provided
			let previousPage: typeof previousEditor;
			if (pageNumber !== undefined) {
				const pageCacheKey = { projectId, documentId, pageNumber };
				previousPage = utils.indexMention.list.getData(pageCacheKey);

				utils.indexMention.list.setData(pageCacheKey, (old) =>
					(old || []).map((mention) =>
						mention.id === approveInput.id
							? { ...mention, detectionRunId: null }
							: mention,
					),
				);
			}

			return { previousEditor, previousPage };
		},

		onError: (err, _approveInput, context) => {
			// Rollback on error
			if (context?.previousEditor) {
				utils.indexMention.list.setData(
					{ projectId, documentId },
					context.previousEditor,
				);
			}
			if (context?.previousPage && pageNumber !== undefined) {
				utils.indexMention.list.setData(
					{ projectId, documentId, pageNumber },
					context.previousPage,
				);
			}
			toast.error(`Failed to approve mention: ${err.message}`);
		},

		onSuccess: () => {
			toast.success("Mention approved");
		},

		onSettled: () => {
			// Invalidate all mention queries for this project to ensure consistency
			utils.indexMention.list.invalidate({ projectId });
		},
	});
};
