import path from "node:path";
import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/nextjs-vite";
import tailwindcss from "@tailwindcss/vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config: StorybookConfig = {
	stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
	addons: [
		"@storybook/addon-vitest",
		"@storybook/addon-a11y",
		"@storybook/addon-docs",
		"storybook-addon-pseudo-states",
	],
	framework: "@storybook/nextjs-vite",
	staticDirs: ["../public"],
	async viteFinal(config) {
		config.plugins = config.plugins || [];
		config.plugins.push(tailwindcss());
		config.resolve ??= {};
		const alias = config.resolve.alias;
		const projectsAlias = path.resolve(
			__dirname,
			"../src/app/(with-project-nav)/projects",
		);
		if (Array.isArray(alias)) {
			config.resolve.alias = [
				...alias,
				{ find: "@/app/projects", replacement: projectsAlias },
			];
		} else {
			config.resolve.alias = {
				...(alias as Record<string, string> | undefined),
				"@/app/projects": projectsAlias,
			};
		}
		return config;
	},
};
export default config;
