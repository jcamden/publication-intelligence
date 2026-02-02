"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthToken } from "@/app/_common/_hooks/use-auth";
import { trpc } from "@/app/_common/_utils/trpc";
import { ProjectNavbar } from "../../_components/project-navbar";

export default function IndexPage() {
	const router = useRouter();
	const {
		isAuthenticated,
		isLoading: authLoading,
		clearToken,
	} = useAuthToken();

	const userQuery = trpc.auth.me.useQuery(undefined, {
		enabled: isAuthenticated,
	});

	useEffect(() => {
		if (!authLoading && !isAuthenticated) {
			router.push("/login");
		}
	}, [isAuthenticated, authLoading, router]);

	if (authLoading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-center">
					<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
					<p className="text-muted-foreground">Loading...</p>
				</div>
			</div>
		);
	}

	if (!isAuthenticated) {
		return null;
	}

	const handleSignOut = () => {
		clearToken();
		router.push("/login");
	};

	return (
		<>
			<ProjectNavbar
				userName={userQuery.data?.name ?? undefined}
				userEmail={userQuery.data?.email ?? undefined}
				onSignOutClick={handleSignOut}
			/>
			<div className="h-[calc(100vh-3.5rem-1px)] overflow-hidden bg-neutral-50 dark:bg-neutral-900">
				<div>meow</div>
			</div>
		</>
	);
}
