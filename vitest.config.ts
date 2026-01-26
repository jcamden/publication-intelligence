import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		passWithNoTests: true,
		include: ["**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
		exclude: ["**/node_modules/**", "**/dist/**", "**/build/**"],
		// Load .env.test when NODE_ENV=test, otherwise .env
		env: {
			// Vitest will load .env.test automatically when NODE_ENV=test
		},
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			exclude: [
				"**/node_modules/**",
				"**/dist/**",
				"**/build/**",
				"**/*.config.*",
				"**/*.d.ts",
			],
		},
	},
});
