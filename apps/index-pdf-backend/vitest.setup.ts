/**
 * Vitest Setup - Loads environment variables BEFORE any modules are imported
 *
 * This file is loaded by Vitest before running tests, ensuring that process.env
 * is populated before any application code (like server.ts) reads from it.
 */

import { config } from "dotenv";
import { resolveFromWorkspaceRoot } from "./src/utils/workspace.js";

// Load appropriate .env file based on NODE_ENV
// Priority: .env.test (if NODE_ENV=test) > .env
const isTestEnv = process.env.NODE_ENV === "test";
const envFile = isTestEnv ? ".env.test" : ".env";
const envPath = resolveFromWorkspaceRoot(envFile);

config({ path: envPath });

// Log which env file was loaded (helpful for debugging)
if (process.env.VERBOSE_CLEANUP === "true") {
	console.log(`[vitest.setup] Loaded environment from: ${envFile}`);
}
