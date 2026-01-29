import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpLink } from "@trpc/client";
import type { ReactNode } from "react";
import { trpc } from "@/utils/trpc";

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
								message: "Mock sign up successful",
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

export const TrpcDecorator = ({ children }: { children: ReactNode }) => {
	return (
		<trpc.Provider client={mockTrpcClient} queryClient={queryClient}>
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		</trpc.Provider>
	);
};
