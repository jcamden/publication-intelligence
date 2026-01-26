// ============================================================================
// Event Types
// ============================================================================

export type InsertEventInput = {
	projectId: string;
	entityType: string;
	entityId: string;
	action: string;
	metadata?: Record<string, unknown>;
};
