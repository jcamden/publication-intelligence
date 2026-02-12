import { toast } from "sonner";
import { trpc } from "@/app/_common/_utils/trpc";

/**
 * Custom hook for enabling a ProjectIndexType with optimistic updates.
 * Handles addon access errors with user-friendly messaging.
 *
 * @example
 * const enableType = useEnableIndexType();
 * enableType.mutate({
 *   projectId: "...",
 *   indexType: "subject",
 *   colorHue: 220,
 * });
 */
export const useEnableIndexType = () => {
	const utils = trpc.useUtils();

	return trpc.projectIndexType.enable.useMutation({
		onMutate: async (input) => {
			await utils.projectIndexType.list.cancel({ projectId: input.projectId });

			const previous = utils.projectIndexType.list.getData({
				projectId: input.projectId,
			});

			// Optimistically add to list
			const isIndexType = ["subject", "author", "scripture"].includes(
				input.highlightType,
			);
			const optimisticItem = {
				id: `temp-${Date.now()}`,
				highlightType: input.highlightType,
				indexType: isIndexType
					? (input.highlightType as "subject" | "author" | "scripture")
					: ("subject" as const),
				displayName:
					input.highlightType.charAt(0).toUpperCase() +
					input.highlightType.slice(1),
				colorHue: input.colorHue,
				visible: true,
				entry_count: 0,
			};

			utils.projectIndexType.list.setData(
				{ projectId: input.projectId },
				(old) => [...(old || []), optimisticItem],
			);

			return { previous };
		},

		onError: (err, input, context) => {
			if (context?.previous) {
				utils.projectIndexType.list.setData(
					{ projectId: input.projectId },
					context.previous,
				);
			}

			// User-friendly addon error
			let errorMessage = "Failed to enable index type";
			if (err.message.includes("addon") || err.message.includes("access")) {
				errorMessage = "You need to purchase this index type addon first";
			}

			toast.error(errorMessage);
		},

		onSuccess: () => {
			toast.success("Index type enabled");
		},

		onSettled: (_data, _err, variables) => {
			utils.projectIndexType.list.invalidate({
				projectId: variables.projectId,
			});
			// Also invalidate available types
			utils.projectIndexType.listAvailable.invalidate({
				projectId: variables.projectId,
			});
		},
	});
};
