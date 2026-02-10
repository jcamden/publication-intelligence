import { useEffect, useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/app/_common/_utils/trpc";

export const useNetworkStatus = () => {
	const [isOnline, setIsOnline] = useState(
		typeof navigator !== "undefined" ? navigator.onLine : true,
	);
	const [wasOffline, setWasOffline] = useState(false);

	const utils = trpc.useUtils();

	useEffect(() => {
		const handleOnline = () => {
			setIsOnline(true);

			if (wasOffline) {
				toast.success("Connection restored");
				utils.invalidate();
				setWasOffline(false);
			}
		};

		const handleOffline = () => {
			setIsOnline(false);
			setWasOffline(true);
			toast.warning("No internet connection", {
				duration: Infinity,
				id: "offline-warning",
			});
		};

		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);

		return () => {
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);
		};
	}, [wasOffline, utils]);

	return { isOnline, wasOffline };
};
