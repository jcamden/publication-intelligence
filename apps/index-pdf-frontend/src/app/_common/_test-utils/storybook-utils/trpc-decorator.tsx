import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { ReactNode } from "react";
import React from "react";
import { trpc } from "../../_utils/trpc";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: false,
		},
		mutations: {
			retry: false,
		},
	},
});

// Mock Next.js router for Storybook
const mockRouter: AppRouterInstance = {
	push: (href: string) => {
		console.log("[Mock Router] Navigating to:", href);
		return Promise.resolve(true);
	},
	replace: (href: string) => {
		console.log("[Mock Router] Replacing with:", href);
		return Promise.resolve(true);
	},
	refresh: () => {
		console.log("[Mock Router] Refresh");
	},
	back: () => {
		console.log("[Mock Router] Back");
	},
	forward: () => {
		console.log("[Mock Router] Forward");
	},
	prefetch: (href: string) => {
		console.log("[Mock Router] Prefetch:", href);
		return Promise.resolve();
	},
} as AppRouterInstance;

// Mock tRPC client that doesn't actually make network requests
const mockTrpcClient = trpc.createClient({
	links: [
		httpLink({
			url: "http://localhost:3001/trpc",
			fetch: async () => {
				// Return a mock response
				return new Response(
					JSON.stringify({
						result: {
							data: {
								authToken: "mock-token",
								message: "Mock operation successful",
								success: true,
							},
						},
					}),
					{
						headers: { "Content-Type": "application/json" },
					},
				);
			},
		}),
	],
});

// Mock useAuthToken hook inline
const MockAuthProvider = ({ children }: { children: ReactNode }) => {
	// Override the useAuthToken import
	React.useEffect(() => {
		// Store mock in global for the useAuthToken hook to use
		if (typeof window !== "undefined") {
			// @ts-expect-error - Mock for Storybook
			window.__mockUseAuthToken = () => ({
				authToken: "mock-auth-token",
				saveToken: (token: string) => {
					console.log("[Mock Auth] Token saved:", token);
				},
				clearToken: () => {
					console.log("[Mock Auth] Token cleared");
				},
				isLoading: false,
				isAuthenticated: true,
			});
		}
	}, []);

	return <>{children}</>;
};

export const TrpcDecorator = ({ children }: { children: ReactNode }) => {
	return (
		<AppRouterContext.Provider value={mockRouter}>
			<MockAuthProvider>
				<trpc.Provider client={mockTrpcClient} queryClient={queryClient}>
					<QueryClientProvider client={queryClient}>
						{children}
					</QueryClientProvider>
				</trpc.Provider>
			</MockAuthProvider>
		</AppRouterContext.Provider>
	);
};
