#!/usr/bin/env tsx

/**
 * Validate Environment Variables
 *
 * Ensures all required environment variables are set and meet security requirements.
 * Loads from .env file in monorepo root.
 */

import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";

const MONOREPO_ROOT = resolve(import.meta.dirname, "..");

// Load from monorepo root .env
const envPath = resolve(MONOREPO_ROOT, ".env");
if (existsSync(envPath)) {
	console.log("📄 Loading environment from .env file...\n");
	config({ path: envPath });
}

type ValidationResult = {
	success: boolean;
	errors: string[];
	warnings: string[];
};

const MIN_KEY_LENGTH = 32;

/**
 * Validate auth signing key
 */
const validateAuthSigningKey = (): ValidationResult => {
	const result: ValidationResult = {
		success: true,
		errors: [],
		warnings: [],
	};

	const key = process.env.EDGEDB_AUTH_SIGNING_KEY;

	// Check if set
	if (!key) {
		result.success = false;
		result.errors.push(
			"EDGEDB_AUTH_SIGNING_KEY is not set",
			"",
			"Generate a secure key with:",
			"  openssl rand -base64 32",
			"",
			"Then add to .env:",
			"  EDGEDB_AUTH_SIGNING_KEY=<your-generated-key>",
		);
		return result;
	}

	// Check for placeholder
	if (key === "REPLACE_WITH_SECURE_KEY_IN_PRODUCTION") {
		result.success = false;
		result.errors.push(
			"EDGEDB_AUTH_SIGNING_KEY is still using placeholder value",
			"",
			"Generate a secure key with:",
			"  openssl rand -base64 32",
		);
		return result;
	}

	// Check minimum length
	if (key.length < MIN_KEY_LENGTH) {
		result.success = false;
		result.errors.push(
			`EDGEDB_AUTH_SIGNING_KEY is too short (${key.length} bytes, minimum ${MIN_KEY_LENGTH})`,
			"",
			"Generate a secure key with:",
			"  openssl rand -base64 32",
		);
		return result;
	}

	// Check if appears to be base64
	const base64Regex = /^[A-Za-z0-9+/]+=*$/;
	if (!base64Regex.test(key)) {
		result.warnings.push(
			"EDGEDB_AUTH_SIGNING_KEY doesn't appear to be base64-encoded",
			"This may be intentional, but consider using: openssl rand -base64 32",
		);
	}

	return result;
};

/**
 * Validate CORS origins
 */
const validateCorsOrigins = (): ValidationResult => {
	const result: ValidationResult = {
		success: true,
		errors: [],
		warnings: [],
	};

	const corsOrigins = process.env.CORS_ORIGINS;

	// CORS_ORIGINS is optional (has defaults)
	if (!corsOrigins) {
		result.warnings.push(
			"CORS_ORIGINS not set, using defaults:",
			"  - http://localhost:3000",
			"  - http://localhost:3001",
			"  - http://localhost:6006",
		);
		return result;
	}

	// Validate format (comma-separated URLs)
	const origins = corsOrigins.split(",").map((origin) => origin.trim());

	for (const origin of origins) {
		try {
			new URL(origin);
		} catch {
			result.errors.push(
				`Invalid CORS origin: "${origin}"`,
				"CORS_ORIGINS must be comma-separated valid URLs",
				"Example: http://localhost:3000,https://app.example.com",
			);
			result.success = false;
		}
	}

	return result;
};

/**
 * Validate all environment variables
 */
const validateEnvironment = (): ValidationResult => {
	const result: ValidationResult = {
		success: true,
		errors: [],
		warnings: [],
	};

	// Validate auth signing key
	const authKeyResult = validateAuthSigningKey();
	result.errors.push(...authKeyResult.errors);
	result.warnings.push(...authKeyResult.warnings);
	result.success = result.success && authKeyResult.success;

	// Validate CORS origins
	const corsResult = validateCorsOrigins();
	result.errors.push(...corsResult.errors);
	result.warnings.push(...corsResult.warnings);
	result.success = result.success && corsResult.success;

	// Add more validations here as needed
	// Example: validate required env vars, check formats, etc.

	return result;
};

/**
 * Main validation logic
 */
const main = () => {
	console.log("🔐 Validating environment variables...\n");

	const result = validateEnvironment();

	// Print errors
	if (result.errors.length > 0) {
		console.log("❌ VALIDATION FAILED\n");
		for (const error of result.errors) {
			console.log(error);
		}
		console.log("");
	}

	// Print warnings
	if (result.warnings.length > 0) {
		console.log("⚠️  WARNINGS\n");
		for (const warning of result.warnings) {
			console.log(warning);
		}
		console.log("");
	}

	// Print success
	if (result.success && result.errors.length === 0) {
		const key = process.env.EDGEDB_AUTH_SIGNING_KEY || "";
		const corsOrigins = process.env.CORS_ORIGINS
			? process.env.CORS_ORIGINS.split(",").map((o) => o.trim())
			: ["(using defaults)"];

		console.log("✅ All environment variables are valid\n");
		console.log("Environment variables:");
		console.log(
			`  EDGEDB_AUTH_SIGNING_KEY: ${key.slice(0, 8)}... (${key.length} bytes)`,
		);
		console.log(`  CORS_ORIGINS: ${corsOrigins.length} origin(s)`);
		for (const origin of corsOrigins) {
			console.log(`    - ${origin}`);
		}
		console.log("");
	}

	// Exit with appropriate code
	process.exit(result.success ? 0 : 1);
};

main();
