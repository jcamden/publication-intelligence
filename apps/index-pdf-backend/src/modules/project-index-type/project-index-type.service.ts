import { TRPCError } from "@trpc/server";
import {
	getIndexTypeConfig,
	type IndexType,
} from "../../db/schema/index-type-config";
import { requireFound } from "../../lib/errors";
import { logEvent } from "../../logger";
import { insertEvent } from "../event/event.repo";
import * as projectIndexTypeRepo from "./project-index-type.repo";
import type {
	AvailableIndexType,
	EnableProjectIndexTypeInput,
	ProjectIndexType,
	ProjectIndexTypeListItem,
	UpdateProjectIndexTypeInput,
} from "./project-index-type.types";

// ============================================================================
// Service Layer - Domain logic and orchestration
// ============================================================================

export const listProjectIndexTypes = async ({
	projectId,
	userId,
	requestId,
}: {
	projectId: string;
	userId: string;
	requestId: string;
}): Promise<ProjectIndexTypeListItem[]> => {
	logEvent({
		event: "project_index_type.list_requested",
		context: {
			requestId,
			userId,
			metadata: { projectId },
		},
	});

	return await projectIndexTypeRepo.listProjectIndexTypes({
		projectId,
	});
};

export const listAvailableIndexTypes = async ({
	projectId,
	userId,
	requestId,
}: {
	projectId: string;
	userId: string;
	requestId: string;
}): Promise<AvailableIndexType[]> => {
	logEvent({
		event: "index_type.list_available_requested",
		context: {
			requestId,
			userId,
			metadata: { projectId },
		},
	});

	return await projectIndexTypeRepo.listAvailableIndexTypes({
		userId,
		projectId,
	});
};

export const enableProjectIndexType = async ({
	input,
	userId,
	requestId,
}: {
	input: EnableProjectIndexTypeInput;
	userId: string;
	requestId: string;
}): Promise<ProjectIndexType> => {
	// 1. Check if user has addon for this index type
	const hasAddon = await projectIndexTypeRepo.checkUserHasAddon({
		userId,
		indexType: input.indexType,
	});

	if (!hasAddon) {
		logEvent({
			event: "project_index_type.enable_forbidden",
			context: {
				requestId,
				userId,
				metadata: {
					projectId: input.projectId,
					indexType: input.indexType,
					reason: "user_lacks_addon",
				},
			},
		});

		throw new TRPCError({
			code: "FORBIDDEN",
			message: "You do not have access to this index type",
		});
	}

	// 2. Enable the index type for the project
	const projectIndexType = await projectIndexTypeRepo.enableProjectIndexType({
		input,
		userId,
	});

	logEvent({
		event: "project_index_type.enabled",
		context: {
			requestId,
			userId,
			metadata: {
				projectId: input.projectId,
				projectIndexTypeId: projectIndexType.id,
				indexType: input.indexType,
			},
		},
	});

	const config = getIndexTypeConfig(input.indexType);
	if (!config) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: `Index type ${input.indexType} is not available`,
		});
	}

	await insertEvent({
		type: "index_type.enabled",
		projectId: input.projectId,
		userId,
		entityType: "IndexEntry", // Using closest enum value
		entityId: projectIndexType.id,
		metadata: {
			indexType: input.indexType,
			displayName: config.displayName,
			colorHue: input.colorHue,
		},
		requestId,
	});

	return projectIndexType;
};

export const updateProjectIndexType = async ({
	id,
	input,
	userId,
	requestId,
}: {
	id: string;
	input: UpdateProjectIndexTypeInput;
	userId: string;
	requestId: string;
}): Promise<ProjectIndexType> => {
	const updated = await projectIndexTypeRepo.updateProjectIndexType({
		id,
		input,
		userId,
	});

	const found = requireFound(updated);

	logEvent({
		event: "project_index_type.updated",
		context: {
			requestId,
			userId,
			metadata: {
				projectIndexTypeId: id,
				changes: input,
			},
		},
	});

	await insertEvent({
		type: "index_type.updated",
		projectId: found.project.id,
		userId,
		entityType: "IndexEntry",
		entityId: id,
		metadata: input,
		requestId,
	});

	return found;
};

// Removed: Reordering is now a client-side concern (UI sorting)

export const listUserAddons = async ({
	userId,
	requestId,
}: {
	userId: string;
	requestId: string;
}): Promise<IndexType[]> => {
	const addons = await projectIndexTypeRepo.listUserAddons({ userId });

	logEvent({
		event: "project_index_type.user_addons_listed",
		context: {
			requestId,
			userId,
			metadata: {
				count: addons.length,
				addons,
			},
		},
	});

	return addons;
};

export const grantAddon = async ({
	userId,
	indexType,
	requestId,
}: {
	userId: string;
	indexType: IndexType;
	requestId: string;
}): Promise<void> => {
	await projectIndexTypeRepo.grantAddon({ userId, indexType });

	logEvent({
		event: "project_index_type.addon_granted",
		context: {
			requestId,
			userId,
			metadata: {
				indexType,
			},
		},
	});
};

export const revokeAddon = async ({
	userId,
	indexType,
	requestId,
}: {
	userId: string;
	indexType: IndexType;
	requestId: string;
}): Promise<void> => {
	await projectIndexTypeRepo.revokeAddon({ userId, indexType });

	logEvent({
		event: "project_index_type.addon_revoked",
		context: {
			requestId,
			userId,
			metadata: {
				indexType,
			},
		},
	});
};

export const disableProjectIndexType = async ({
	id,
	userId,
	requestId,
}: {
	id: string;
	userId: string;
	requestId: string;
}): Promise<ProjectIndexType> => {
	// Get current state to check entry count
	const current = await projectIndexTypeRepo.getProjectIndexTypeById({
		id,
	});

	const found = requireFound(current);

	// Soft delete (set deleted_at)
	const disabled = await projectIndexTypeRepo.disableProjectIndexType({
		id,
		userId,
	});

	const result = requireFound(disabled);

	logEvent({
		event: "project_index_type.disabled",
		context: {
			requestId,
			userId,
			metadata: {
				projectIndexTypeId: id,
				entryCount: found.entry_count,
			},
		},
	});

	await insertEvent({
		type: "index_type.disabled",
		projectId: found.project.id,
		userId,
		entityType: "IndexEntry",
		entityId: id,
		metadata: {
			indexType: found.indexType,
			displayName: found.displayName,
			hadEntries: found.entry_count > 0,
		},
		requestId,
	});

	return result;
};
