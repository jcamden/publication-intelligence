/**
 * Vitest Setup - Loads environment variables BEFORE any modules are imported
 *
 * This file is loaded by Vitest before running tests, ensuring that process.env
 * is populated before any application code (like server.ts) reads from it.
 */

import { resolve } from "node:path";
import { config } from "dotenv";

// Load .env from monorepo root
config({ path: resolve(__dirname, "../../.env") });
