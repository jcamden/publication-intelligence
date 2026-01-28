#!/usr/bin/env tsx

import { execSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

type WorkspaceInfo = {
	name: string;
	path: string;
	dependencies: string[];
};

type PackageJson = {
	name?: string;
	scripts?: Record<string, string>;
	dependencies?: Record<string, string>;
	devDependencies?: Record<string, string>;
};

const WORKSPACE_ROOTS = ["apps", "packages", "db"];
const VRT_PACKAGES = ["@pubint/yaboujee", "@pubint/index-pdf-frontend"];

const execCommand = ({ command }: { command: string }): string => {
	try {
		return execSync(command, { encoding: "utf-8", stdio: "pipe" });
	} catch (_error) {
		return "";
	}
};

const getChangedFiles = (): string[] => {
	const output = execCommand({ command: "git diff --cached --name-only" });
	return output.split("\n").filter((line) => line.trim());
};

const getWorkspaceFromPath = ({
	filePath,
}: {
	filePath: string;
}): string | null => {
	for (const root of WORKSPACE_ROOTS) {
		if (filePath.startsWith(`${root}/`)) {
			const parts = filePath.split("/");
			if (parts.length >= 2) {
				return join(root, parts[1]);
			}
		}
	}
	return null;
};

const readPackageJson = ({
	packageJsonPath,
}: {
	packageJsonPath: string;
}): PackageJson | null => {
	try {
		const content = readFileSync(packageJsonPath, "utf-8");
		return JSON.parse(content);
	} catch {
		return null;
	}
};

const getWorkspaceInfo = ({
	workspacePath,
}: {
	workspacePath: string;
}): WorkspaceInfo | null => {
	const packageJsonPath = join(process.cwd(), workspacePath, "package.json");

	if (!existsSync(packageJsonPath)) {
		return null;
	}

	const packageJson = readPackageJson({ packageJsonPath });
	if (!packageJson?.name) {
		return null;
	}

	const allDeps = {
		...packageJson.dependencies,
		...packageJson.devDependencies,
	};

	const workspaceDeps = Object.keys(allDeps).filter((dep) =>
		dep.startsWith("@pubint/"),
	);

	return {
		name: packageJson.name,
		path: workspacePath,
		dependencies: workspaceDeps,
	};
};

const getAllWorkspaces = (): WorkspaceInfo[] => {
	const workspaces: WorkspaceInfo[] = [];

	for (const root of WORKSPACE_ROOTS) {
		const rootPath = join(process.cwd(), root);
		if (!existsSync(rootPath)) continue;

		try {
			const dirs = readdirSync(rootPath, { withFileTypes: true })
				.filter((dirent) => dirent.isDirectory())
				.map((dirent) => dirent.name);

			for (const dir of dirs) {
				const workspacePath = join(root, dir);
				const info = getWorkspaceInfo({ workspacePath });
				if (info) {
					workspaces.push(info);
				}
			}
		} catch {}
	}

	return workspaces;
};

const findDependentWorkspaces = ({
	changedWorkspaceNames,
	allWorkspaces,
}: {
	changedWorkspaceNames: Set<string>;
	allWorkspaces: WorkspaceInfo[];
}): Set<string> => {
	const affected = new Set(changedWorkspaceNames);
	let changed = true;

	while (changed) {
		changed = false;
		for (const workspace of allWorkspaces) {
			if (affected.has(workspace.name)) continue;

			const dependsOnAffected = workspace.dependencies.some((dep) =>
				affected.has(dep),
			);

			if (dependsOnAffected) {
				affected.add(workspace.name);
				changed = true;
			}
		}
	}

	return affected;
};

const hasScript = ({
	workspacePath,
	scriptName,
}: {
	workspacePath: string;
	scriptName: string;
}): boolean => {
	const packageJsonPath = join(process.cwd(), workspacePath, "package.json");
	const packageJson = readPackageJson({ packageJsonPath });
	return !!packageJson?.scripts?.[scriptName];
};

const runTests = ({
	workspaceName,
	workspacePath,
}: {
	workspaceName: string;
	workspacePath: string;
}) => {
	console.log(`\n🧪 Testing ${workspaceName}...`);

	if (!hasScript({ workspacePath, scriptName: "test" })) {
		console.log(`  ⏭️  No test script found, skipping`);
		return;
	}

	try {
		execSync(`pnpm --filter "${workspaceName}" test`, {
			stdio: "inherit",
			encoding: "utf-8",
		});
		console.log(`  ✅ Tests passed`);
	} catch (error) {
		console.error(`  ❌ Tests failed`);
		throw error;
	}
};

const runVRT = ({ workspaceName }: { workspaceName: string }) => {
	console.log(`\n🎨 Running VRT for ${workspaceName}...`);

	const vrtScript =
		workspaceName === "@pubint/yaboujee" ? "vrt:yaboujee" : "vrt:frontend";

	try {
		execSync(`pnpm ${vrtScript}`, {
			stdio: "inherit",
			encoding: "utf-8",
		});
		console.log(`  ✅ VRT passed`);
	} catch (error) {
		console.error(`  ❌ VRT failed`);
		throw error;
	}
};

const runBiome = ({ workspacePath }: { workspacePath: string }) => {
	console.log(`\n🔍 Linting ${workspacePath}...`);

	try {
		execSync(`pnpm exec biome ci ${workspacePath}`, {
			stdio: "inherit",
			encoding: "utf-8",
		});
		console.log(`  ✅ Linting passed`);
	} catch (error) {
		console.error(`  ❌ Linting failed`);
		throw error;
	}
};

const runTypecheck = ({
	workspaceName,
	workspacePath,
}: {
	workspaceName: string;
	workspacePath: string;
}) => {
	console.log(`\n📘 Type checking ${workspaceName}...`);

	if (!hasScript({ workspacePath, scriptName: "typecheck" })) {
		console.log(`  ⏭️  No typecheck script found, skipping`);
		return;
	}

	try {
		execSync(`pnpm --filter "${workspaceName}" typecheck`, {
			stdio: "inherit",
			encoding: "utf-8",
		});
		console.log(`  ✅ Type check passed`);
	} catch (error) {
		console.error(`  ❌ Type check failed`);
		throw error;
	}
};

const runAccessPolicyLint = () => {
	console.log(`\n🔒 Checking access policies...`);

	try {
		execSync(`pnpm lint:access-policies`, {
			stdio: "inherit",
			encoding: "utf-8",
		});
		console.log(`  ✅ Access policies check passed`);
	} catch (error) {
		console.error(`  ❌ Access policies check failed`);
		throw error;
	}
};

const hasDbChanges = ({
	changedFiles,
}: {
	changedFiles: string[];
}): boolean => {
	return changedFiles.some((file) => file.startsWith("db/"));
};

const main = () => {
	const isDryRun = process.argv.includes("--dry-run");

	if (isDryRun) {
		console.log("🔍 DRY RUN: Detecting affected workspaces...\n");
	} else {
		console.log("🔍 Detecting affected workspaces...\n");
	}

	const changedFiles = getChangedFiles();

	if (changedFiles.length === 0) {
		console.log("No staged changes detected.");
		return;
	}

	const changedWorkspacePaths = new Set<string>();
	for (const file of changedFiles) {
		const workspace = getWorkspaceFromPath({ filePath: file });
		if (workspace) {
			changedWorkspacePaths.add(workspace);
		}
	}

	if (changedWorkspacePaths.size === 0) {
		console.log("No workspace changes detected.");
		return;
	}

	const allWorkspaces = getAllWorkspaces();
	const workspaceMap = new Map<string, WorkspaceInfo>(
		allWorkspaces.map((w) => [w.name, w]),
	);

	const changedWorkspaceNames = new Set<string>();
	for (const path of changedWorkspacePaths) {
		const info = getWorkspaceInfo({ workspacePath: path });
		if (info) {
			changedWorkspaceNames.add(info.name);
			console.log(`📝 Changed: ${info.name} (${path})`);
		}
	}

	const dbChanged = hasDbChanges({ changedFiles });
	if (dbChanged) {
		console.log("\n📁 Database changes detected");
		const backendName = "@pubint/index-pdf-backend";
		changedWorkspaceNames.add(backendName);
		console.log(
			`   Treating ${backendName} as changed due to database changes`,
		);
	}

	const affectedWorkspaceNames = findDependentWorkspaces({
		changedWorkspaceNames,
		allWorkspaces,
	});

	const dependentNames = [...affectedWorkspaceNames].filter(
		(name) => !changedWorkspaceNames.has(name),
	);

	if (dependentNames.length > 0) {
		console.log("\n📦 Dependent workspaces:");
		for (const name of dependentNames) {
			const info = workspaceMap.get(name);
			if (info) {
				console.log(`   ${name} (${info.path})`);
			}
		}
	}

	console.log(`\n🎯 Total affected workspaces: ${affectedWorkspaceNames.size}`);

	if (isDryRun) {
		console.log("\n📋 Would run for each affected workspace:");
		for (const workspaceName of affectedWorkspaceNames) {
			const workspace = workspaceMap.get(workspaceName);
			if (!workspace) continue;

			const hasTests = hasScript({
				workspacePath: workspace.path,
				scriptName: "test",
			});
			const hasTypecheck = hasScript({
				workspacePath: workspace.path,
				scriptName: "typecheck",
			});
			const hasVRT = VRT_PACKAGES.includes(workspaceName);

			console.log(`   ${workspaceName}:`);
			console.log(`     - Biome lint: ✅ yes`);
			console.log(
				`     - Type check: ${hasTypecheck ? "✅ yes" : "⏭️  skipped (no typecheck script)"}`,
			);
			console.log(
				`     - Unit tests: ${hasTests ? "✅ yes" : "⏭️  skipped (no test script)"}`,
			);
			console.log(
				`     - VRT tests: ${hasVRT ? "✅ yes" : "⏭️  skipped (no VRT)"}`,
			);
		}
		if (dbChanged) {
			console.log("\n📋 Would also run:");
			console.log("   - Access policy lint");
		}
		console.log("\n💡 Run without --dry-run to execute checks");
		return;
	}

	for (const workspaceName of affectedWorkspaceNames) {
		const workspace = workspaceMap.get(workspaceName);
		if (!workspace) continue;

		runBiome({ workspacePath: workspace.path });
		runTypecheck({ workspaceName, workspacePath: workspace.path });
		runTests({ workspaceName, workspacePath: workspace.path });

		if (VRT_PACKAGES.includes(workspaceName)) {
			runVRT({ workspaceName });
		}
	}

	if (dbChanged) {
		runAccessPolicyLint();
	}

	console.log("\n✅ All checks passed!");
};

main();
