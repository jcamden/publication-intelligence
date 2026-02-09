import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { ReactNode } from "react";
import React from "react";
import { API_URL } from "../../_config/api";
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
			url: `${API_URL}/trpc`,
			fetch: async (url) => {
				// Parse the URL to determine which endpoint is being called
				const urlString = typeof url === "string" ? url : url.toString();

				// tRPC batching: Check if this is a batch request
				if (urlString.includes("batch=1")) {
					// For batch requests, decode the input parameter to see all queries
					const urlObj = new URL(urlString);
					const batchInput = urlObj.searchParams.get("input");

					if (batchInput) {
						try {
							const inputs = JSON.parse(batchInput);
							const results: Record<string, unknown> = {};

							// Process each batched query
							Object.keys(inputs).forEach((key) => {
								if (key.includes("projectIndexType.listUserAddons")) {
									results[key] = {
										result: {
											data: ["subject", "author", "scripture"],
										},
									};
								} else if (key.includes("projectIndexType.list")) {
									results[key] = {
										result: {
											data: [
												{
													id: "mock-pit-subject-id",
													colorHue: 230,
													visible: true,
													indexType: "subject",
													displayName: "Subject Index",
													description:
														"Topical index of key concepts, themes, and subjects",
													entry_count: 0,
												},
												{
													id: "mock-pit-author-id",
													colorHue: 270,
													visible: true,
													indexType: "author",
													displayName: "Author Index",
													description: "Index of cited authors and their works",
													entry_count: 0,
												},
												{
													id: "mock-pit-scripture-id",
													colorHue: 160,
													visible: true,
													indexType: "scripture",
													displayName: "Scripture Index",
													description:
														"Biblical and scriptural reference index",
													entry_count: 0,
												},
											],
										},
									};
								}
							});

							return new Response(JSON.stringify(results), {
								headers: { "Content-Type": "application/json" },
							});
						} catch (_e) {
							// Fall through to default handling
						}
					}
				}

				// Single query handling (non-batched)
				if (urlString.includes("projectIndexType.listUserAddons")) {
					return new Response(
						JSON.stringify({
							result: {
								data: ["subject", "author", "scripture"],
							},
						}),
						{
							headers: { "Content-Type": "application/json" },
						},
					);
				}

				if (urlString.includes("projectIndexType.list")) {
					return new Response(
						JSON.stringify({
							result: {
								data: [
									{
										id: "mock-pit-subject-id",
										colorHue: 230,
										visible: true,
										indexType: "subject",
										displayName: "Subject Index",
										description:
											"Topical index of key concepts, themes, and subjects",
										entry_count: 0,
									},
									{
										id: "mock-pit-author-id",
										colorHue: 270,
										visible: true,
										indexType: "author",
										displayName: "Author Index",
										description: "Index of cited authors and their works",
										entry_count: 0,
									},
									{
										id: "mock-pit-scripture-id",
										colorHue: 160,
										visible: true,
										indexType: "scripture",
										displayName: "Scripture Index",
										description: "Biblical and scriptural reference index",
										entry_count: 0,
									},
								],
							},
						}),
						{
							headers: { "Content-Type": "application/json" },
						},
					);
				}

				// Default mock response for other endpoints
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
