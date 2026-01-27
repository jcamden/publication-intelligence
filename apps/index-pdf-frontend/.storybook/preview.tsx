import type { Preview } from "@storybook/nextjs-vite";
import "../src/app/globals.css";

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
	decorators: [
		(Story, context) => {
			const theme = context.globals.theme || "light";

			// Set theme on document element so portals inherit it
			if (typeof document !== "undefined") {
				document.documentElement.setAttribute("data-theme", theme);
			}

			return (
				<div style={{ minHeight: "100vh", padding: "2rem" }}>
					<Story />
				</div>
			);
		},
	],
};

export default preview;
