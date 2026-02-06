// ============================================================================
// Event Types
// ============================================================================

export type EntityType =
	| "IndexEntry"
	| "IndexMention"
	| "SourceDocument"
	| "DocumentPage"
	| "LLMRun"
	| "ExportedIndex"
	| "Project";

export type InsertEventInput = {
	type: string; // e.g., 'project.created', 'document.uploaded'
	projectId?: string;
	userId?: string;
	entityType?: EntityType;
	entityId?: string;
	metadata?: Record<string, unknown>;
	requestId?: string;
};
