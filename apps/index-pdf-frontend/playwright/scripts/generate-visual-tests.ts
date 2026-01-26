/**
 * Auto-generates Playwright visual regression test files from Storybook VRT stories
 * Scans all visual-regression-tests.stories.tsx files and generates corresponding
 * Playwright test files in playwright/components/
 */

import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

type StoryInfo = {
	componentName: string;
	storyPath: string;
	storyTitle: string;
	stories: Array<{
		name: string;
		exportName: string;
	}>;
};

const findVRTStories = ({ dir }: { dir: string }): string[] => {
	const results: string[] = [];

	const files = readdirSync(dir);

	for (const file of files) {
		const filePath = join(dir, file);
		const stat = statSync(filePath);

		if (stat.isDirectory()) {
			results.push(...findVRTStories({ dir: filePath }));
		} else if (file === "visual-regression-tests.stories.tsx") {
			results.push(filePath);
		}
	}

	return results;
};

const parseStoryFile = ({ filePath }: { filePath: string }): StoryInfo => {
	const content = readFileSync(filePath, "utf-8");

	// Extract component name from path: src/components/card/stories/tests/...
	const pathParts = filePath.split("/");
	const componentIndex = pathParts.indexOf("components");
	const componentName =
		componentIndex !== -1 ? pathParts[componentIndex + 1] : "unknown";

	// Extract title from default export
	const titleMatch = content.match(/title:\s*["']([^"']+)["']/);
	const storyTitle = titleMatch
		? titleMatch[1]
		: `Components/${componentName}/tests/Visual Regression Tests`;

	// Extract all exported stories (except default export)
	const storyRegex = /export const (\w+):/g;
	const stories: Array<{ name: string; exportName: string }> = [];

	const matches = content.matchAll(storyRegex);
	for (const match of matches) {
		const exportName = match[1];
		// Convert PascalCase to kebab-case for story ID
		const name = exportName
			.replace(/([A-Z])/g, "-$1")
			.toLowerCase()
			.slice(1);
		stories.push({ name, exportName });
	}

	return {
		componentName,
		storyPath: filePath,
		storyTitle,
		stories,
	};
};

const generateStoryId = ({
	title,
	storyName,
}: {
	title: string;
	storyName: string;
}): string => {
	// Convert "Components/Card/tests/Visual Regression Tests" to "components-card-tests-visual-regression-tests"
	const titlePart = title
		.toLowerCase()
		.replace(/\//g, "-")
		.replace(/\s+/g, "-");
	return `${titlePart}--${storyName}`;
};

const generatePlaywrightTest = ({
	storyInfo,
}: {
	storyInfo: StoryInfo;
}): string => {
	const { componentName, storyTitle, stories } = storyInfo;

	const tests = stories
		.map(({ name, exportName }) => {
			const storyId = generateStoryId({ title: storyTitle, storyName: name });
			const snapshotName = `${componentName}-${name}.png`;

			return `	test("${exportName}", async ({ page }) => {
		await page.goto(
			getStorybookUrl({
				storyId: "${storyId}",
			}),
		);
		await expect(page).toHaveScreenshot("${snapshotName}");
	});`;
		})
		.join("\n\n");

	return `/**
 * AUTO-GENERATED - DO NOT EDIT
 * Generated from: ${relative(process.cwd(), storyInfo.storyPath)}
 * Run: pnpm generate:visual-tests to regenerate
 */

import { test, expect } from "@playwright/test";

const getStorybookUrl = ({ storyId }: { storyId: string }) => {
	return \`/iframe.html?id=\${storyId}&viewMode=story\`;
};

test.describe("${componentName.charAt(0).toUpperCase() + componentName.slice(1)} - Visual Regression", () => {
${tests}
});
`;
};

const main = () => {
	const srcDir = join(process.cwd(), "src");
	const outputDir = join(process.cwd(), "playwright", "vrt");

	console.log("🔍 Scanning for visual regression test stories...\n");

	const vrtStoryFiles = findVRTStories({ dir: srcDir });

	if (vrtStoryFiles.length === 0) {
		console.log("⚠️  No visual regression test stories found");
		return;
	}

	console.log(`Found ${vrtStoryFiles.length} VRT story file(s):\n`);

	for (const storyFile of vrtStoryFiles) {
		const storyInfo = parseStoryFile({ filePath: storyFile });
		const outputFile = join(
			outputDir,
			`${storyInfo.componentName}.visual.spec.ts`,
		);

		const testContent = generatePlaywrightTest({ storyInfo });
		writeFileSync(outputFile, testContent);

		console.log(`✅ ${storyInfo.componentName}`);
		console.log(`   Stories: ${storyInfo.stories.length}`);
		console.log(`   Output: ${relative(process.cwd(), outputFile)}`);
		console.log();
	}

	console.log("🎉 Visual regression tests generated successfully!");
};

main();
