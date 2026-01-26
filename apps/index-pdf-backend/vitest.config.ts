import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		alias: {
			"@gel": path.resolve(__dirname, "../../db/gel/generated/index.ts"),
		},
	},
	test: {
		globals: true,
		environment: "node",
		include: ["src/**/*.{test,spec}.{js,ts}"],
		exclude: ["**/node_modules/**", "**/dist/**"],
		testTimeout: 30000,
		hookTimeout: 30000,
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			include: ["src/**/*.ts"],
			exclude: [
				"**/*.test.ts",
				"**/*.spec.ts",
				"**/test/**",
				"**/*.config.ts",
				"**/*.d.ts",
			],
		},
	},
});
