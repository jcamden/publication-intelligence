import type { Decorator, Parameters, Preview } from "@storybook/react";

/**
 * Shared Storybook preview configuration
 * Used across all .storybook, .storybook-interaction, and .storybook-vrt configs
 */

export const sharedParameters: Parameters = {
	controls: {
		matchers: {
			color: /(background|color)$/i,
			date: /Date$/i,
		},
	},
	backgrounds: {
		default: "light",
		values: [
			{ name: "light", value: "#ffffff" },
			{ name: "dark", value: "#0a0a0a" },
		],
	},
	a11y: {
		config: {
			rules: [
				{
					id: "color-contrast",
					enabled: true,
				},
			],
		},
	},
};

export const sharedGlobalTypes: Preview["globalTypes"] = {
	theme: {
		description: "Global theme for components",
		defaultValue: "light",
		toolbar: {
			title: "Theme",
			icon: "circlehollow",
			items: ["light", "dark"],
			dynamicTitle: true,
		},
	},
};

export const sharedInitialGlobals: Preview["initialGlobals"] = {
	theme: "light",
};

/**
 * Theme decorator - applies theme to document element for all stories
 * Works with both portals and regular components
 */
export const themeDecorator: Decorator = (Story, context) => {
	const theme = context.globals.theme || "light";

	// Set theme on document element so portals inherit it
	if (typeof document !== "undefined") {
		document.documentElement.setAttribute("data-theme", theme);
		// Apply .dark class for CSS
		if (theme === "dark") {
			document.documentElement.classList.add("dark");
		} else {
			document.documentElement.classList.remove("dark");
		}
	}

	return <Story />;
};
