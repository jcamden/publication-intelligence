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
				className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-surface-hover"
				aria-label="Toggle theme"
			>
				{resolvedTheme === "dark" ? "🌞 Light" : "🌙 Dark"}
			</button>
			<span className="text-sm text-text-secondary">
				Mode: {theme}
				{theme === "system" && ` (${resolvedTheme})`}
			</span>
		</div>
	);
};
