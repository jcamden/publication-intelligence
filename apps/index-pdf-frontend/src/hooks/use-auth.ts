"use client";

import { useEffect, useState } from "react";

const AUTH_TOKEN_KEY = "gel_auth_token";

export const useAuthToken = () => {
	const [authToken, setAuthToken] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const token = localStorage.getItem(AUTH_TOKEN_KEY);
		setAuthToken(token);
		setIsLoading(false);
	}, []);

	const saveToken = (token: string) => {
		localStorage.setItem(AUTH_TOKEN_KEY, token);
		setAuthToken(token);
	};

	const clearToken = () => {
		localStorage.removeItem(AUTH_TOKEN_KEY);
		setAuthToken(null);
	};

	return {
		authToken,
		saveToken,
		clearToken,
		isLoading,
		isAuthenticated: !!authToken,
	};
};
