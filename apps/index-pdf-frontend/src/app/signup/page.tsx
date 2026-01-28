"use client";

import { LandingNavbar } from "@pubint/yaboujee";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { SignupForm } from "../../components/auth/signup-form/signup-form";
import { useAuthToken } from "../../hooks/use-auth";
import { useTheme } from "../../providers/theme-provider";

export default function Signup() {
	const { isAuthenticated, isLoading } = useAuthToken();
	const { resolvedTheme, setTheme } = useTheme();
	const router = useRouter();

	useEffect(() => {
		if (!isLoading && isAuthenticated) {
			router.push("/projects");
		}
	}, [isAuthenticated, isLoading, router]);

	if (isLoading) {
		return (
			<div className="h-screen flex items-center justify-center bg-background">
				<p className="text-muted-foreground">Loading...</p>
			</div>
		);
	}

	if (isAuthenticated) {
		return null;
	}

	return (
		<div className="h-screen bg-background flex flex-col">
			<LandingNavbar
				theme={resolvedTheme}
				onThemeToggle={() =>
					setTheme({
						theme: resolvedTheme === "dark" ? "light" : "dark",
					})
				}
			/>
			<main className="pb-24 flex items-center justify-center flex-1">
				<SignupForm />
			</main>
		</div>
	);
}
