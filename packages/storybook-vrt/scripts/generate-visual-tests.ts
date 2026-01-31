#!/usr/bin/env tsx
/**
 * Auto-generates Playwright visual regression test files from Storybook VRT stories
 * Scans visual-regression-tests.stories.tsx files and generates corresponding
 * Playwright test files organized by package
 *
 * Usage:
 *   pnpm generate --package yaboujee
 *   pnpm generate --package index-pdf-frontend
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
		globals?: Record<string, unknown>;
	}>;
};

type Config = {
	packageName: string;
	searchDirs: string[];
	outputDir: string;
};

const parseArgs = (): Config => {
	const args = process.argv.slice(2);
	const packageIndex = args.indexOf("--package");

	if (packageIndex === -1 || !args[packageIndex + 1]) {
		console.error("❌ Missing --package argument");
		console.log("\nUsage:");
		console.log("  pnpm generate --package yaboujee");
		console.log("  pnpm generate --package index-pdf-frontend");
		process.exit(1);
	}

	const packageName = args[packageIndex + 1];
	const monorepoRoot = join(process.cwd(), "../..");

	// Search in both packages/ and apps/
	const searchDirs = [
		join(monorepoRoot, "packages", packageName, "src"),
		join(monorepoRoot, "apps", packageName, "src"),
	].filter((dir) => {
		try {
			statSync(dir);
			return true;
		} catch {
			return false;
		}
	});

	if (searchDirs.length === 0) {
		console.error(
			`❌ Package "${packageName}" not found in packages/ or apps/`,
		);
		process.exit(1);
	}

	return {
		packageName,
		searchDirs,
		outputDir: join(process.cwd(), "suites", packageName, "tests"),
	};
};

const findVRTStories = ({ dir }: { dir: string }): string[] => {
	const results: string[] = [];

	try {
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
	} catch (_error) {
		// Skip directories that can't be read
	}

	return results;
};

const parseStoryFile = ({ filePath }: { filePath: string }): StoryInfo => {
	const content = readFileSync(filePath, "utf-8");

	// Extract component name from path by finding "stories" dir and using its parent
	// e.g., .../login-form/stories/tests/... -> "login-form"
	const pathParts = filePath.split("/");
	const storiesIndex = pathParts.indexOf("stories");
	const componentName =
		storiesIndex !== -1 && storiesIndex > 0
			? pathParts[storiesIndex - 1]
			: "unknown";

	// Extract title from default export
	const titleMatch = content.match(/title:\s*["']([^"']+)["']/);
	const storyTitle = titleMatch
		? titleMatch[1]
		: `Components/${componentName}/tests/Visual Regression Tests`;

	// Extract all exported stories with their globals
	const stories: Array<{
		name: string;
		exportName: string;
		globals?: Record<string, unknown>;
	}> = [];

	// 1. Match direct exports: export const Name: StoryObj<...> = { ... }; or export const Name: Story = { ... };
	const storyRegex =
		/export const (\w+):\s*(?:StoryObj[^=]*|Story)\s*=\s*{([\s\S]*?)^};/gm;
	const matches = content.matchAll(storyRegex);
	for (const match of matches) {
		const exportName = match[1];
		const storyBody = match[2];

		// Convert PascalCase to kebab-case for story ID
		const name = exportName
			.replace(/([A-Z])/g, "-$1")
			.toLowerCase()
			.slice(1);

		// Extract globals object if present (handles nested objects)
		let globals: Record<string, unknown> | undefined;
		// Match globals block including nested objects
		const globalsMatch = storyBody.match(/globals:\s*\{([\s\S]*?)\n\t\}/);
		if (globalsMatch) {
			try {
				// Parse globals object (basic parsing - handles theme and viewport.value)
				const globalsStr = globalsMatch[1];
				globals = {};

				// Extract theme
				const themeMatch = globalsStr.match(/theme:\s*["'](\w+)["']/);
				if (themeMatch) {
					globals.theme = themeMatch[1];
				}

				// Extract viewport.value (handles nested object)
				const viewportMatch = globalsStr.match(
					/viewport:\s*\{\s*value:\s*["']([^"']+)["']\s*\}/,
				);
				if (viewportMatch) {
					globals["viewport.value"] = viewportMatch[1];
				}
			} catch (e) {
				// If parsing fails, continue without globals
				console.warn(`⚠️  Failed to parse globals for ${exportName}:`, e);
			}
		}

		stories.push({ name, exportName, globals });
	}

	// 2. Match re-exports: export { Name1, Name2 } from "./shared";
	const reExportRegex = /export\s*\{([^}]+)\}\s*from\s*["']([^"']+)["']/g;
	const reExportMatches = content.matchAll(reExportRegex);
	for (const match of reExportMatches) {
		const exports = match[1]
			.split(",")
			.map((exp) => exp.trim())
			.filter((exp) => exp.length > 0);
		const importPath = match[2];

		// Resolve the shared file path
		const fileDir = filePath.substring(0, filePath.lastIndexOf("/"));
		const sharedFilePath = join(
			fileDir,
			importPath.endsWith(".tsx") ? importPath : `${importPath}.tsx`,
		);

		// Try to read and parse the shared file
		let sharedContent = "";
		try {
			sharedContent = readFileSync(sharedFilePath, "utf-8");
		} catch (_e) {
			console.warn(
				`⚠️  Could not read shared file ${sharedFilePath}, using undefined globals`,
			);
		}

		for (const exportName of exports) {
			// Convert PascalCase to kebab-case for story ID
			const name = exportName
				.replace(/([A-Z])/g, "-$1")
				.toLowerCase()
				.slice(1);

			let globals: Record<string, unknown> | undefined;

			// Try to extract globals from the shared file
			if (sharedContent) {
				const storyDefRegex = new RegExp(
					`export const ${exportName}:\\s*(?:StoryObj[^=]*|Story)\\s*=\\s*{([\\s\\S]*?)^};`,
					"m",
				);
				const storyDefMatch = sharedContent.match(storyDefRegex);
				if (storyDefMatch) {
					const storyBody = storyDefMatch[1];
					const globalsMatch = storyBody.match(/globals:\s*\{([\s\S]*?)\n\t\}/);
					if (globalsMatch) {
						try {
							const globalsStr = globalsMatch[1];
							globals = {};

							// Extract theme
							const themeMatch = globalsStr.match(/theme:\s*["'](\w+)["']/);
							if (themeMatch) {
								globals.theme = themeMatch[1];
							}

							// Extract viewport.value
							const viewportMatch = globalsStr.match(
								/viewport:\s*\{\s*value:\s*["']([^"']+)["']\s*\}/,
							);
							if (viewportMatch) {
								globals["viewport.value"] = viewportMatch[1];
							}
						} catch (e) {
							console.warn(
								`⚠️  Failed to parse globals for ${exportName} from shared file:`,
								e,
							);
						}
					}
				}
			}

			stories.push({ name, exportName, globals });
		}
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

const VIEWPORT_SIZES: Record<string, { width: number; height: number }> = {
	mobile1: { width: 375, height: 667 },
	mobile2: { width: 414, height: 896 },
	tablet: { width: 768, height: 1024 },
};

const generatePlaywrightTest = ({
	storyInfo,
	packageName,
}: {
	storyInfo: StoryInfo;
	packageName: string;
}): string => {
	const { componentName, storyTitle, stories } = storyInfo;

	const tests = stories
		.map(({ name, exportName, globals }) => {
			const storyId = generateStoryId({ title: storyTitle, storyName: name });
			const snapshotName = `${componentName}-${name}.png`;

			// Check if viewport needs to be set
			const viewportValue = globals?.["viewport.value"] as string | undefined;
			const viewportSetup = viewportValue
				? `\n\t\tawait page.setViewportSize({ width: ${VIEWPORT_SIZES[viewportValue]?.width || 375}, height: ${VIEWPORT_SIZES[viewportValue]?.height || 667} });`
				: "";

			return `	test("${exportName}", async ({ page }) => {${viewportSetup}
		await page.goto(
			getStorybookUrl({
				storyId: "${storyId}",
				globals: ${globals ? JSON.stringify(globals) : "undefined"},
			}),
		);
		
		// Wait for Storybook to finish loading
		await page.waitForLoadState("networkidle");
		
		// Wait for all images to load
		await page.waitForFunction(() =>
			Array.from(document.images).every((img) => img.complete)
		);
		
		await expect(page).toHaveScreenshot("${snapshotName}", {
			animations: "disabled",
		});
	});`;
		})
		.join("\n\n");

	return `/**
 * AUTO-GENERATED - DO NOT EDIT
 * Package: ${packageName}
 * Generated from: ${relative(process.cwd(), storyInfo.storyPath)}
 * Run: pnpm generate --package ${packageName} to regenerate
 */

