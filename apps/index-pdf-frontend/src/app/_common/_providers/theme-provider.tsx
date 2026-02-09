"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

type ThemeContextType = {
	theme: Theme;
	resolvedTheme: "light" | "dark";
	setTheme: ({ theme }: { theme: Theme }) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Export for testing/storybook
export { ThemeContext };

const getSystemTheme = (): "light" | "dark" => {
	if (typeof window === "undefined") return "light";
	return window.matchMedia("(prefers-color-scheme: dark)").matches
		? "dark"
		: "light";
};

const getStoredTheme = (): Theme => {
	if (typeof window === "undefined") return "system";
	return (localStorage.getItem("theme") as Theme) || "system";
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
	const [theme, setThemeState] = useState<Theme>(() => getStoredTheme());
	const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() => {
		const stored = getStoredTheme();
		return stored === "system" ? getSystemTheme() : stored;
	});

	useEffect(() => {
		// Resolve the actual theme based on system preference
		const resolved = theme === "system" ? getSystemTheme() : theme;
		setResolvedTheme(resolved);

		// Update data-theme attribute and .dark class
		document.documentElement.setAttribute("data-theme", resolved);
		if (resolved === "dark") {
			document.documentElement.classList.add("dark");
		} else {
			document.documentElement.classList.remove("dark");
		}

		// Listen for system theme changes
		if (theme === "system") {
			const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
			const handleChange = () => {
				const newResolved = getSystemTheme();
				setResolvedTheme(newResolved);
				document.documentElement.setAttribute("data-theme", newResolved);
				if (newResolved === "dark") {
					document.documentElement.classList.add("dark");
				} else {
					document.documentElement.classList.remove("dark");
				}
			};

			mediaQuery.addEventListener("change", handleChange);
			return () => mediaQuery.removeEventListener("change", handleChange);
		}
	}, [theme]);

	const setTheme = ({ theme: newTheme }: { theme: Theme }) => {
		setThemeState(newTheme);
		localStorage.setItem("theme", newTheme);
	};

	return (
		<ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
			{children}
		</ThemeContext.Provider>
	);
};

export const useTheme = () => {
	const context = useContext(ThemeContext);
	if (!context) {
		throw new Error("useTheme must be used within ThemeProvider");
	}
	return context;
};
