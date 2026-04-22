import { toast } from "sonner";
import { trpc } from "@/app/_common/_trpc/client";

/**
 * Custom hook for creating IndexMentions with optimistic updates.
 *
 * @param projectId - Required for cache invalidation (projectId is derived from documentId on backend)
 *
 * @example
 * const createMention = useCreateMention({ projectId: currentProject.id });
 * createMention.mutate({
 *   entryId: "...",
 *   documentId: "...",
 *   pageNumber: 1,
 *   // ... other CreateIndexMentionInput fields
 * });
 */
export const useCreateMention = ({ projectId }: { projectId: string }) => {
	const utils = trpc.useUtils();

	return trpc.indexMention.create.useMutation({
		onMutate: async (newMention) => {
			const queryParams = {
				projectId,
				documentId: newMention.documentId,
				pageNumber: newMention.pageNumber,
			};

			await utils.indexMention.listForPage.cancel(queryParams);

			const previous = utils.indexMention.listForPage.getData(queryParams);

			// Optimistically add mention
			utils.indexMention.listForPage.setData(queryParams, (old) => [
				...(old || []),
				{
					id: `temp-${Date.now()}`,
					entryId: newMention.entryId,
					pageNumber: newMention.pageNumber,
					textSpan: newMention.textSpan,
					bboxes: newMention.bboxesPdf,
					mentionType: newMention.mentionType || "text",
					pageSublocation: null,
					indexTypes: [],
					detectionRunId: null,
					createdAt: new Date().toISOString(),
				},
			]);

			return { previous, queryParams };
		},

		onError: (err, _newMention, context) => {
			if (context?.previous && context?.queryParams) {
				utils.indexMention.listForPage.setData(
					context.queryParams,
					context.previous,
				);
			}

			toast.error(`Failed to create mention: ${err.message}`);
		},

		onSuccess: () => {
			toast.success("Mention created");
		},

		onSettled: (_data, _err, _variables, context) => {
			if (context?.queryParams) {
				utils.indexMention.listForPage.invalidate(context.queryParams);
			}
			utils.indexMention.countsByEntry.invalidate();
			utils.indexEntry.getIndexView.invalidate();
		},
	});
};
