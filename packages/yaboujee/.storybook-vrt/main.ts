import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/react-vite";
import tailwindcss from "@tailwindcss/vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const config: StorybookConfig = {
	stories: ["../src/**/visual-regression-tests.stories.@(js|jsx|mjs|ts|tsx)"],
	addons: [
		"@chromatic-com/storybook",
		"@storybook/addon-a11y",
		"@storybook/addon-docs",
		"storybook-addon-pseudo-states",
	],
	framework: "@storybook/react-vite",
	staticDirs: ["./public"],
	async viteFinal(config) {
		config.plugins = config.plugins || [];
		config.plugins.push(tailwindcss());

		// Mock Next.js Link for Storybook
		config.resolve = config.resolve || {};
		config.resolve.alias = {
			...config.resolve.alias,
			"next/link": join(__dirname, "next-link-mock.tsx"),
		};

		return config;
	},
};
export default config;
