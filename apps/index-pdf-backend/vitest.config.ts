import { nodeConfig } from "@pubint/vitest-config";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		...(nodeConfig as unknown as Record<string, unknown>),
		// In sandboxed CI/dev environments, Vitest's fork pool can fail to terminate
		// workers with EACCES. Threads pool avoids process-kill permissions.
		pool: "threads",
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
