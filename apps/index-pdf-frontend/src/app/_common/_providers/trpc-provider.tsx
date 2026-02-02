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
	const [queryClient] = useState(() => new QueryClient());
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
