import type { Preview } from "@storybook/react";
import { MINIMAL_VIEWPORTS } from "storybook/viewport";
import "../src/index.css";

const preview: Preview = {
	parameters: {
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
		viewport: {
			options: {
				...MINIMAL_VIEWPORTS,
				mobile1: {
					name: "mobile1 (375×667)",
					styles: { width: "375px", height: "667px" },
					type: "mobile",
				},
				tablet: {
					name: "tablet (768×1024)",
					styles: { width: "768px", height: "1024px" },
					type: "tablet",
				},
			},
		},
	},
	tags: ["autodocs"],
	globalTypes: {
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
	},
	initialGlobals: {
		theme: "light",
	},
	decorators: [
		(Story, context) => {
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
		},
	],
};

export default preview;
