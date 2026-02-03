import path from "node:path";
import { jsdomConfig } from "@pubint/vitest-config";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [
		react(),
		storybookTest({
			configDir: ".storybook",
		}),
	],
	optimizeDeps: {
		include: [
			"@storybook/nextjs-vite",
			"@storybook/react",
			"@storybook/test",
			"react",
			"react-dom",
			"react/jsx-runtime",
		],
	},
	test: {
		...jsdomConfig,
		watch: false,
		reporters: [
			"default",
			["json", { outputFile: "test-results/interaction-tests.json" }],
		],
		browser: {
			enabled: true,
			provider: playwright(),
			headless: true,
			instances: [{ browser: "chromium" }],
		},
		setupFiles: ["./.storybook/vitest.setup.ts"],
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
});
