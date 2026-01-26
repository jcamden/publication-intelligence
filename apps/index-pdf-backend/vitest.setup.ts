/**
 * Vitest Setup - Loads environment variables BEFORE any modules are imported
 *
 * This file is loaded by Vitest before running tests, ensuring that process.env
 * is populated before any application code (like server.ts) reads from it.
 */

import { resolve } from "node:path";
import { config } from "dotenv";

// Load appropriate .env file based on NODE_ENV
// Priority: .env.test (if NODE_ENV=test) > .env
const isTestEnv = process.env.NODE_ENV === "test";
const envFile = isTestEnv ? ".env.test" : ".env";
const envPath = resolve(__dirname, `../../${envFile}`);

config({ path: envPath });

// Log which env file was loaded (helpful for debugging)
if (process.env.VERBOSE_CLEANUP === "true") {
	console.log(`[vitest.setup] Loaded environment from: ${envFile}`);
	console.log(`[vitest.setup] GEL_AUTH_URL: ${process.env.GEL_AUTH_URL}`);
}
