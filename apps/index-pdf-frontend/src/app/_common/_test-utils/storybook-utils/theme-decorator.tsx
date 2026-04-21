"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { appThemeProviderProps } from "@/app/_common/_config/theme-config";

/**
 * Mock ThemeProvider for Storybook stories — same attributes/storage as the app,
 * with a forced light/dark theme (no system / localStorage coupling).
 */
export const MockThemeProvider = ({
	children,
	theme,
}: {
	children: React.ReactNode;
	theme: "light" | "dark";
}) => (
	<NextThemesProvider
		{...appThemeProviderProps}
		defaultTheme={theme}
		enableSystem={false}
		forcedTheme={theme}
	>
		{children}
	</NextThemesProvider>
);
