export const useAuthToken = () => ({
	authToken: null,
	saveToken: (token: string) => {
		console.log("[Mock Auth] saveToken:", token);
		if (typeof window !== "undefined") {
			localStorage.setItem("gel_auth_token", token);
		}
	},
	clearToken: () => {
		console.log("[Mock Auth] clearToken");
		if (typeof window !== "undefined") {
			localStorage.removeItem("gel_auth_token");
		}
	},
	isLoading: false,
	isAuthenticated: false,
});
