"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { useState } from "react";
import { API_URL } from "../_config/api";
import { trpc } from "../_utils/trpc";

const getBaseUrl = () => {
	return API_URL;
};

export const TrpcProvider = ({ children }: { children: React.ReactNode }) => {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						retry: (failureCount, error: unknown) => {
							// Don't retry on 4xx errors (client errors)
							const httpStatus =
								error &&
								typeof error === "object" &&
								"data" in error &&
								error.data &&
								typeof error.data === "object" &&
								"httpStatus" in error.data
									? (error.data.httpStatus as number)
									: undefined;

							if (httpStatus && httpStatus >= 400 && httpStatus < 500) {
								return false;
							}

							// Retry up to 3 times for 5xx errors
							return failureCount < 3;
						},

						// Exponential backoff: 1s, 2s, 4s
						retryDelay: (attemptIndex) =>
							Math.min(1000 * 2 ** attemptIndex, 30000),

						// Data fresh for 5 minutes
						staleTime: 5 * 60 * 1000,

						// Cache for 10 minutes
						gcTime: 10 * 60 * 1000,
					},
					mutations: {
						// Only retry mutations on network errors
						retry: (failureCount, error: unknown) => {
							const message =
								error &&
								typeof error === "object" &&
								"message" in error &&
								typeof error.message === "string"
									? error.message
									: "";

							if (message.includes("network")) {
								return failureCount < 3;
							}
							return false;
						},
						retryDelay: (attemptIndex) =>
							Math.min(1000 * 2 ** attemptIndex, 30000),
					},
				},
			}),
	);

	const [trpcClient] = useState(() =>
		trpc.createClient({
			links: [
				httpBatchLink({
					url: `${getBaseUrl()}/trpc`,
					headers: () => {
						const token =
							typeof window !== "undefined"
								? localStorage.getItem("gel_auth_token")
								: null;
						return token
							? {
									authorization: `Bearer ${token}`,
								}
							: {};
					},
				}),
			],
		}),
	);

	return (
		<trpc.Provider client={trpcClient} queryClient={queryClient}>
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		</trpc.Provider>
	);
};
