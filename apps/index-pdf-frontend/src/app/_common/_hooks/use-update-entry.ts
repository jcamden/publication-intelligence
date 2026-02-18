import { toast } from "sonner";
import { trpc } from "@/app/_common/_utils/trpc";

export const useUpdateEntry = () => {
	const utils = trpc.useUtils();

	return trpc.indexEntry.update.useMutation({
		onMutate: async (update) => {
			// Cancel queries for this project + index type
			await utils.indexEntry.list.cancel({
				projectId: update.projectId,
				projectIndexTypeId: update.projectIndexTypeId,
			});

			const previous = utils.indexEntry.list.getData({
				projectId: update.projectId,
				projectIndexTypeId: update.projectIndexTypeId,
			});

			// Optimistically update
			utils.indexEntry.list.setData(
				{
					projectId: update.projectId,
					projectIndexTypeId: update.projectIndexTypeId,
				},
				(old) =>
					(old || []).map((e) =>
						e.id === update.id
							? {
									...e,
									label: update.label ?? e.label,
								}
							: e,
					),
			);

			return { previous };
		},

		onError: (err, update, context) => {
			if (context?.previous) {
				utils.indexEntry.list.setData(
					{
						projectId: update.projectId,
						projectIndexTypeId: update.projectIndexTypeId,
					},
					context.previous,
				);
			}

			toast.error(`Failed to update entry: ${err.message}`);
		},

		onSuccess: (data) => {
			toast.success(`Entry updated: "${data.label}"`);
		},

		onSettled: (_data, _err, variables) => {
			utils.indexEntry.list.invalidate({
				projectId: variables.projectId,
				projectIndexTypeId: variables.projectIndexTypeId,
			});
		},
	});
};
