/**
 * AUTO-GENERATED - DO NOT EDIT
 * Generated from: src/components/button/stories/tests/visual-regression-tests.stories.tsx
 * Run: pnpm generate:visual-tests to regenerate
 */

import { expect, test } from "@playwright/test";

const getStorybookUrl = ({ storyId }: { storyId: string }) => {
	return `/iframe.html?id=${storyId}&viewMode=story`;
};

test.describe("Button - Visual Regression", () => {
	test("PrimaryVariant", async ({ page }) => {
		await page.goto(
			getStorybookUrl({
				storyId:
					"components-button-tests-visual-regression-tests--primary-variant",
			}),
		);
		await expect(page).toHaveScreenshot("button-primary-variant.png");
	});

	test("SecondaryVariant", async ({ page }) => {
		await page.goto(
			getStorybookUrl({
				storyId:
					"components-button-tests-visual-regression-tests--secondary-variant",
			}),
		);
		await expect(page).toHaveScreenshot("button-secondary-variant.png");
	});

	test("OutlineVariant", async ({ page }) => {
		await page.goto(
			getStorybookUrl({
				storyId:
					"components-button-tests-visual-regression-tests--outline-variant",
			}),
		);
		await expect(page).toHaveScreenshot("button-outline-variant.png");
	});

	test("GhostVariant", async ({ page }) => {
		await page.goto(
			getStorybookUrl({
				storyId:
					"components-button-tests-visual-regression-tests--ghost-variant",
			}),
		);
		await expect(page).toHaveScreenshot("button-ghost-variant.png");
	});

	test("SmallSize", async ({ page }) => {
		await page.goto(
			getStorybookUrl({
				storyId: "components-button-tests-visual-regression-tests--small-size",
			}),
		);
		await expect(page).toHaveScreenshot("button-small-size.png");
	});

	test("MediumSize", async ({ page }) => {
		await page.goto(
			getStorybookUrl({
				storyId: "components-button-tests-visual-regression-tests--medium-size",
			}),
		);
		await expect(page).toHaveScreenshot("button-medium-size.png");
	});

	test("LargeSize", async ({ page }) => {
		await page.goto(
			getStorybookUrl({
				storyId: "components-button-tests-visual-regression-tests--large-size",
			}),
		);
		await expect(page).toHaveScreenshot("button-large-size.png");
	});

	test("DisabledState", async ({ page }) => {
		await page.goto(
			getStorybookUrl({
				storyId:
					"components-button-tests-visual-regression-tests--disabled-state",
			}),
		);
		await expect(page).toHaveScreenshot("button-disabled-state.png");
	});

	test("DisabledPrimary", async ({ page }) => {
		await page.goto(
			getStorybookUrl({
				storyId:
					"components-button-tests-visual-regression-tests--disabled-primary",
			}),
		);
		await expect(page).toHaveScreenshot("button-disabled-primary.png");
	});

	test("DisabledOutline", async ({ page }) => {
		await page.goto(
			getStorybookUrl({
				storyId:
					"components-button-tests-visual-regression-tests--disabled-outline",
			}),
		);
		await expect(page).toHaveScreenshot("button-disabled-outline.png");
	});

	test("AllVariantsComparison", async ({ page }) => {
		await page.goto(
			getStorybookUrl({
				storyId:
					"components-button-tests-visual-regression-tests--all-variants-comparison",
			}),
		);
		await expect(page).toHaveScreenshot("button-all-variants-comparison.png");
	});

	test("AllSizesComparison", async ({ page }) => {
		await page.goto(
			getStorybookUrl({
				storyId:
					"components-button-tests-visual-regression-tests--all-sizes-comparison",
			}),
		);
		await expect(page).toHaveScreenshot("button-all-sizes-comparison.png");
	});

	test("ButtonGroup", async ({ page }) => {
		await page.goto(
			getStorybookUrl({
				storyId:
					"components-button-tests-visual-regression-tests--button-group",
			}),
		);
		await expect(page).toHaveScreenshot("button-button-group.png");
	});

	test("VerticalButtonStack", async ({ page }) => {
		await page.goto(
			getStorybookUrl({
				storyId:
					"components-button-tests-visual-regression-tests--vertical-button-stack",
			}),
		);
		await expect(page).toHaveScreenshot("button-vertical-button-stack.png");
	});

	test("LongTextButton", async ({ page }) => {
		await page.goto(
			getStorybookUrl({
				storyId:
					"components-button-tests-visual-regression-tests--long-text-button",
			}),
		);
		await expect(page).toHaveScreenshot("button-long-text-button.png");
	});

	test("SmallViewportLayout", async ({ page }) => {
		await page.goto(
			getStorybookUrl({
				storyId:
					"components-button-tests-visual-regression-tests--small-viewport-layout",
			}),
		);
		await expect(page).toHaveScreenshot("button-small-viewport-layout.png");
	});

	test("DarkBackground", async ({ page }) => {
		await page.goto(
			getStorybookUrl({
				storyId:
					"components-button-tests-visual-regression-tests--dark-background",
			}),
		);
		await expect(page).toHaveScreenshot("button-dark-background.png");
	});

	test("WithIconLikeContent", async ({ page }) => {
		await page.goto(
			getStorybookUrl({
				storyId:
					"components-button-tests-visual-regression-tests--with-icon-like-content",
			}),
		);
		await expect(page).toHaveScreenshot("button-with-icon-like-content.png");
	});
});
