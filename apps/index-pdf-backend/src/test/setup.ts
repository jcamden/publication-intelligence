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

export const cleanupTestData = async ({
	userEmails,
}: {
	userEmails: string[];
}) => {
	for (const email of userEmails) {
		try {
			// First delete all projects owned by this user (cascade will delete events)
			await testGelClient.query(
				`
				DELETE Project
				FILTER .owner.email = <str>$email
			`,
				{ email },
			);

			// Then delete the user
			await testGelClient.query(
				`
				DELETE User
				FILTER .email = <str>$email
			`,
				{ email },
			);
		} catch (error) {
			// Ignore cleanup errors in tests
			console.warn(`Failed to cleanup user ${email}:`, error);
		}
	}
};
