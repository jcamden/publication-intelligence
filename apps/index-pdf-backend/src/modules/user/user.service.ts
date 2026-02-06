import { eq } from "drizzle-orm";
import { db } from "../../db/client";
import { users } from "../../db/schema";

// ============================================================================
// User Service - Business logic for user management
// ============================================================================

/**
 * Delete a user account
 *
 * This will cascade delete all related data (projects, documents, etc.)
 * due to foreign key constraints with ON DELETE CASCADE.
 *
 * @param userId - UUID of the user to delete
 */
export const deleteUser = async ({
	userId,
}: {
	userId: string;
}): Promise<void> => {
	const result = await db.delete(users).where(eq(users.id, userId)).returning();

	if (result.length === 0) {
		throw new Error("User not found");
	}
};
