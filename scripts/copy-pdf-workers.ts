#!/usr/bin/env tsx

/**
 * Copy PDF.js Worker Files
 *
 * Automatically copies the PDF.js worker file from node_modules to the
 * required public directories after package installation.
 *
 * Run manually: pnpm tsx scripts/copy-pdf-workers.ts
 * Runs automatically: postinstall hook
 */

import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { getWorkspaceRoot } from "./workspace-utils.js";

const rootDir = getWorkspaceRoot();

type CopyTarget = {
	source: string;
	dest: string;
	description: string;
};

const workerFileName = "pdf.worker.min.mjs";

// Find the worker source file (handles both regular node_modules and pnpm .pnpm structure)
const findWorkerSource = (): string | null => {
	const possiblePaths = [
		// Regular node_modules
		join(rootDir, "node_modules/pdfjs-dist/build", workerFileName),
		// Try yaboujee's node_modules
		join(
			rootDir,
			"packages/yaboujee/node_modules/pdfjs-dist/build",
			workerFileName,
		),
		// Try index-pdf-frontend's node_modules
		join(
			rootDir,
			"apps/index-pdf-frontend/node_modules/pdfjs-dist/build",
			workerFileName,
		),
	];

	for (const path of possiblePaths) {
		if (existsSync(path)) {
			return path;
		}
	}

	// For pnpm .pnpm structure, find any version of pdfjs-dist
	const pnpmDir = join(rootDir, "node_modules/.pnpm");
	if (existsSync(pnpmDir)) {
		try {
			const pnpmContents = readdirSync(pnpmDir);
			const pdfjsDir = pnpmContents.find((dir) =>
				dir.startsWith("pdfjs-dist@"),
			);
			if (pdfjsDir) {
				const workerPath = join(
					pnpmDir,
					pdfjsDir,
					"node_modules/pdfjs-dist/build",
					workerFileName,
				);
				if (existsSync(workerPath)) {
					return workerPath;
				}
			}
		} catch {
			// Ignore errors when scanning pnpm directory
		}
	}

	return null;
};

const workerSource = findWorkerSource();

if (!workerSource) {
	console.error("❌ Could not find pdfjs-dist worker file in node_modules");
	console.error("   Make sure pdfjs-dist is installed");
	process.exit(1);
}

console.log(`📦 Found worker source: ${workerSource}\n`);

const targets: CopyTarget[] = [
	{
		source: workerSource,
		dest: join(rootDir, "packages/yaboujee/.storybook/public", workerFileName),
		description: "yaboujee Storybook",
	},
	{
		source: workerSource,
		dest: join(rootDir, "apps/index-pdf-frontend/public", workerFileName),
		description: "index-pdf-frontend (app + Storybook)",
	},
];

const copyWorkerFiles = () => {
	console.log("📄 Copying PDF.js worker files...\n");

	let successCount = 0;
	let skipCount = 0;
	let errorCount = 0;

	for (const target of targets) {
		try {
			// Check if source exists
			if (!existsSync(target.source)) {
				console.log(`⚠️  Source not found: ${target.source}`);
				console.log(`   Skipping ${target.description}\n`);
				skipCount++;
				continue;
			}

			// Ensure destination directory exists
			const destDir = dirname(target.dest);
			if (!existsSync(destDir)) {
				mkdirSync(destDir, { recursive: true });
				console.log(`✨ Created directory: ${destDir}`);
			}

			// Copy file
			copyFileSync(target.source, target.dest);
			console.log(`✅ Copied to ${target.description}`);
			console.log(`   ${target.dest}\n`);
			successCount++;
		} catch (error) {
			console.error(`❌ Failed to copy to ${target.description}`);
			console.error(
				`   ${error instanceof Error ? error.message : String(error)}\n`,
			);
			errorCount++;
		}
	}

	// Summary
	console.log("─".repeat(50));
	console.log(`✅ Success: ${successCount}`);
	if (skipCount > 0) {
		console.log(`⚠️  Skipped: ${skipCount}`);
	}
	if (errorCount > 0) {
		console.log(`❌ Errors: ${errorCount}`);
		process.exit(1);
	}
	console.log("─".repeat(50));
	console.log("✨ PDF.js worker files are ready!\n");
};

copyWorkerFiles();
