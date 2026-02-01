import type { Client } from "edgedb";

// ============================================================================
// User Service - Business logic for user management
// ============================================================================

/**
 * Delete a user and their associated auth identity
 *
 * IMPORTANT: EdgeDB's auth extension stores identities separately from our schema.
 * When deleting a user, we must also delete their auth identity to prevent:
 * 1. Orphaned auth records
 * 2. "User already registered" errors on re-registration
 * 3. Violating the User.identity constraint
 *
 * @param gelClient - EdgeDB client with appropriate permissions
 * @param userId - UUID of the user to delete
 */
export const deleteUserWithIdentity = async ({
	gelClient,
	userId,
}: {
	gelClient: Client;
	userId: string;
}): Promise<void> => {
	// First, get the identity ID before deleting the user
	const user = await gelClient.querySingle<{ identity: { id: string } }>(
		`
    SELECT User {
      identity: { id }
    }
    FILTER .id = <uuid>$userId
  `,
		{ userId },
	);

	if (!user) {
		throw new Error("User not found");
	}

	const identityId = user.identity.id;

	// Delete the user first (this is required before deleting identity
	// because User has a required link to Identity)
	await gelClient.execute(
		`
    DELETE User
    FILTER .id = <uuid>$userId
  `,
		{ userId },
	);

	// Then delete the auth identity and associated factors
	await gelClient.execute(
		`
    DELETE ext::auth::Identity
    FILTER .id = <uuid>$identityId
  `,
		{ identityId },
	);
};
