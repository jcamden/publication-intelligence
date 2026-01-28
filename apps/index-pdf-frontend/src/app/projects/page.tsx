"use client";

import { LandingNavbar } from "@pubint/yaboujee";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthToken } from "../../hooks/use-auth";
import { useTheme } from "../../providers/theme-provider";

export default function Projects() {
	const { isAuthenticated, isLoading } = useAuthToken();
	const { resolvedTheme, setTheme } = useTheme();
	const router = useRouter();

	useEffect(() => {
		if (!isLoading && !isAuthenticated) {
			router.push("/login");
		}
	}, [isAuthenticated, isLoading, router]);

	if (isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-background">
				<p className="text-muted-foreground">Loading...</p>
			</div>
		);
	}

	if (!isAuthenticated) {
		return null;
	}

	return (
		<div className="min-h-screen bg-background">
			<LandingNavbar
				theme={resolvedTheme}
				onThemeToggle={() =>
					setTheme({
						theme: resolvedTheme === "dark" ? "light" : "dark",
					})
				}
				showAuthLinks={false}
			/>
			<main className="pt-24 px-6">
				<div className="max-w-7xl mx-auto">
					<h1 className="text-4xl font-bold text-foreground">Projects</h1>
					<p className="text-muted-foreground mt-2">
						Your indexing projects will appear here
					</p>
				</div>
			</main>
		</div>
	);
}
