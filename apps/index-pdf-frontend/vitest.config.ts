import path from "node:path";
import { jsdomConfig } from "@pubint/vitest-config";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [react()],
	test: {
		...jsdomConfig,
		watch: false,
		reporters: [
			"default",
			["json", { outputFile: "test-results/unit-tests.json" }],
		],
		setupFiles: ["./vitest.setup.ts"],
		exclude: [
			...(jsdomConfig.exclude || []),
			"**/playwright/**",
			"**/*.stories.?(m)[jt]s?(x)",
		],
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
});
