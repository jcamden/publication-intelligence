import { nodeConfig } from "@pubint/vitest-config";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		...nodeConfig,
	},
});
