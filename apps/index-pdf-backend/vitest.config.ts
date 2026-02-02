import path from "node:path";
import { nodeConfig } from "@pubint/vitest-config";
import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		alias: {
			"@gel": path.resolve(__dirname, "../../db/gel/generated/index.ts"),
		},
	},
	test: {
		...nodeConfig,
		include: ["src/**/*.{test,spec}.{js,ts}"],
		setupFiles: ["./vitest.setup.ts"],
		testTimeout: 30000,
		hookTimeout: 30000,
		fileParallelism: false,
		coverage: {
			...nodeConfig.coverage,
			include: ["src/**/*.ts"],
			exclude: [...(nodeConfig.coverage?.exclude || []), "**/test/**"],
		},
	},
});
