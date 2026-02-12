import { useEffect, useRef } from "react";
import { trpc } from "@/app/_common/_utils/trpc";

type HighlightType =
	| "subject"
	| "author"
	| "scripture"
	| "exclude"
	| "page_number";

type UsePersistColorChangeParams = {
	projectId: string | undefined;
	highlightType: HighlightType;
	colorHue: number;
	enabled?: boolean;
};

/**
 * Hook to debounce and persist color changes to the database
 *
 * Debounces color changes by 500ms before sending to backend
 * Works for both index types and region types
 */
export const usePersistColorChange = ({
	projectId,
	highlightType,
	colorHue,
	enabled = true,
}: UsePersistColorChangeParams) => {
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);
	const previousHueRef = useRef<number | null>(null);

	// Query to get the project highlight config ID for this highlight type
	const projectConfigsQuery = trpc.projectIndexType.list.useQuery(
		{ projectId: projectId ?? "" },
		{ enabled: !!projectId && enabled },
	);

	// Mutation to update color
	const updateColorMutation = trpc.projectIndexType.update.useMutation();

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
			const config = projectConfigsQuery.data?.find(
				(pit) => pit.indexType === highlightType,
			);

			if (config) {
				updateColorMutation.mutate({
					id: config.id,
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
	}, [colorHue, enabled, projectId, highlightType, projectConfigsQuery.data]);

	return {
		isPersisting: updateColorMutation.isPending,
	};
};
