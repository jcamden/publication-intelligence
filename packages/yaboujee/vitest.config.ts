import { jsdomConfig } from "@pubint/vitest-config";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		...jsdomConfig,
		setupFiles: [],
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
