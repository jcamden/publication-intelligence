"use client";

import { useEffect, useState } from "react";

/**
 * Hook to detect when client-side hydration is complete
 *
 * Returns false during SSR and initial render, true after hydration.
 * Use this to prevent hydration mismatches when using localStorage or other
 * browser-only APIs.
 */
export const useHydrated = () => {
	const [hydrated, setHydrated] = useState(false);

	useEffect(() => {
		setHydrated(true);
	}, []);

	return hydrated;
};
