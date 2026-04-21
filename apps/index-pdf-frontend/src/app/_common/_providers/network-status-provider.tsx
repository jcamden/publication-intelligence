"use client";

import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useRef,
	useSyncExternalStore,
} from "react";
import { toast } from "sonner";
import { trpc } from "@/app/_common/_trpc/client";

type NetworkStatusContextValue = {
	isOnline: boolean;
};

const NetworkStatusContext = createContext<
	NetworkStatusContextValue | undefined
>(undefined);

const subscribe = (onStoreChange: () => void) => {
	window.addEventListener("online", onStoreChange);
	window.addEventListener("offline", onStoreChange);
	return () => {
		window.removeEventListener("online", onStoreChange);
		window.removeEventListener("offline", onStoreChange);
	};
};

const getClientSnapshot = () => navigator.onLine;

const getServerSnapshot = () => true;

export const NetworkStatusProvider = ({
	children,
}: {
	children: ReactNode;
}) => {
	const isOnline = useSyncExternalStore(
		subscribe,
		getClientSnapshot,
		getServerSnapshot,
	);

	const utils = trpc.useUtils();
	const utilsRef = useRef(utils);
	utilsRef.current = utils;

	const wasOfflineRef = useRef(false);

	useEffect(() => {
		if (!isOnline) {
			wasOfflineRef.current = true;
			return;
		}

		if (!wasOfflineRef.current) return;

		wasOfflineRef.current = false;
		toast.success("Connection restored");
		void utilsRef.current.invalidate();
	}, [isOnline]);

	return (
		<NetworkStatusContext.Provider value={{ isOnline }}>
			{children}
		</NetworkStatusContext.Provider>
	);
};

export const useNetworkStatus = () => {
	const ctx = useContext(NetworkStatusContext);
	if (ctx === undefined) {
		throw new Error(
			"useNetworkStatus must be used within NetworkStatusProvider",
		);
	}
	return ctx;
};
