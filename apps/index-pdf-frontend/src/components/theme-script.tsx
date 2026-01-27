export const ThemeScript = () => {
	const themeScript = `
		(function() {
			try {
				const theme = localStorage.getItem('theme') || 'system';
				const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
				const resolvedTheme = theme === 'system' ? systemTheme : theme;
				document.documentElement.setAttribute('data-theme', resolvedTheme);
			} catch (e) {}
		})();
	`;

	return (
		// biome-ignore lint/security/noDangerouslySetInnerHtml: Safe - no user input, prevents FOUC
		<script dangerouslySetInnerHTML={{ __html: themeScript }} />
	);
};
