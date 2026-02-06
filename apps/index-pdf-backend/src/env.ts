import { existsSync } from "node:fs";
import { config } from "dotenv";
import { z } from "zod";
import { resolveFromWorkspaceRoot } from "./utils/workspace.js";

// Load environment variables from .env file (development only)
// In production/Docker/CI, env vars should be set directly
if (process.env.NODE_ENV !== "production") {
	const envPath = resolveFromWorkspaceRoot(".env");

	// Only try to load if .env exists (graceful degradation)
	if (existsSync(envPath)) {
		const result = config({ path: envPath });

		if (result.error) {
			console.error("❌ Failed to load .env file:");
			console.error("  Path:", envPath);
			console.error("  Error:", result.error.message);
			throw new Error("Failed to load .env file");
		}
	}
}

/**
 * Backend Environment Variables Schema
 *
 * This file validates all environment variables required by the backend
 * at startup. If any required variable is missing or invalid, the app
 * will crash with a clear error message.
 *
 * Usage:
 *   import { env } from "./env";
 *   console.log(env.JWT_SECRET); // Type-safe, guaranteed to exist!
 *
 * Why this pattern?
 * - Type safety: TypeScript knows which env vars exist
 * - Fail fast: Missing vars crash at startup, not at runtime
 * - No runtime checks: Once validated, vars are guaranteed to exist
 * - Single source of truth: All env var access goes through here
 */

const envSchema = z.object({
	// Node environment
	NODE_ENV: z
		.enum(["development", "production", "test"])
		.default("development"),

	// Server configuration
	PORT: z.coerce.number().default(3001),
	HOST: z.string().default("0.0.0.0"),
	LOG_LEVEL: z
		.enum(["fatal", "error", "warn", "info", "debug", "trace"])
		.default("info"),

	// Database
	DATABASE_URL: z
		.string()
		.url()
		.default(
			"postgresql://postgres:postgres@localhost:5432/publication_intelligence",
		),

	// JWT Authentication
	JWT_SECRET: z
		.string()
		.min(32, "JWT_SECRET must be at least 32 characters for security")
		.refine(
			(val) =>
				!val.includes("REPLACE") && !val.includes("change-in-production"),
			"JWT_SECRET cannot use placeholder values. Generate with: openssl rand -base64 32",
		),
	JWT_EXPIRES_IN: z.string().default("7d"),

	// CORS
	CORS_ORIGINS: z
		.string()
		.optional()
		.transform((val) =>
			val
				? val.split(",").map((origin) => origin.trim())
				: [
						"http://localhost:3000",
						"http://localhost:3001",
						"http://localhost:6006",
					],
		),
});

/**
 * Parse and validate environment variables.
 * Throws detailed error if validation fails.
 */
const parseEnv = () => {
	const result = envSchema.safeParse(process.env);

	if (!result.success) {
		console.error("❌ Invalid environment variables:");
		console.error(JSON.stringify(result.error.format(), null, 2));
		throw new Error("Environment validation failed");
	}

	return result.data;
};

/**
 * Validated and typed environment variables.
 * Guaranteed to exist and match the schema.
 */
export const env = parseEnv();

/**
 * TypeScript type for environment variables.
 * Useful for testing and type annotations.
 */
export type Env = z.infer<typeof envSchema>;
