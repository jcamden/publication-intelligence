import { toast } from "sonner";
import { trpc } from "@/app/_common/_utils/trpc";

/**
 * Custom hook for bulk updating IndexMention index types with optimistic updates.
 * Supports three operations: add, replace, or remove index types.
 *
 * Requires projectId and documentId wrapper for cache invalidation.
 *
 * @example
 * const bulkUpdate = useBulkUpdateIndexTypes({ projectId: "...", documentId: "..." });
 * bulkUpdate.mutate({
 *   mentionIds: ["uuid1", "uuid2"],
 *   projectIndexTypeIds: ["type-uuid1"],
 *   operation: "add", // or "replace" or "remove"
 * });
 */
export const useBulkUpdateIndexTypes = ({
	projectId,
	documentId,
}: {
	projectId: string;
	documentId: string;
}) => {
	const utils = trpc.useUtils();

	return trpc.indexMention.updateIndexTypes.useMutation({
		onMutate: async (input) => {
			// Find all mentions to determine affected pages
			const allMentions = utils.indexMention.list.getData({
				projectId,
				documentId,
			});

			const affectedMentions = allMentions?.filter((m) =>
				input.mentionIds.includes(m.id),
			);

			if (!affectedMentions || affectedMentions.length === 0) {
				return { previous: null, affectedPages: [] };
			}

			// Get unique page numbers
			const affectedPages = [
				...new Set(affectedMentions.map((m) => m.pageNumber)),
			];

			// Cancel queries for all affected pages
			for (const pageNumber of affectedPages) {
				await utils.indexMention.list.cancel({
					projectId,
					documentId,
					pageNumber: pageNumber ?? undefined,
				});
			}

			// Snapshot state for each page
			const previousByPage = new Map();
			for (const pageNumber of affectedPages) {
				previousByPage.set(
					pageNumber,
					utils.indexMention.list.getData({
						projectId,
						documentId,
						pageNumber: pageNumber ?? undefined,
					}),
				);
			}

			// Optimistically update all affected pages
			for (const pageNumber of affectedPages) {
				utils.indexMention.list.setData(
					{
						projectId,
						documentId,
						pageNumber: pageNumber ?? undefined,
					},
					(old) =>
						(old || []).map((m) => {
							if (!input.mentionIds.includes(m.id)) return m;

							// Apply operation
							let newTypeIds: {
								projectIndexTypeId: string;
								indexType: string;
								colorHue: number;
							}[];
							if (input.operation === "replace") {
								newTypeIds = input.projectIndexTypeIds.map((id) => ({
									projectIndexTypeId: id,
									indexType: "",
									colorHue: 0,
								}));
							} else if (input.operation === "add") {
								const existingIds = new Set(
									m.indexTypes.map((t) => t.projectIndexTypeId),
								);
								const newIds = input.projectIndexTypeIds.filter(
									(id) => !existingIds.has(id),
								);
								newTypeIds = [
									...m.indexTypes,
									...newIds.map((id) => ({
										projectIndexTypeId: id,
										indexType: "",
										colorHue: 0,
									})),
								];
							} else {
								// remove
								const idsToRemove = new Set(input.projectIndexTypeIds);
								newTypeIds = m.indexTypes.filter(
									(t) => !idsToRemove.has(t.projectIndexTypeId),
								);
							}

							return { ...m, indexTypes: newTypeIds };
						}),
				);
			}

			return {
				previousByPage,
				affectedPages,
			};
		},

		onError: (err, _input, context) => {
			// Rollback all affected pages
			if (context?.previousByPage && context?.affectedPages) {
				for (const pageNumber of context.affectedPages) {
					const previous = context.previousByPage.get(pageNumber);
					if (previous) {
						utils.indexMention.list.setData(
							{
								projectId,
								documentId,
								pageNumber: pageNumber ?? undefined,
							},
							previous,
						);
					}
				}
			}

			toast.error(`Failed to update mention types: ${err.message}`);
		},

		onSuccess: (data) => {
			toast.success(`Updated ${data.length} mention(s)`);
		},

		onSettled: (_data, _err, _input, context) => {
			// Invalidate all affected pages
			if (context?.affectedPages) {
				for (const pageNumber of context.affectedPages) {
					utils.indexMention.list.invalidate({
						projectId,
						documentId,
						pageNumber: pageNumber ?? undefined,
					});
				}
			}
		},
	});
};
