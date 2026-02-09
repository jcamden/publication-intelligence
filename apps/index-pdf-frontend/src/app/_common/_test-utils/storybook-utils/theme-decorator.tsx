import { ThemeContext } from "@/app/_common/_providers/theme-provider";

type Theme = "light" | "dark" | "system";

type ThemeContextType = {
	theme: Theme;
	resolvedTheme: "light" | "dark";
	setTheme: ({ theme }: { theme: Theme }) => void;
};

/**
 * Mock ThemeProvider for Storybook stories
 * Uses the same ThemeContext as the real ThemeProvider so useTheme() works correctly
 * Provides the theme context without localStorage or system theme detection
 */
export const MockThemeProvider = ({
	children,
	theme,
}: {
	children: React.ReactNode;
	theme: "light" | "dark";
}) => {
	const contextValue: ThemeContextType = {
		theme,
		resolvedTheme: theme,
		setTheme: () => {
			// Mock implementation - does nothing in Storybook
		},
	};

	return (
		<ThemeContext.Provider value={contextValue}>
			{children}
		</ThemeContext.Provider>
	);
};
