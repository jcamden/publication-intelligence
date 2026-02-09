import { nodeConfig } from "@pubint/vitest-config";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		...nodeConfig,
		include: ["src/**/*.{test,spec}.{js,ts}"],
		setupFiles: ["./vitest.setup.ts"],
		testTimeout: 30000,
		hookTimeout: 30000,
		coverage: {
			...nodeConfig.coverage,
			include: ["src/**/*.ts"],
			exclude: [...(nodeConfig.coverage?.exclude || []), "**/test/**"],
		},
	},
});
