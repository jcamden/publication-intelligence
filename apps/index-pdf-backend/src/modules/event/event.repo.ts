import { db } from "../../db/client";
import { events } from "../../db/schema";
import type { InsertEventInput } from "./event.types";

// ============================================================================
// Event Repository - Domain event persistence
// ============================================================================

export const insertEvent = async (input: InsertEventInput): Promise<void> => {
	await db.insert(events).values({
		type: input.type,
		projectId: input.projectId ?? null,
		userId: input.userId ?? null,
		entityType: input.entityType ?? null,
		entityId: input.entityId ?? null,
		metadata: input.metadata ?? null,
		requestId: input.requestId ?? null,
	});
};
