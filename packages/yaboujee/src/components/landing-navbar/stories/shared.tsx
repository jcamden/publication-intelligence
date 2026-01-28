import { useState } from "react";
import type { Theme } from "../../theme-toggle/theme-toggle";
import { LandingNavbar } from "../landing-navbar";

export const NavbarWithContent = ({
	showAuthLinks = true,
	initialTheme = "light",
}: {
	showAuthLinks?: boolean;
	initialTheme?: Theme;
}) => {
	const [theme, setTheme] = useState<Theme>(initialTheme);

	return (
		<div className="min-h-[400px]">
			<LandingNavbar
				theme={theme}
				onThemeToggle={() => setTheme(theme === "light" ? "dark" : "light")}
				showAuthLinks={showAuthLinks}
			/>
			<div className="pt-20 sm:pt-24 px-4 sm:px-8 md:px-16 lg:px-28">
				<h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
					Welcome to IndexPDF
				</h1>
				<p className="text-base sm:text-lg text-muted-foreground">
					Sample content below the navbar.
				</p>
			</div>
		</div>
	);
};

export const NavbarOnly = ({
	showAuthLinks = true,
	initialTheme = "light",
}: {
	showAuthLinks?: boolean;
	initialTheme?: Theme;
}) => {
	const [theme, setTheme] = useState<Theme>(initialTheme);

	return (
		<div className="min-h-[400px]">
			<LandingNavbar
				theme={theme}
				onThemeToggle={() => setTheme(theme === "light" ? "dark" : "light")}
				showAuthLinks={showAuthLinks}
			/>
		</div>
	);
};
