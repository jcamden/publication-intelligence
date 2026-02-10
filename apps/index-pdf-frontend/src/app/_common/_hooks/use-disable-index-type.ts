import { toast } from "sonner";
import { trpc } from "@/app/_common/_utils/trpc";

/**
 * Custom hook for disabling a ProjectIndexType with optimistic updates.
 * Soft deletes the index type from the project.
 *
 * Requires projectId wrapper for cache invalidation.
 *
 * @example
 * const disableType = useDisableIndexType({ projectId: "..." });
 * disableType.mutate({
 *   id: "project-index-type-uuid",
 * });
 */
export const useDisableIndexType = ({ projectId }: { projectId: string }) => {
	const utils = trpc.useUtils();

	return trpc.projectIndexType.disable.useMutation({
		onMutate: async (input) => {
			await utils.projectIndexType.list.cancel({ projectId });

			const previous = utils.projectIndexType.list.getData({
				projectId,
			});

			// Immediately remove from list (soft delete)
			utils.projectIndexType.list.setData({ projectId }, (old) =>
				(old || []).filter((t) => t.id !== input.id),
			);

			return { previous };
		},

		onError: (err, _input, context) => {
			if (context?.previous) {
				utils.projectIndexType.list.setData({ projectId }, context.previous);
			}

			toast.error(`Failed to disable index type: ${err.message}`);
		},

		onSuccess: () => {
			toast.success("Index type disabled");
		},

		onSettled: () => {
			utils.projectIndexType.list.invalidate({ projectId });
			utils.projectIndexType.listAvailable.invalidate({
				projectId,
			});
		},
	});
};
