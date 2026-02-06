import { z } from "zod";

/**
 * Frontend Environment Variables Schema
 *
 * This file validates all environment variables required by the frontend
 * at startup. If any required variable is missing or invalid, the app
 * will crash with a clear error message.
 *
 * Next.js automatically loads environment variables from:
 * - .env.local (not committed, for local dev)
 * - .env.development (dev defaults)
 * - .env.production (production defaults)
 *
 * Variables prefixed with NEXT_PUBLIC_ are exposed to the browser.
 * Other variables are only available server-side.
 *
 * Usage:
 *   import { env } from "./env";
 *   console.log(env.NEXT_PUBLIC_API_URL); // Type-safe, guaranteed to exist!
 *
 * Why this pattern?
 * - Type safety: TypeScript knows which env vars exist
 * - Fail fast: Missing vars crash at startup, not at runtime
 * - No runtime checks: Once validated, vars are guaranteed to exist
 * - Single source of truth: All env var access goes through here
 */

const envSchema = z.object({
	// Node environment (available both server and client-side in Next.js)
	NODE_ENV: z
		.enum(["development", "production", "test"])
		.default("development"),

	// API configuration (NEXT_PUBLIC_ prefix makes it available client-side)
	NEXT_PUBLIC_API_URL: z
		.string()
		.url("NEXT_PUBLIC_API_URL must be a valid URL")
		.default("http://localhost:3001"),
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
