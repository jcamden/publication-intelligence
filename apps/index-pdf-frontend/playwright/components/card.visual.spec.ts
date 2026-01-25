import { test, expect } from "@playwright/test";

const getStorybookUrl = ({ storyId }: { storyId: string }) => {
	return `/iframe.html?id=${storyId}&viewMode=story`;
};

test.describe("Card Component - Visual Regression", () => {
	test("Empty card", async ({ page }) => {
		await page.goto(
			getStorybookUrl({
				storyId: "components-card-tests-visual-regression-tests--empty",
			}),
		);
		await page.waitForSelector('[data-testid="empty-card"]', {
			state: "visible",
			timeout: 5000,
		});
		await expect(page).toHaveScreenshot("card-empty.png");
	});

	test("Card with low elevation", async ({ page }) => {
		await page.goto(
			getStorybookUrl({
				storyId:
					"components-card-tests-visual-regression-tests--with-low-elevation",
			}),
		);
		await expect(page).toHaveScreenshot("card-low-elevation.png");
	});

	test("Card with medium elevation", async ({ page }) => {
		await page.goto(
			getStorybookUrl({
				storyId:
					"components-card-tests-visual-regression-tests--with-medium-elevation",
			}),
		);
		await expect(page).toHaveScreenshot("card-medium-elevation.png");
	});

	test("Card with high elevation", async ({ page }) => {
		await page.goto(
			getStorybookUrl({
				storyId:
					"components-card-tests-visual-regression-tests--with-high-elevation",
			}),
		);
		await expect(page).toHaveScreenshot("card-high-elevation.png");
	});

	test("Card with contents", async ({ page }) => {
		await page.goto(
			getStorybookUrl({
				storyId: "components-card-tests-visual-regression-tests--with-contents",
			}),
		);
		await expect(page).toHaveScreenshot("card-with-contents.png");
	});

	test("Card with contents and low elevation", async ({ page }) => {
		await page.goto(
			getStorybookUrl({
				storyId:
					"components-card-tests-visual-regression-tests--with-contents-and-low-elevation",
			}),
		);
		await expect(page).toHaveScreenshot(
			"card-with-contents-and-low-elevation.png",
		);
	});

	test("Card with contents and medium elevation", async ({ page }) => {
		await page.goto(
			getStorybookUrl({
				storyId:
					"components-card-tests-visual-regression-tests--with-contents-and-medium-elevation",
			}),
		);
		await expect(page).toHaveScreenshot(
			"card-with-contents-and-medium-elevation.png",
		);
	});

	test("Card with contents and high elevation", async ({ page }) => {
		await page.goto(
			getStorybookUrl({
				storyId:
					"components-card-tests-visual-regression-tests--with-contents-and-high-elevation",
			}),
		);
		await expect(page).toHaveScreenshot(
			"card-with-contents-and-high-elevation.png",
		);
	});

	test("Card on small viewport", async ({ page }) => {
		await page.goto(
			getStorybookUrl({
				storyId:
					"components-card-tests-visual-regression-tests--small-viewport",
			}),
		);
		await page.setViewportSize({ width: 375, height: 667 });
		await expect(page).toHaveScreenshot("card-small-viewport.png");
	});

	test("Card with long content", async ({ page }) => {
		await page.goto(
			getStorybookUrl({
				storyId: "components-card-tests-visual-regression-tests--long-content",
			}),
		);
		await expect(page).toHaveScreenshot("card-long-content.png");
	});

	test("Multiple cards layout", async ({ page }) => {
		await page.goto(
			getStorybookUrl({
				storyId:
					"components-card-tests-visual-regression-tests--multiple-cards-layout",
			}),
		);
		await expect(page).toHaveScreenshot("card-multiple-layout.png");
	});

	test("Card on dark background", async ({ page }) => {
		await page.goto(
			getStorybookUrl({
				storyId:
					"components-card-tests-visual-regression-tests--dark-background",
			}),
		);
		await expect(page).toHaveScreenshot("card-dark-background.png");
	});
});
