import { sql } from "drizzle-orm";
import { afterEach, beforeEach } from "vitest";
import { setTestDb } from "../db/client";
import type { TestDb } from "../db/test-client";
import { createTestDb } from "../db/test-client";

// ============================================================================
// Test Database Setup (PGLite)
// ============================================================================

// Extend Vitest's test context to include our db instance
declare module "vitest" {
	export interface TestContext {
		testDbInstance: Awaited<TestDb>;
		testDb: Awaited<TestDb>["db"];
	}
}

beforeEach(async (context) => {
	// Create fresh PGLite instance with migrations for each test
	// Store in test context for cleanup
	context.testDbInstance = await createTestDb();
	context.testDb = context.testDbInstance.db;

	// Set module-level test db override for this test file
	// Safe for file-level parallelism (tests within file run sequentially)
	setTestDb(context.testDb);

	// Verify database is ready
	await context.testDb.execute(sql`SELECT 1`);
}, 30000); // Longer timeout for migrations

afterEach(async (context) => {
	// Close PGLite instance - no cleanup needed, fresh DB per test
	await context.testDbInstance.close();
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