import { test, expect } from "@playwright/test";

const getStorybookUrl = ({
	storyId,
	globals,
}: {
	storyId: string;
	globals?: Record<string, unknown>;
}) => {
	let url = \`/iframe.html?id=\${storyId}&viewMode=story\`;
	
	if (globals && Object.keys(globals).length > 0) {
		const globalsStr = Object.entries(globals)
			.map(([key, value]) => \`\${key}:\${value}\`)
			.join(";");
		url += \`&globals=\${globalsStr}\`;
	}
	
	return url;
};

test.describe("${componentName.charAt(0).toUpperCase() + componentName.slice(1)} - Visual Regression", () => {
${tests}
});
`;
};

const main = async () => {
	const config = parseArgs();
	const { packageName, searchDirs, outputDir } = config;

	console.log(`🔍 Scanning package: ${packageName}\n`);
	console.log(`Search directories:`);
	for (const dir of searchDirs) {
		console.log(`  - ${relative(join(process.cwd(), "../.."), dir)}`);
	}
	console.log();

	// Find all VRT story files across all search directories
	const allVrtStoryFiles: string[] = [];
	for (const dir of searchDirs) {
		allVrtStoryFiles.push(...findVRTStories({ dir }));
	}

	if (allVrtStoryFiles.length === 0) {
		console.log("⚠️  No visual regression test stories found");
		return;
	}

	console.log(`Found ${allVrtStoryFiles.length} VRT story file(s):\n`);

	// Create output directory if it doesn't exist
	const fs = await import("node:fs/promises");
	await fs.mkdir(outputDir, { recursive: true });

	for (const storyFile of allVrtStoryFiles) {
		const storyInfo = parseStoryFile({ filePath: storyFile });
		const outputFile = join(
			outputDir,
			`${storyInfo.componentName}.visual.spec.ts`,
		);

		const testContent = generatePlaywrightTest({ storyInfo, packageName });
		writeFileSync(outputFile, testContent);

		console.log(`✅ ${storyInfo.componentName}`);
		console.log(`   Stories: ${storyInfo.stories.length}`);
		console.log(`   Output: ${relative(process.cwd(), outputFile)}`);
		console.log();
	}

	console.log("🎉 Visual regression tests generated successfully!");
	console.log(`\nNext steps:`);
	console.log(
		`  1. Review generated tests in: ${relative(process.cwd(), outputDir)}`,
	);
	console.log(`  2. Run tests: PACKAGE=${packageName} pnpm test:vrt`);
	console.log(
		`  3. Update snapshots: PACKAGE=${packageName} pnpm test:vrt:update`,
	);
};

main();
