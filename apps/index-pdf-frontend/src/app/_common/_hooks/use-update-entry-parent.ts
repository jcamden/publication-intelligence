import { toast } from "sonner";
import { trpc } from "@/app/_common/_utils/trpc";

/**
 * Custom hook for updating IndexEntry parent (hierarchy management) with optimistic updates.
 * Handles drag-drop with user-friendly error messages for cycle detection and depth limits.
 *
 * Requires projectId wrapper for cache invalidation.
 *
 * @example
 * const updateParent = useUpdateEntryParent({ projectId: "..." });
 * updateParent.mutate({
 *   id: "entry-uuid",
 *   parentId: "parent-uuid", // or null/undefined to move to top level
 * });
 */
export const useUpdateEntryParent = ({ projectId }: { projectId: string }) => {
	const utils = trpc.useUtils();

	return trpc.indexEntry.updateParent.useMutation({
		onMutate: async (input) => {
			// Find entry to get projectIndexTypeId
			const entry = utils.indexEntry.list
				.getData({ projectId })
				?.find((e) => e.id === input.id);

			if (!entry) return { previous: null };

			await utils.indexEntry.list.cancel({
				projectId,
				projectIndexTypeId: entry.projectIndexTypeId,
			});

			const previous = utils.indexEntry.list.getData({
				projectId,
				projectIndexTypeId: entry.projectIndexTypeId,
			});

			// Optimistically update parent
			utils.indexEntry.list.setData(
				{
					projectId,
					projectIndexTypeId: entry.projectIndexTypeId,
				},
				(old) =>
					(old || []).map((e) =>
						e.id === input.id
							? {
									...e,
									parentId: input.parentId || null,
									parent: input.parentId
										? old?.find((p) => p.id === input.parentId) || null
										: null,
								}
							: e,
					),
			);

			return { previous, projectIndexTypeId: entry.projectIndexTypeId };
		},

		onError: (err, _input, context) => {
			// Rollback
			if (context?.previous && context?.projectIndexTypeId) {
				utils.indexEntry.list.setData(
					{
						projectId,
						projectIndexTypeId: context.projectIndexTypeId,
					},
					context.previous,
				);
			}

			// User-friendly error messages for validation failures
			let errorMessage = "Failed to move entry";

			if (err.message.includes("cycle")) {
				errorMessage = "Cannot move entry: Would create a circular hierarchy";
			} else if (err.message.includes("depth")) {
				errorMessage =
					"Cannot move entry: Maximum hierarchy depth (5 levels) exceeded";
			} else if (err.message.includes("index type")) {
				errorMessage =
					"Cannot move entry: Parent must be in the same index type";
			}

			toast.error(errorMessage);
		},

		onSuccess: () => {
			toast.success("Entry moved");
		},

		onSettled: (_data, _err, _input, context) => {
			if (context?.projectIndexTypeId) {
				utils.indexEntry.list.invalidate({
					projectId,
					projectIndexTypeId: context.projectIndexTypeId,
				});
			}
		},
	});
};
