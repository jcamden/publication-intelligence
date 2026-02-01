"use client";

import { useEffect, useState } from "react";
import { useAuthToken } from "../../_common/_hooks/use-auth";

export const useAuthenticatedPdf = ({ url }: { url: string | null }) => {
	const { authToken } = useAuthToken();
	const [blobUrl, setBlobUrl] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!url || !authToken) {
			setBlobUrl(null);
			return;
		}

		let cancelled = false;
		let objectUrl: string | null = null;

		const fetchPdf = async () => {
			setIsLoading(true);
			setError(null);

			try {
				const response = await fetch(url, {
					headers: {
						Authorization: `Bearer ${authToken}`,
					},
				});

				if (!response.ok) {
					throw new Error(`Failed to fetch PDF: ${response.statusText}`);
				}

				const blob = await response.blob();

				if (cancelled) return;

				objectUrl = URL.createObjectURL(blob);
				setBlobUrl(objectUrl);
			} catch (err) {
				if (!cancelled) {
					setError(err instanceof Error ? err.message : "Failed to load PDF");
				}
			} finally {
				if (!cancelled) {
					setIsLoading(false);
				}
			}
		};

		fetchPdf();

		return () => {
			cancelled = true;
			if (objectUrl) {
				URL.revokeObjectURL(objectUrl);
			}
		};
	}, [url, authToken]);

	return { blobUrl, isLoading, error };
};
