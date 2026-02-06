import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

let cachedWorkspaceRoot: string | null = null;

/**
 * Find the workspace root by walking up the directory tree.
 * Looks for pnpm-workspace.yaml as the marker for the monorepo root.
 */
const findWorkspaceRoot = (): string => {
	if (cachedWorkspaceRoot) {
		return cachedWorkspaceRoot;
	}

	let currentDir = dirname(fileURLToPath(import.meta.url));
	let iterations = 0;
	const maxIterations = 20;

	while (iterations < maxIterations) {
		const workspaceYaml = join(currentDir, "pnpm-workspace.yaml");
		if (existsSync(workspaceYaml)) {
			cachedWorkspaceRoot = currentDir;
			return currentDir;
		}

		const parentDir = dirname(currentDir);
		if (parentDir === currentDir) {
			throw new Error(
				"Could not find workspace root (no pnpm-workspace.yaml found)",
			);
		}

		currentDir = parentDir;
		iterations++;
	}

	throw new Error(
		`Could not find workspace root after ${maxIterations} iterations`,
	);
};

/**
 * Resolve a path relative to the workspace root.
 *
 * @example
 * const envPath = resolveFromWorkspaceRoot(".env");
 */
export const resolveFromWorkspaceRoot = (relativePath: string): string => {
	return join(findWorkspaceRoot(), relativePath);
};
