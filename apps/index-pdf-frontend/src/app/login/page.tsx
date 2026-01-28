"use client";

import { LandingNavbar } from "@pubint/yaboujee";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoginForm } from "../../components/auth/login-form/login-form";
import { useAuthToken } from "../../hooks/use-auth";
import { useTheme } from "../../providers/theme-provider";

export default function Login() {
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
			<div className="min-h-screen flex items-center justify-center bg-background">
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
				<LoginForm />
			</main>
		</div>
	);
}
