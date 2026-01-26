import { createGelClient } from "../db/client";

// ============================================================================
// Test Database Setup
// ============================================================================

export const testGelClient = createGelClient();

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

// ============================================================================
// Test Data Cleanup
// ============================================================================
//
// Test cleanup is handled by dropping and recreating the entire test branch.
// This runs automatically before each test suite via `pnpm test`.
//
// See: db/gel/reset-test-branch.sh
//
// Why branch reset (vs per-record cleanup):
// 1. Perfect test isolation - no shared state between runs
// 2. No access policy gymnastics - policies remain pure
// 3. Guaranteed correctness - no cleanup edge cases
// 4. Fast - ~5 seconds to drop/recreate entire branch
//
// Legacy cleanup function removed - no longer needed with branch reset.
