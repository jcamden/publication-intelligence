import path from "node:path";
import { jsdomConfig } from "@pubint/vitest-config";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [react()],
	test: {
		...jsdomConfig,
		setupFiles: ["./vitest.setup.ts"],
		exclude: [...(jsdomConfig.exclude || []), "**/playwright/**"],
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
});
