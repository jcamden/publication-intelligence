"use client";

import { Banner } from "@pubint/yabasic/components/ui/banner";
import { useNetworkStatus } from "@/app/_common/_hooks/use-network-status";

export const OfflineBanner = () => {
	const { isOnline } = useNetworkStatus();

	if (isOnline) return null;

	return (
		<Banner variant="warning" className="sticky top-0 z-50">
			You're offline. Changes will be saved when connection is restored.
		</Banner>
	);
};
