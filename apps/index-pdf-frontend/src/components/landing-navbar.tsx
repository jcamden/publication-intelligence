"use client";

import { Logo, ThemeToggle } from "@pubint/yaboujee";
import Link from "next/link";
import { useTheme } from "@/providers/theme-provider";

export const LandingNavbar = () => {
	const { resolvedTheme, setTheme } = useTheme();

	return (
		<nav className="fixed top-0 w-full bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 z-50">
			<div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
				<Logo variant={"gradient"} />
				<div className="flex items-center gap-6">
					<ThemeToggle
						theme={resolvedTheme}
						onToggle={() =>
							setTheme({
								theme: resolvedTheme === "dark" ? "light" : "dark",
							})
						}
					/>
					<Link
						href="/login"
						className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
					>
						Sign In
					</Link>
					<button
						type="button"
						className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
					>
						Get Early Access
					</button>
				</div>
			</div>
		</nav>
	);
};
