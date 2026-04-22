export const baseConfig = {
	globals: true,
	passWithNoTests: true,
	reporters: [
		"default",
		["json", { outputFile: "test-results/unit-tests.json" }],
	] as const,
	include: ["**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
	exclude: [
		"**/node_modules/**",
		"**/dist/**",
		"**/build/**",
		"**/.next/**",
		"**/.{idea,git,cache,output,temp}/**",
	],
	coverage: {
		provider: "v8" as const,
		reporter: ["text", "json", "html"],
		exclude: [
			"**/node_modules/**",
			"**/dist/**",
			"**/build/**",
			"**/*.config.*",
			"**/*.d.ts",
			"**/*.test.*",
			"**/*.spec.*",
		],
	},
};

export const nodeConfig = {
	...baseConfig,
	environment: "node" as const,
};

export const jsdomConfig = {
	...baseConfig,
	environment: "jsdom" as const,
};
