import { toast } from "sonner";
import { trpc } from "@/app/_common/_utils/trpc";
import type { IndexMentionListItem } from "@/app/_common/_utils/trpc-types";

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
			};

			await utils.indexMention.list.cancel(queryParams);

			const previous = utils.indexMention.list.getData(queryParams);

			// Optimistically add mention
			utils.indexMention.list.setData(queryParams, (old) => [
				...(old || []),
				{
					id: `temp-${Date.now()}`,
					entryId: newMention.entryId,
					pageNumber: newMention.pageNumber,
					textSpan: newMention.textSpan,
					bboxes: newMention.bboxesPdf,
					mentionType: newMention.mentionType || "text",
					pageSublocation: null,
					entry: {
						id: newMention.entryId,
						label: "",
					},
					indexTypes: [],
					detectionRunId: null,
					createdAt: new Date().toISOString(),
				} satisfies IndexMentionListItem,
			]);

			return { previous, queryParams };
		},

		onError: (err, _newMention, context) => {
			if (context?.previous && context?.queryParams) {
				utils.indexMention.list.setData(context.queryParams, context.previous);
			}

			toast.error(`Failed to create mention: ${err.message}`);
		},

		onSuccess: () => {
			toast.success("Mention created");
		},

		onSettled: (_data, _err, _variables, context) => {
			if (context?.queryParams) {
				utils.indexMention.list.invalidate(context.queryParams);
			}
			utils.indexEntry.getIndexView.invalidate();
		},
	});
};
