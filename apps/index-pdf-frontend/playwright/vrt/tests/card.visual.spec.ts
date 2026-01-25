/**
 * AUTO-GENERATED - DO NOT EDIT
 * Generated from: src/components/card/stories/tests/visual-regression-tests.stories.tsx
 * Run: pnpm generate:visual-tests to regenerate
 */

import { expect, test } from "@playwright/test";

const getStorybookUrl = ({ storyId }: { storyId: string }) => {
	return `/iframe.html?id=${storyId}&viewMode=story`;
};

test.describe("Card - Visual Regression", () => {
	test("Empty", async ({ page }) => {
		await page.goto(
			getStorybookUrl({
				storyId: "components-card-tests-visual-regression-tests--empty",
			}),
		);
		await expect(page).toHaveScreenshot("card-empty.png");
	});

	test("WithLowElevation", async ({ page }) => {
		await page.goto(
			getStorybookUrl({
				storyId:
					"components-card-tests-visual-regression-tests--with-low-elevation",
			}),
		);
		await expect(page).toHaveScreenshot("card-with-low-elevation.png");
	});

	test("WithMediumElevation", async ({ page }) => {
		await page.goto(
			getStorybookUrl({
				storyId:
					"components-card-tests-visual-regression-tests--with-medium-elevation",
			}),
		);
		await expect(page).toHaveScreenshot("card-with-medium-elevation.png");
	});

	test("WithHighElevation", async ({ page }) => {
		await page.goto(
			getStorybookUrl({
				storyId:
					"components-card-tests-visual-regression-tests--with-high-elevation",
			}),
		);
		await expect(page).toHaveScreenshot("card-with-high-elevation.png");
	});

	test("WithContents", async ({ page }) => {
		await page.goto(
			getStorybookUrl({
				storyId: "components-card-tests-visual-regression-tests--with-contents",
			}),
		);
		await expect(page).toHaveScreenshot("card-with-contents.png");
	});

	test("WithContentsAndLowElevation", async ({ page }) => {
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

	test("WithContentsAndMediumElevation", async ({ page }) => {
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

	test("WithContentsAndHighElevation", async ({ page }) => {
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

	test("SmallViewport", async ({ page }) => {
		await page.goto(
			getStorybookUrl({
				storyId:
					"components-card-tests-visual-regression-tests--small-viewport",
			}),
		);
		await expect(page).toHaveScreenshot("card-small-viewport.png");
	});

	test("LongContent", async ({ page }) => {
		await page.goto(
			getStorybookUrl({
				storyId: "components-card-tests-visual-regression-tests--long-content",
			}),
		);
		await expect(page).toHaveScreenshot("card-long-content.png");
	});

	test("MultipleCardsLayout", async ({ page }) => {
		await page.goto(
			getStorybookUrl({
				storyId:
					"components-card-tests-visual-regression-tests--multiple-cards-layout",
			}),
		);
		await expect(page).toHaveScreenshot("card-multiple-cards-layout.png");
	});

	test("DarkBackground", async ({ page }) => {
		await page.goto(
			getStorybookUrl({
				storyId:
					"components-card-tests-visual-regression-tests--dark-background",
			}),
		);
		await expect(page).toHaveScreenshot("card-dark-background.png");
	});
});
