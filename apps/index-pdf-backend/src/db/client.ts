import { sql } from "drizzle-orm";
import type { PgliteDatabase } from "drizzle-orm/pglite";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../env";
import * as schema from "./schema";

// Module-level test database override
// Safe for file-level parallelism since each test file runs in isolation
// and tests within a file run sequentially
let testDbOverride: PgliteDatabase<typeof schema> | null = null;

let productionDb: PostgresJsDatabase<typeof schema> | null = null;

export const setTestDb = (testDb: PgliteDatabase<typeof schema>) => {
	testDbOverride = testDb;
};

// Get the current test database (for factory functions)
export const getTestDb = (): PgliteDatabase<typeof schema> | null => {
	return testDbOverride;
};

// Get the appropriate database based on NODE_ENV
const getDb = ():
	| PostgresJsDatabase<typeof schema>
	| PgliteDatabase<typeof schema> => {
	if (process.env.NODE_ENV === "test") {
		if (testDbOverride) {
			return testDbOverride;
		}
	}

	// Cache production db connection
	if (!productionDb) {
		const queryClient = postgres(env.DATABASE_URL);
		productionDb = drizzlePg(queryClient, { schema });
	}

	return productionDb;
};

// Export a proxy that lazily resolves db for each access
export const db = new Proxy(
	{} as PostgresJsDatabase<typeof schema> & PgliteDatabase<typeof schema>,
	{
		get(_target, prop) {
			const actualDb = getDb();
			const value = actualDb[prop as keyof typeof actualDb];
			return typeof value === "function" ? value.bind(actualDb) : value;
		},
	},
);

// Type for transaction with schema
export type DbTransaction = Parameters<
	Parameters<PostgresJsDatabase<typeof schema>["transaction"]>[0]
>[0];

/**
 * Execute queries within a transaction with user context set for RLS.
 *
 * This follows the Supabase pattern of setting JWT claims and role within
 * a transaction to enable Row-Level Security (RLS) policies.
 *
 * SECURITY:
 * - Uses SET LOCAL (transaction-scoped, auto-resets after commit/rollback)
 * - Uses parameterized queries (prevents SQL injection)
 * - Sets 'authenticated' role to activate RLS policies
 * - Transaction ensures context is isolated per request
 *
 * ARCHITECTURE:
 * - RLS policies defined in Drizzle schemas (source of truth)
 * - auth.user_id() function references 'request.jwt.claim.sub'
 * - Policies enforce owner access at database layer
 *
 * @param userId - The authenticated user's ID (UUID)
 * @param fn - Transaction callback receiving a Drizzle transaction object
 * @returns The result of the transaction callback
 *
 * @example
 * return await withUserContext({
 *   userId,
 *   fn: async (tx) => {
 *     // All queries use tx (not db) to benefit from RLS context
 *     return await tx.select().from(projects);
 *   }
 * });
 */
export const withUserContext = async <T>({
	userId,
	fn,
}: {
	userId: string;
	fn: (tx: DbTransaction) => Promise<T>;
}): Promise<T> => {
	return await db.transaction(async (tx) => {
		try {
			// Set JWT claims and authenticated role for RLS (Supabase pattern)
			// Must be separate execute calls - postgres.js doesn't allow multiple statements
			await tx.execute(
				sql`SELECT set_config('request.jwt.claim.sub', ${userId}, TRUE)`,
			);
			await tx.execute(sql`SET LOCAL ROLE authenticated`);

			// Execute user callback with RLS-configured transaction
			return await fn(tx);
		} finally {
			// Cleanup (optional, SET LOCAL auto-resets at transaction end)
			await tx.execute(
				sql`SELECT set_config('request.jwt.claim.sub', NULL, TRUE)`,
			);
			await tx.execute(sql`RESET ROLE`);
		}
	});
};
