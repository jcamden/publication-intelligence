"use client";

import { useTheme } from "../providers/theme-provider";

export const ThemeToggle = () => {
	const { theme, resolvedTheme, setTheme } = useTheme();

	return (
		<div className="flex items-center gap-2">
			<button
				type="button"
				onClick={() =>
					setTheme({
						theme: resolvedTheme === "dark" ? "light" : "dark",
					})
				}
				className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
				aria-label="Toggle theme"
			>
				{resolvedTheme === "dark" ? "🌞 Light" : "🌙 Dark"}
			</button>
			<span className="text-sm text-muted-foreground">
				Mode: {theme}
				{theme === "system" && ` (${resolvedTheme})`}
			</span>
		</div>
	);
};
