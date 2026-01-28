import { nodeConfig } from "@pubint/vitest-config";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		...nodeConfig,
		// Load .env.test when NODE_ENV=test, otherwise .env
		env: {
			// Vitest will load .env.test automatically when NODE_ENV=test
		},
	},
});
