import { jsdomConfig } from "@pubint/vitest-config";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		...jsdomConfig,
		watch: false,
		reporters: [
			"default",
			["json", { outputFile: "test-results/unit-tests.json" }],
		],
		setupFiles: [],
		exclude: [...(jsdomConfig.exclude || []), "**/*.stories.?(m)[jt]s?(x)"],
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
