import { defineConfig, devices } from "@playwright/test";

const PACKAGE = process.env.PACKAGE;

// Require PACKAGE to be specified
if (!PACKAGE) {
	throw new Error(
		"❌ PACKAGE environment variable is required.\n\nUsage:\n  PACKAGE=yaboujee pnpm test:vrt\n  PACKAGE=index-pdf-frontend pnpm test:vrt\n\nOr use convenience scripts:\n  pnpm test:yaboujee\n  pnpm test:frontend",
	);
}

// Determine the package location (packages/ or apps/)
const isApp = PACKAGE.includes("frontend") || PACKAGE.includes("backend");
const packageLocation = isApp ? "apps" : "packages";

// Each package has its own Storybook port
const PORTS: Record<string, number> = {
	yaboujee: 6007,
	"index-pdf-frontend": 6006,
};

const PORT = process.env.PORT || PORTS[PACKAGE] || 6006;
const STORYBOOK_URL = `http://localhost:${PORT}`;

/**
 * Playwright config for Component Visual Regression Tests
 * Runs against Storybook stories from any package in the monorepo
 *
 * Tests are organized by package:
 *   - Test files: suites/{package}/tests/*.visual.spec.ts
 *   - Snapshots: suites/{package}/__snapshots__/
 *   - Reports: suites/{package}/playwright-report/
 *   - Test results: suites/{package}/test-results/
 *
 * Each package uses its own Storybook port:
 *   - yaboujee: 6007
 *   - index-pdf-frontend: 6006
 *
 * Usage:
 *   PACKAGE=yaboujee pnpm test:vrt
 *   PACKAGE=index-pdf-frontend pnpm test:vrt
 */
export default defineConfig({
	// Only run tests for the specified package
	testDir: `./suites/${PACKAGE}/tests`,
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	// Package-specific report and test-results directories
	reporter: [
		["html", { outputFolder: `./suites/${PACKAGE}/playwright-report` }],
	],
	outputDir: `./suites/${PACKAGE}/test-results`,
	use: {
		baseURL: STORYBOOK_URL,
		trace: "on-first-retry",
		screenshot: "only-on-failure",
	},
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],
	// Snapshot directory in parent of tests directory
	snapshotPathTemplate: `./suites/${PACKAGE}/__snapshots__/{testFilePath}/{arg}{ext}`,
	webServer: {
		// Start the appropriate Storybook server
		command: `cd ../../${packageLocation}/${PACKAGE} && pnpm storybook`,
		url: STORYBOOK_URL,
		reuseExistingServer: !process.env.CI,
		timeout: 120 * 1000,
	},
});
