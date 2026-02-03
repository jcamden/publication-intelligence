#!/usr/bin/env tsx
/**
 * Deletes orphaned VRT snapshots that no longer have corresponding tests
 *
 * Usage:
 *   pnpm clean --package yaboujee
 *   pnpm clean --package index-pdf-frontend
 *   pnpm clean --package yaboujee --dry-run (preview without deleting)
 */

import { readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { join, relative } from "node:path";

type Config = {
	packageName: string;
	snapshotsDir: string;
	testsDir: string;
	dryRun: boolean;
};

type OrphanedItem = {
	type: "directory" | "file";
	path: string;
	parentDir?: string;
	snapshotCount?: number;
};

const parseArgs = (): Config => {
	const args = process.argv.slice(2);
	const packageIndex = args.indexOf("--package");
	const dryRun = args.includes("--dry-run");

	if (packageIndex === -1 || !args[packageIndex + 1]) {
		console.error("❌ Missing --package argument");
		console.log("\nUsage:");
		console.log("  pnpm clean --package yaboujee");
		console.log("  pnpm clean --package index-pdf-frontend");
		console.log("  pnpm clean --package yaboujee --dry-run");
		process.exit(1);
	}

	const packageName = args[packageIndex + 1];
	const suiteDir = join(process.cwd(), "suites", packageName);

	try {
		statSync(suiteDir);
	} catch {
		console.error(`❌ Package suite not found: ${packageName}`);
		console.log("\nAvailable packages:");
		const suitesDir = join(process.cwd(), "suites");
		try {
			const packages = readdirSync(suitesDir).filter((name) => {
				const stat = statSync(join(suitesDir, name));
				return stat.isDirectory() && name !== ".gitkeep";
			});
			for (const pkg of packages) {
				console.log(`  - ${pkg}`);
			}
		} catch {
			console.log("  (no packages found)");
		}
		process.exit(1);
	}

	return {
		packageName,
		snapshotsDir: join(suiteDir, "__snapshots__"),
		testsDir: join(suiteDir, "tests"),
		dryRun,
	};
};

const extractSnapshotNames = ({
	testFilePath,
}: {
	testFilePath: string;
}): Set<string> => {
	const content = readFileSync(testFilePath, "utf-8");
	const snapshotNames = new Set<string>();

	// Match toHaveScreenshot("filename.png")
	const regex = /toHaveScreenshot\(["']([^"']+)["']/g;
	const matches = content.matchAll(regex);

	for (const match of matches) {
		snapshotNames.add(match[1]);
	}

	return snapshotNames;
};

const findOrphanedSnapshots = ({
	snapshotsDir,
	testsDir,
}: {
	snapshotsDir: string;
	testsDir: string;
}): OrphanedItem[] => {
	const orphaned: OrphanedItem[] = [];

	try {
		const snapshotDirs = readdirSync(snapshotsDir);

		for (const snapshotDir of snapshotDirs) {
			const snapshotPath = join(snapshotsDir, snapshotDir);
			const stat = statSync(snapshotPath);

			// Only process directories (snapshot dirs match test file names)
			if (!stat.isDirectory()) {
				continue;
			}

			// Check if corresponding test file exists
			// Snapshot dir: "component-name.visual.spec.ts"
			// Test file: "tests/component-name.visual.spec.ts"
			const testFilePath = join(testsDir, snapshotDir);

			try {
				statSync(testFilePath);

				// Test file exists - check for orphaned snapshot files within this directory
				const expectedSnapshots = extractSnapshotNames({ testFilePath });
				const actualSnapshots = readdirSync(snapshotPath).filter((file) =>
					file.endsWith(".png"),
				);

				for (const snapshotFile of actualSnapshots) {
					if (!expectedSnapshots.has(snapshotFile)) {
						// This snapshot file doesn't have a corresponding test
						orphaned.push({
							type: "file",
							path: join(snapshotPath, snapshotFile),
							parentDir: snapshotDir,
						});
					}
				}
			} catch {
				// Test file doesn't exist - entire directory is orphaned
				const snapshotFiles = readdirSync(snapshotPath).filter((file) =>
					file.endsWith(".png"),
				);
				orphaned.push({
					type: "directory",
					path: snapshotPath,
					snapshotCount: snapshotFiles.length,
				});
			}
		}
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === "ENOENT") {
			console.log("⚠️  No __snapshots__ directory found - nothing to clean");
			return [];
		}
		throw error;
	}

	return orphaned;
};

const main = async () => {
	const config = parseArgs();
	const { packageName, snapshotsDir, testsDir, dryRun } = config;

	console.log(`🔍 Scanning package: ${packageName}`);
	console.log(`Snapshots: ${relative(process.cwd(), snapshotsDir)}`);
	console.log(`Tests: ${relative(process.cwd(), testsDir)}\n`);

	if (dryRun) {
		console.log("🔬 DRY RUN MODE - No files will be deleted\n");
	}

	const orphaned = findOrphanedSnapshots({ snapshotsDir, testsDir });

	if (orphaned.length === 0) {
		console.log("✅ No orphaned snapshots found - everything is clean!");
		return;
	}

	const orphanedDirs = orphaned.filter((item) => item.type === "directory");
	const orphanedFiles = orphaned.filter((item) => item.type === "file");

	let _totalItems = 0;
	let totalSnapshots = 0;

	// Report orphaned directories
	if (orphanedDirs.length > 0) {
		console.log(
			`Found ${orphanedDirs.length} orphaned snapshot director${orphanedDirs.length === 1 ? "y" : "ies"}:\n`,
		);

		for (const item of orphanedDirs) {
			const dirName = item.path.split("/").pop();
			totalSnapshots += item.snapshotCount || 0;
			_totalItems += item.snapshotCount || 0;

			console.log(`📁 ${dirName}`);
			console.log(`   Snapshots: ${item.snapshotCount}`);
			console.log(`   Path: ${relative(process.cwd(), item.path)}`);

			if (!dryRun) {
				rmSync(item.path, { recursive: true, force: true });
				console.log("   ✅ Deleted");
			} else {
				console.log("   🔬 Would delete (dry run)");
			}
			console.log();
		}
	}

	// Report orphaned files
	if (orphanedFiles.length > 0) {
		console.log(
			`Found ${orphanedFiles.length} orphaned snapshot file${orphanedFiles.length === 1 ? "" : "s"}:\n`,
		);

		// Group by parent directory for cleaner output
		const filesByDir = new Map<string, OrphanedItem[]>();
		for (const item of orphanedFiles) {
			const parentDir = item.parentDir || "unknown";
			if (!filesByDir.has(parentDir)) {
				filesByDir.set(parentDir, []);
			}
			filesByDir.get(parentDir)?.push(item);
		}

		for (const [parentDir, files] of filesByDir) {
			console.log(`📁 ${parentDir}`);
			_totalItems += files.length;
			totalSnapshots += files.length;

			for (const item of files) {
				const fileName = item.path.split("/").pop();
				console.log(`   🗑️  ${fileName}`);

				if (!dryRun) {
					rmSync(item.path, { force: true });
				}
			}

			if (!dryRun) {
				console.log(
					`   ✅ Deleted ${files.length} file${files.length === 1 ? "" : "s"}`,
				);
			} else {
				console.log(
					`   🔬 Would delete ${files.length} file${files.length === 1 ? "" : "s"} (dry run)`,
				);
			}
			console.log();
		}
	}

	if (dryRun) {
		console.log("🔬 DRY RUN COMPLETE");
		const dirMsg =
			orphanedDirs.length > 0
				? `${orphanedDirs.length} director${orphanedDirs.length === 1 ? "y" : "ies"}`
				: "";
		const fileMsg =
			orphanedFiles.length > 0
				? `${orphanedFiles.length} file${orphanedFiles.length === 1 ? "" : "s"}`
				: "";
		const items = [dirMsg, fileMsg].filter(Boolean).join(" and ");
		console.log(
			`Would delete ${items} (${totalSnapshots} total snapshot${totalSnapshots === 1 ? "" : "s"})`,
		);
		console.log("\nRun without --dry-run to actually delete these snapshots");
	} else {
		console.log("🎉 Cleanup complete!");
		const dirMsg =
			orphanedDirs.length > 0
				? `${orphanedDirs.length} director${orphanedDirs.length === 1 ? "y" : "ies"}`
				: "";
		const fileMsg =
			orphanedFiles.length > 0
				? `${orphanedFiles.length} file${orphanedFiles.length === 1 ? "" : "s"}`
				: "";
		const items = [dirMsg, fileMsg].filter(Boolean).join(" and ");
		console.log(
			`Deleted ${items} (${totalSnapshots} total snapshot${totalSnapshots === 1 ? "" : "s"})`,
		);
	}
};

main();
