"use client";

import { toast } from "sonner";
import { trpc } from "@/app/_common/_utils/trpc";

type UseApproveEntryInput = {
	projectId: string;
	projectIndexTypeId?: string;
};

export const useApproveEntry = ({
	projectId,
	projectIndexTypeId,
}: UseApproveEntryInput) => {
	const utils = trpc.useUtils();

	return trpc.indexEntry.approve.useMutation({
		onMutate: async (approveInput) => {
			// Cancel outgoing refetches
			await utils.indexEntry.list.cancel({ projectId, projectIndexTypeId });

			// Snapshot the previous value
			const previous = utils.indexEntry.list.getData({
				projectId,
				projectIndexTypeId,
			});

			// Optimistically update to "active" status
			utils.indexEntry.list.setData({ projectId, projectIndexTypeId }, (old) =>
				(old || []).map((entry) =>
					entry.id === approveInput.id ? { ...entry, status: "active" } : entry,
				),
			);

			return { previous };
		},

		onError: (err, _approveInput, context) => {
			// Rollback on error
			if (context?.previous) {
				utils.indexEntry.list.setData(
					{ projectId, projectIndexTypeId },
					context.previous,
				);
			}
			toast.error(`Failed to approve entry: ${err.message}`);
		},

		onSuccess: () => {
			toast.success("Entry approved");
		},

		onSettled: () => {
			// Refetch to ensure consistency
			utils.indexEntry.list.invalidate({ projectId, projectIndexTypeId });
			utils.indexEntry.getIndexView.invalidate();
		},
	});
};
