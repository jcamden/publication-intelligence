"use client";

import { ThemeToggle } from "@pubint/yaboujee";
import { AuthForm } from "../../components/auth/auth-form";
import { UserProfile } from "../../components/auth/user-profile";
import { useAuthToken } from "../../hooks/use-auth";
import { useTheme } from "../../providers/theme-provider";

export default function Login() {
	const { isAuthenticated, isLoading } = useAuthToken();
	const { resolvedTheme, setTheme } = useTheme();

	if (isLoading) {
		return <main className="p-8">Loading...</main>;
	}

	return (
		<main className="min-h-screen p-8 bg-background">
			<div className="max-w-5xl mx-auto">
				<header className="flex justify-between items-center mb-8">
					<div>
						<h1 className="text-4xl font-bold text-foreground">
							Publication Intelligence
						</h1>
						<p className="text-muted-foreground">
							PDF indexing and search platform
						</p>
					</div>
					<ThemeToggle
						theme={resolvedTheme}
						onToggle={() =>
							setTheme({
								theme: resolvedTheme === "dark" ? "light" : "dark",
							})
						}
					/>
				</header>

				<div className="pt-8">
					{isAuthenticated ? <UserProfile /> : <AuthForm />}
				</div>
			</div>
		</main>
	);
}
