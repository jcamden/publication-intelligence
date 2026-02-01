"use client";

import { LandingNavbar } from "@pubint/yabasic/components/ui/landing-navbar";
import { Logo } from "@pubint/yaboujee";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthToken } from "@/app/_common/_hooks/use-auth";
import { useTheme } from "@/app/_common/_providers/theme-provider";
import { SignupForm } from "./_components/signup-form";

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
				logo={<Logo variant="gradient" size="sm" className="sm:text-4xl" />}
				homeLink={
					<Link href="/">
						<Logo variant="gradient" size="sm" className="sm:text-4xl" />
					</Link>
				}
				signInLink={
					<Link
						href="/login"
						className="text-sm sm:text-base text-muted-foreground hover:text-foreground transition-colors"
					>
						Sign In
					</Link>
				}
				signUpLink={
					<Link href="/signup" className="w-full">
						Get Started
					</Link>
				}
			/>
			<main className="flex items-center justify-center flex-1">
				<SignupForm />
			</main>
		</div>
	);
}
