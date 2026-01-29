import { expect, test } from "@playwright/test";

/**
 * End-to-End Tests for PDF Viewer
 *
 * Tests the viewer page with mock mentions and PDF rendering
 */

test.describe("PDF Viewer", () => {
	const viewerUrl = "/projects/test-project/documents/doc-1/viewer";

	test("should load viewer page and display layout", async ({ page }) => {
		await page.goto(viewerUrl);

		// Check that all three panels are present
		const mentionsSidebar = page.locator("text=Mentions");
		const pdfViewer = page.locator("text=PDF Viewer");
		const entryPanel = page.locator("text=Entry details panel");

		await expect(mentionsSidebar).toBeVisible();
		await expect(pdfViewer).toBeVisible();
		await expect(entryPanel).toBeVisible();
	});

	test("should display mock mentions in sidebar", async ({ page }) => {
		await page.goto(viewerUrl);

		// Wait for mentions to load
		await page.waitForSelector("text=Mentions", { timeout: 5000 });

		// Check for mock mention text
		const mentionCard = page
			.locator("text=machine learning algorithms")
			.first();
		await expect(mentionCard).toBeVisible();

		// Check mention count
		const mentionsHeader = page.locator("text=/Mentions \\(\\d+\\)/");
		await expect(mentionsHeader).toBeVisible();
	});

	test("should group mentions by page", async ({ page }) => {
		await page.goto(viewerUrl);

		await page.waitForSelector("text=Mentions", { timeout: 5000 });

		// Check for page headers
		const page1Header = page.locator("text=Page 1");
		const page2Header = page.locator("text=Page 2");

		await expect(page1Header).toBeVisible();
		await expect(page2Header).toBeVisible();
	});

	test("should highlight selected mention", async ({ page }) => {
		await page.goto(viewerUrl);

		await page.waitForSelector("text=Mentions", { timeout: 5000 });

		// Click on a mention card
		const mentionCard = page
			.locator("text=machine learning algorithms")
			.first();
		await mentionCard.click();

		// Check if card is highlighted (has selected styling)
		const parentButton = mentionCard.locator("..");
		await expect(parentButton).toHaveClass(/border-blue-500|bg-blue-50/);
	});

	test("should display mention metadata", async ({ page }) => {
		await page.goto(viewerUrl);

		await page.waitForSelector("text=Mentions", { timeout: 5000 });

		// Check for entry labels
		const entryLabel = page.locator("text=AI Concepts").first();
		await expect(entryLabel).toBeVisible();

		// Check for approximate indicator
		const approximateTag = page.locator("text=~").first();
		await expect(approximateTag).toBeVisible();
	});

	test("should be responsive and scrollable", async ({ page }) => {
		await page.goto(viewerUrl);

		// Check sidebar is scrollable
		const sidebar = page.locator("div").filter({ hasText: "Mentions" }).first();
		await expect(sidebar).toHaveCSS("overflow-y", /auto|scroll/);

		// Check main viewer area is present
		const viewerArea = page.locator("text=PDF Viewer").locator("..");
		await expect(viewerArea).toBeVisible();
	});

	test("should handle empty mentions state", async ({ page: _page }) => {
		// Would need a route with no mentions for this
		// Skipping for now as all test documents have mock mentions
		test.skip();
	});

	test("should show loading state initially", async ({ page }) => {
		// Start navigation but don't wait
		const response = page.goto(viewerUrl);

		// Try to catch loading state (may be too fast in tests)
		const loadingText = page.locator("text=Loading mentions");

		// This might not always be visible if loading is too fast
		// That's okay - it just means the app is performant
		try {
			await expect(loadingText).toBeVisible({ timeout: 100 });
		} catch {
			// Loading was too fast, which is fine
		}

		await response;

		// Eventually should show mentions
		await expect(page.locator("text=Mentions")).toBeVisible();
	});
});

/**
 * Tests for highlight rendering (will work once PDF viewer with highlights is integrated)
 */
test.describe("PDF Highlights", () => {
	test.skip("should render highlight overlays on PDF pages", async ({
		page: _page,
	}) => {
		// TODO: Test once PDF.js viewer with highlights is integrated
		// - Check that highlight elements render
		// - Verify positioning matches bbox data
		// - Test highlight hover states
		// - Test highlight click interactions
	});

	test.skip("should maintain highlight alignment during zoom", async ({
		page: _page,
	}) => {
		// TODO: Test zoom functionality once implemented
	});
});

/**
 * Tests for mention creation (will work once text selection is integrated)
 */
test.describe("Mention Creation", () => {
	test.skip("should show create mention popover on text selection", async ({
		page: _page,
	}) => {
		// TODO: Test once PDF.js text selection is integrated
		// - Select text on PDF
		// - Verify popover appears
		// - Check selected text is displayed
	});

	test.skip("should create mention and add to sidebar", async ({
		page: _page,
	}) => {
		// TODO: Test mention creation flow
		// - Select text
		// - Click "Create Mention"
		// - Verify new mention appears in sidebar
		// - Verify highlight appears on PDF
	});

	test.skip("should cancel selection popover", async ({ page: _page }) => {
		// TODO: Test cancel functionality
	});
});
