import type { Client } from "gel";
import type { InsertEventInput } from "./event.types";

// ============================================================================
// Event Repository - Domain event persistence
// ============================================================================

export const insertEvent = async ({
	gelClient,
	projectId,
	entityType,
	entityId,
	action,
	metadata,
}: {
	gelClient: Client;
} & InsertEventInput): Promise<void> => {
	// Use raw EdgeQL for inserts that need global current_user
	await gelClient.query(
		`
		INSERT Event {
			project := (SELECT Project FILTER .id = <uuid>$projectId),
			actor := global current_user,
			entity_type := <EntityType>$entityType,
			entity_id := <uuid>$entityId,
			action := <str>$action,
			metadata := <optional json>$metadata
		}
	`,
		{
			projectId,
			entityType,
			entityId,
			action,
			metadata: metadata ? JSON.stringify(metadata) : null,
		},
	);
};
