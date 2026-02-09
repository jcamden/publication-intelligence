import { useEffect, useRef } from "react";
import { trpc } from "@/app/_common/_utils/trpc";

type UsePersistColorChangeParams = {
	projectId: string | undefined;
	indexType: string;
	colorHue: number;
	enabled?: boolean;
};

/**
 * Hook to debounce and persist color changes to the database
 *
 * Debounces color changes by 500ms before sending to backend
 */
export const usePersistColorChange = ({
	projectId,
	indexType,
	colorHue,
	enabled = true,
}: UsePersistColorChangeParams) => {
	const utils = trpc.useUtils();
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);
	const previousHueRef = useRef<number | null>(null);

	// Query to get the projectIndexType ID for this index type
	const projectIndexTypesQuery = trpc.projectIndexType.list.useQuery(
		{ projectId: projectId ?? "" },
		{ enabled: !!projectId && enabled },
	);

	// Mutation to update color
	const updateColorMutation = trpc.projectIndexType.update.useMutation({
		onSuccess: () => {
			// Refetch to ensure UI is in sync
			utils.projectIndexType.list.invalidate({ projectId: projectId ?? "" });
		},
	});

	// Debounce effect
	// biome-ignore lint/correctness/useExhaustiveDependencies: updateColorMutation is intentionally omitted - it's recreated on every render and would reset the debounce timer
	useEffect(() => {
		if (!enabled || !projectId) return;
		if (colorHue === previousHueRef.current) return; // No change

		// Clear existing timeout
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
		}

		// Set new timeout
		timeoutRef.current = setTimeout(() => {
			const projectIndexType = projectIndexTypesQuery.data?.find(
				(pit) => pit.indexType === indexType,
			);

			if (projectIndexType) {
				updateColorMutation.mutate({
					id: projectIndexType.id,
					data: { colorHue },
				});
				previousHueRef.current = colorHue;
			}
		}, 500); // 500ms debounce

		// Cleanup
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, [colorHue, enabled, projectId, indexType, projectIndexTypesQuery.data]);

	return {
		isPersisting: updateColorMutation.isPending,
	};
};
