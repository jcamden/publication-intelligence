import { defineConfig, devices } from "@playwright/test";

const PORT = process.env.PORT || 6006;
const STORYBOOK_URL = `http://localhost:${PORT}`;

/**
 * Playwright config for Component Visual Regression Tests
 * Runs against Storybook stories
 */
export default defineConfig({
	testDir: "./tests",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: "html",
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
	webServer: {
		command: "pnpm storybook",
		url: STORYBOOK_URL,
		reuseExistingServer: !process.env.CI,
		timeout: 120 * 1000,
	},
});
