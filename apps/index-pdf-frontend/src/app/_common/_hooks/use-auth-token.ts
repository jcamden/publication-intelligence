"use client";

import { useEffect, useState } from "react";
import { logEvent } from "../_lib/logger";

const AUTH_TOKEN_KEY = "gel_auth_token";

export const useAuthToken = () => {
	// Check for Storybook mock before initializing state
	const hasMock =
		typeof window !== "undefined" &&
		// @ts-expect-error - Storybook mock
		window.__mockUseAuthToken;

	// Always call hooks at top level (React rules)
	const [authToken, setAuthToken] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		// Skip if using mock
		if (hasMock) return;

		const token = localStorage.getItem(AUTH_TOKEN_KEY);
		setAuthToken(token);
		setIsLoading(false);

		if (token) {
			logEvent({
				event: "auth.token_restored",
				context: {
					metadata: { hasToken: true },
				},
			});
		}
	}, [hasMock]);

	const saveToken = (token: string) => {
		localStorage.setItem(AUTH_TOKEN_KEY, token);
		setAuthToken(token);

		logEvent({
			event: "auth.token_saved",
			context: {
				metadata: { tokenLength: token.length },
			},
		});
	};

	const clearToken = () => {
		localStorage.removeItem(AUTH_TOKEN_KEY);
		setAuthToken(null);

		logEvent({
			event: "auth.token_cleared",
			context: {},
		});
	};

	// Return mock if available, otherwise return real implementation
	if (hasMock) {
		// @ts-expect-error - Storybook mock
		return window.__mockUseAuthToken();
	}

	return {
		authToken,
		saveToken,
		clearToken,
		isLoading,
		isAuthenticated: !!authToken,
	};
};
