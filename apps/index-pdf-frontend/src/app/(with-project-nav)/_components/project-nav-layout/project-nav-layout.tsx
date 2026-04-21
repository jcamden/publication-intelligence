"use client";

import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";
import { useAuthToken } from "@/app/_common/_hooks/use-auth-token";
import { trpc } from "@/app/_common/_trpc/client";
import { ProjectNavbar } from "@/app/(with-project-nav)/_components/project-nav-layout/components/project-navbar";

export const ProjectNavLayout = ({ children }: { children: ReactNode }) => {
	const pathname = usePathname();
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
	}, [authLoading, isAuthenticated, router]);

	const handleSignOut = () => {
		clearToken();
		router.push("/login");
	};

	if (authLoading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
			</div>
		);
	}

	if (!isAuthenticated) {
		return null;
	}

	const showOnlyProjectsLink = pathname === "/settings";

	return (
		<>
			<ProjectNavbar
				userName={userQuery.data?.name ?? undefined}
				userEmail={userQuery.data?.email ?? undefined}
				onSignOutClick={handleSignOut}
				showOnlyProjectsLink={showOnlyProjectsLink}
			/>
			{children}
		</>
	);
};
