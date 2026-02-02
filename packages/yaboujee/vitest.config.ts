import { jsdomConfig } from "@pubint/vitest-config";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [
		storybookTest({
			configDir: ".storybook",
		}),
	],
	test: {
		...jsdomConfig,
		watch: false,
		reporters: [
			"default",
			["json", { outputFile: "test-results/interaction-tests.json" }],
		],
		projects: [
			{
				extends: true,
				test: {
					name: "storybook",
					browser: {
						enabled: true,
						provider: playwright(),
						headless: true,
						instances: [{ browser: "chromium" }],
					},
					setupFiles: ["./.storybook/vitest.setup.ts"],
				},
			},
		],
		coverage: {
			...jsdomConfig.coverage,
			exclude: [
				...(jsdomConfig.coverage?.exclude || []),
				"**/*.stories.tsx",
				".storybook/",
			],
		},
	},
});
