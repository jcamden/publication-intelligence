import { sql } from "drizzle-orm";
import { afterEach, beforeEach } from "vitest";
import { setTestDb } from "../db/client";
import type { TestDb } from "../db/test-client";
import { createTestDb } from "../db/test-client";

// ============================================================================
// Test Database Setup (PGLite)
// ============================================================================

let testDbInstance: Awaited<TestDb>;

// Export db for tests to use
export let testDb: Awaited<TestDb>["db"];

beforeEach(async () => {
	// Create fresh PGLite instance with migrations for each test
	// This provides complete isolation without cleanup complexity
	testDbInstance = await createTestDb();
	testDb = testDbInstance.db;

	// Inject test db into production client
	// This allows integration tests that use the server to use the test db
	setTestDb(testDb);

	// Verify database is ready
	await testDb.execute(sql`SELECT 1`);
}, 30000); // Longer timeout for migrations

afterEach(async () => {
	// Close PGLite instance - no cleanup needed, fresh DB per test
	await testDbInstance.close();
});

// ============================================================================
// Test Helpers
// ============================================================================

export const waitForCondition = async ({
	condition,
	timeout = 5000,
	interval = 100,
}: {
	condition: () => Promise<boolean> | boolean;
	timeout?: number;
	interval?: number;
}): Promise<void> => {
	const startTime = Date.now();

	while (Date.now() - startTime < timeout) {
		if (await condition()) {
			return;
		}
		await new Promise((resolve) => setTimeout(resolve, interval));
	}

	throw new Error(`Condition not met within ${timeout}ms`);
};
