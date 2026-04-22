// This file has been automatically migrated to valid ESM format by Storybook.
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/react-vite";
import tailwindcss from "@tailwindcss/vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const config: StorybookConfig = {
	stories: ["../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
	addons: [
		getAbsolutePath("@chromatic-com/storybook"),
		getAbsolutePath("@storybook/addon-vitest"),
		getAbsolutePath("@storybook/addon-a11y"),
		getAbsolutePath("@storybook/addon-docs"),
		getAbsolutePath("storybook-addon-pseudo-states"),
	],
	framework: getAbsolutePath("@storybook/react-vite"),
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

function getAbsolutePath(value: string): string {
	return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)));
}
