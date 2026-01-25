import { test, expect } from "@playwright/test";

/**
 * End-to-End Tests for Homepage
 * Tests the actual Next.js application
 */

test.describe("Homepage", () => {
	test("should load and display the page", async ({ page }) => {
		await page.goto("/");
		
		// Add your actual homepage tests here
		await expect(page).toHaveTitle(/Publication Intelligence/i);
	});

	test("should be accessible", async ({ page }) => {
		await page.goto("/");
		
		// Basic accessibility checks
		const main = page.locator("main");
		await expect(main).toBeVisible();
	});
});
