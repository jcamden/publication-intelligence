/**
 * PGLite Test Database Client
 *
 * Creates an in-memory PostgreSQL database using PGLite for fast, isolated tests.
 * Each test can have its own database instance without external dependencies.
 */

import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "./schema";

export type TestDb = ReturnType<typeof createTestDb>;

/**
 * Create a fresh PGLite database instance for testing
 *
 * @param options.runMigrations - Whether to run migrations (default: true)
 * @returns Object with db client and cleanup function
 */
export const createTestDb = async ({ runMigrations = true } = {}) => {
	// Create in-memory PGLite instance
	const pglite = new PGlite();
	const db = drizzle(pglite, { schema });

	if (runMigrations) {
		await runTestMigrations(pglite);
	}

	return {
		db,
		pglite,
		/**
		 * Clean up the database instance
		 */
		close: async () => {
			await pglite.close();
		},
		/**
		 * Execute raw SQL (useful for setup/teardown)
		 */
		exec: async (sql: string) => {
			await pglite.exec(sql);
		},
	};
};

/**
 * Run all migrations against a PGLite instance
 */
const runTestMigrations = async (pglite: PGlite) => {
	// Run migrations from db/migrations
	const migrationsDir = join(process.cwd(), "..", "..", "db", "migrations");
	const journalPath = join(migrationsDir, "meta", "_journal.json");
	const journalContent = await readFile(journalPath, "utf-8");
	const journal = JSON.parse(journalContent);

	// Run migrations in order
	for (const entry of journal.entries) {
		const migrationPath = join(migrationsDir, `${entry.tag}.sql`);
		const migrationSql = await readFile(migrationPath, "utf-8");

		// Split by statement breakpoints and execute each statement separately
		const statements = migrationSql
			.split("--> statement-breakpoint")
			.map((stmt) => stmt.trim())
			.filter((stmt) => stmt.length > 0);

		for (const statement of statements) {
			await pglite.exec(statement);
		}
	}

	// Run post-migration scripts
	// These contain trigger setup and backfills that can't be in Drizzle schema
	const postMigrationsDir = join(
		process.cwd(),
		"..",
		"..",
		"db",
		"post-migrations",
	);
	try {
		const postMigrationFiles = await readdir(postMigrationsDir);
		const tsFiles = postMigrationFiles.filter((f) => f.endsWith(".ts")).sort();

		if (tsFiles.length > 0) {
			console.log("Running post-migration scripts...");
			const { drizzle } = await import("drizzle-orm/pglite");
			const db = drizzle(pglite);

			for (const file of tsFiles) {
				console.log(`Running ${file}...`);
				const modulePath = join(postMigrationsDir, file);
				const module = await import(modulePath);

				// Post-migration scripts accept a { db } parameter
				const fn =
					module.default ||
					module.setupOwnerDenormalization ||
					Object.values(module).find((v) => typeof v === "function");

				if (typeof fn === "function") {
					await fn({ db });
				}
			}
		}
	} catch (error) {
		// If directory doesn't exist, that's okay
		if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
			console.warn("Post-migrations directory not found or inaccessible");
			console.warn(error);
		}
	}

	// RLS is now enabled with fixed circular dependencies
	// Tests run with full RLS protection
};

/**
 * Helper to execute queries with user context (RLS)
 * Same pattern as withUserContext but for PGLite
 */
export const withTestUserContext = async <T>({
	db,
	userId,
	fn,
}: {
	db: ReturnType<typeof drizzle>;
	userId: string;
	fn: (tx: Parameters<Parameters<typeof db.transaction>[0]>[0]) => Promise<T>;
}): Promise<T> => {
	return await db.transaction(async (tx) => {
		try {
			// Set JWT claims and authenticated role for RLS
			// Must be separate execute calls - postgres.js doesn't allow multiple statements
			await tx.execute(
				sql`SELECT set_config('request.jwt.claim.sub', ${userId}, TRUE)`,
			);
			await tx.execute(sql`SET LOCAL ROLE authenticated`);

			return await fn(tx);
		} finally {
			// Cleanup
			await tx.execute(
				sql`SELECT set_config('request.jwt.claim.sub', NULL, TRUE)`,
			);
			await tx.execute(sql`RESET ROLE`);
		}
	});
};
