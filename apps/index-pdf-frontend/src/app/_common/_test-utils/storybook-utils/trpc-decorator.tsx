import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { ReactNode } from "react";
import React from "react";
import { API_URL } from "../../_config/api";
import { trpc } from "../../_utils/trpc";

type TrpcDecoratorConfig = {
	delayMs?: number;
};

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

// Create mock tRPC client with optional delay
const createMockTrpcClient = (config?: TrpcDecoratorConfig) =>
	trpc.createClient({
		links: [
			httpLink({
				url: `${API_URL}/trpc`,
				fetch: async (url, init) => {
					// Add delay if configured
					if (config?.delayMs) {
						await new Promise((resolve) => setTimeout(resolve, config.delayMs));
					}

					// Parse the URL to determine which endpoint is being called
					const urlString = typeof url === "string" ? url : url.toString();

					const getBodyJson = async (): Promise<unknown> => {
						if (init?.body == null) return null;
						const raw =
							typeof init.body === "string"
								? init.body
								: await new Response(init.body).text();
						try {
							return JSON.parse(raw);
						} catch {
							return null;
						}
					};

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
														description:
															"Index of cited authors and their works",
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
					if (urlString.includes("project.getById")) {
						// Extract project ID from URL params
						const urlObj = new URL(urlString);
						const input = urlObj.searchParams.get("input");
						let projectId = "mock-project-id";

						if (input) {
							try {
								const parsed = JSON.parse(input);
								projectId = parsed.id || projectId;
							} catch {
								// Use default
							}
						}

						return new Response(
							JSON.stringify({
								result: {
									data: {
										id: projectId,
										title: "Test Project Title",
										description: "Test project description",
										project_dir: "test-project",
										source_document:
											projectId === "project-with-doc"
												? {
														id: "mock-doc-id",
														filename: "test-document.pdf",
														upload_date: new Date().toISOString(),
													}
												: null,
										createdAt: new Date().toISOString(),
										updatedAt: new Date().toISOString(),
									},
								},
							}),
							{
								headers: { "Content-Type": "application/json" },
							},
						);
					}

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

					if (urlString.includes("indexEntry.list")) {
						return new Response(
							JSON.stringify({
								result: {
									data: [
										{
											id: "mock-entry-1",
											label: "Test Entry",
											slug: "test-entry",
											parentId: null,
											createdAt: new Date().toISOString(),
											updatedAt: new Date().toISOString(),
											variants: [{ text: "Test Alias" }],
											crossReferences: [],
										},
									],
								},
							}),
							{
								headers: { "Content-Type": "application/json" },
							},
						);
					}

					if (urlString.includes("indexMention.list")) {
						return new Response(
							JSON.stringify({
								result: {
									data: [
										{
											id: "mention-top-center",
											entryId: "mock-entry-1",
											pageNumber: 1,
											textSpan: "Should be top center",
											bboxes: [{ x: 150, y: 50, width: 100, height: 12 }],
											mentionType: "text",
											createdAt: new Date().toISOString(),
											entry: {
												id: "mock-entry-1",
												label: "Test Entry",
												slug: "test-entry",
											},
											indexTypes: [
												{
													id: "mock-pit-subject-id",
													colorHue: 230,
													indexType: "subject",
												},
											],
										},
										{
											id: "mention-bottom-center",
											entryId: "mock-entry-1",
											pageNumber: 1,
											textSpan: "Should be bottom center",
											bboxes: [{ x: 150, y: 750, width: 120, height: 12 }],
											mentionType: "text",
											createdAt: new Date().toISOString(),
											entry: {
												id: "mock-entry-1",
												label: "Test Entry",
												slug: "test-entry",
											},
											indexTypes: [
												{
													id: "mock-pit-subject-id",
													colorHue: 230,
													indexType: "subject",
												},
											],
										},
									],
								},
							}),
							{
								headers: { "Content-Type": "application/json" },
							},
						);
					}

					if (urlString.includes("region.list")) {
						return new Response(
							JSON.stringify({
								result: {
									data: [],
								},
							}),
							{
								headers: { "Content-Type": "application/json" },
							},
						);
					}

					if (urlString.includes("region.getForPage")) {
						return new Response(
							JSON.stringify({
								result: {
									data: [],
								},
							}),
							{
								headers: { "Content-Type": "application/json" },
							},
						);
					}

					if (urlString.includes("canonicalPageRule.list")) {
						return new Response(
							JSON.stringify({
								result: {
									data: [],
								},
							}),
							{
								headers: { "Content-Type": "application/json" },
							},
						);
					}

					// Mock query: indexEntry.list
					if (urlString.includes("indexEntry.list")) {
						return new Response(
							JSON.stringify({
								result: {
									data: [],
								},
							}),
							{
								headers: { "Content-Type": "application/json" },
							},
						);
					}

					// Mock mutation: indexEntry.create (input may be in POST body or URL)
					if (urlString.includes("indexEntry.create")) {
						let label = "Mock Entry";
						let parentId = null;
						let projectIndexTypeId = "test-project-index-type-id";

						const urlObj = new URL(urlString);
						const urlInput = urlObj.searchParams.get("input");
						const bodyJson = await getBodyJson();
						const parsed = (() => {
							if (
								bodyJson &&
								typeof bodyJson === "object" &&
								"json" in bodyJson
							) {
								return (bodyJson as { json: Record<string, unknown> }).json;
							}
							if (bodyJson && typeof bodyJson === "object") {
								return bodyJson as Record<string, unknown>;
							}
							if (urlInput) {
								try {
									return JSON.parse(urlInput) as Record<string, unknown>;
								} catch {
									return null;
								}
							}
							return null;
						})();

						if (parsed) {
							label = (parsed.label as string) || label;
							parentId = (parsed.parentId as string | null) ?? null;
							projectIndexTypeId =
								(parsed.projectIndexTypeId as string) || projectIndexTypeId;
						}

						return new Response(
							JSON.stringify({
								result: {
									data: {
										id: `mock-entry-${Date.now()}`,
										label,
										slug: label.toLowerCase().replace(/\s+/g, "-"),
										description: null,
										status: "active",
										projectId: "test-project-id",
										projectIndexTypeId,
										projectIndexType: {
											id: projectIndexTypeId,
											indexType: "subject",
											colorHue: 230,
										},
										parentId,
										matchers: [],
										mentionCount: 0,
										childCount: 0,
										crossReferences: [],
										createdAt: new Date().toISOString(),
										updatedAt: new Date().toISOString(),
									},
								},
							}),
							{
								headers: { "Content-Type": "application/json" },
							},
						);
					}

					if (urlString.includes("indexEntry.crossReference.list")) {
						return new Response(
							JSON.stringify({
								result: {
									data: [],
								},
							}),
							{
								headers: { "Content-Type": "application/json" },
							},
						);
					}

					// Mock mutation: indexEntry.crossReference.create
					if (urlString.includes("indexEntry.crossReference.create")) {
						const urlObj = new URL(urlString);
						const input = urlObj.searchParams.get("input");
						let fromEntryId = "mock-from-entry-id";
						let toEntryId = "mock-to-entry-id";

						if (input) {
							try {
								const parsed = JSON.parse(input);
								fromEntryId = parsed.fromEntryId || fromEntryId;
								toEntryId = parsed.toEntryId || toEntryId;
							} catch {
								// Use defaults
							}
						}

						return new Response(
							JSON.stringify({
								result: {
									data: {
										id: `mock-cross-ref-${Date.now()}`,
										fromEntryId,
										toEntryId,
										createdAt: new Date().toISOString(),
									},
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

export const TrpcDecorator = ({
	children,
	config,
}: {
	children: ReactNode;
	config?: TrpcDecoratorConfig;
}) => {
	const mockTrpcClient = React.useMemo(
		() => createMockTrpcClient(config),
		[config],
	);

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
