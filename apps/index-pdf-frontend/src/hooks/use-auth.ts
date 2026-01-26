"use client";

import { useEffect, useState } from "react";
import { logEvent } from "../lib/logger";

const AUTH_TOKEN_KEY = "gel_auth_token";

export const useAuthToken = () => {
	const [authToken, setAuthToken] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
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
	}, []);

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

	return {
		authToken,
		saveToken,
		clearToken,
		isLoading,
		isAuthenticated: !!authToken,
	};
};
