import { TRPCError } from "@trpc/server";
import type { IndexType } from "../../db/schema/index-type-config";
import { requireFound } from "../../lib/errors";
import { logEvent } from "../../logger";
import { insertEvent } from "../event/event.repo";
import * as projectHighlightConfigRepo from "./project-highlight-config.repo";
import type {
	AvailableHighlightType,
	AvailableIndexType,
	EnableProjectHighlightConfigInput,
	EnableProjectIndexTypeInput,
	ProjectHighlightConfig,
	ProjectHighlightConfigListItem,
	ProjectIndexType,
	ProjectIndexTypeListItem,
	UpdateProjectHighlightConfigInput,
	UpdateProjectIndexTypeInput,
} from "./project-highlight-config.types";

// ============================================================================
// Service Layer - Domain logic and orchestration
// ============================================================================

export const listProjectHighlightConfigs = async ({
	projectId,
	userId,
	requestId,
}: {
	projectId: string;
	userId: string;
	requestId: string;
}): Promise<ProjectHighlightConfigListItem[]> => {
	logEvent({
		event: "project_highlight_config.list_requested",
		context: {
			requestId,
			userId,
			metadata: { projectId },
		},
	});

	return await projectHighlightConfigRepo.listProjectHighlightConfigs({
		projectId,
	});
};

// Legacy export for backward compatibility
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

	return await projectHighlightConfigRepo.listProjectIndexTypes({
		projectId,
	});
};

export const listAvailableHighlightTypes = async ({
	projectId,
	userId,
	requestId,
}: {
	projectId: string;
	userId: string;
	requestId: string;
}): Promise<AvailableHighlightType[]> => {
	logEvent({
		event: "highlight_type.list_available_requested",
		context: {
			requestId,
			userId,
			metadata: { projectId },
		},
	});

	return await projectHighlightConfigRepo.listAvailableHighlightTypes({
		userId,
		projectId,
	});
};

// Legacy export for backward compatibility
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

	return await projectHighlightConfigRepo.listAvailableIndexTypes({
		userId,
		projectId,
	});
};

export const enableProjectHighlightConfig = async ({
	input,
	userId,
	requestId,
}: {
	input: EnableProjectHighlightConfigInput;
	userId: string;
	requestId: string;
}): Promise<ProjectHighlightConfig> => {
	const isIndexType = ["subject", "author", "scripture"].includes(
		input.highlightType,
	);

	// 1. Check if user has addon for index types (skip for region types)
	if (isIndexType) {
		const hasAddon = await projectHighlightConfigRepo.checkUserHasAddon({
			userId,
			indexType: input.highlightType as IndexType,
		});

		if (!hasAddon) {
			logEvent({
				event: "project_highlight_config.enable_forbidden",
				context: {
					requestId,
					userId,
					metadata: {
						projectId: input.projectId,
						highlightType: input.highlightType,
						reason: "user_lacks_addon",
					},
				},
			});

			throw new TRPCError({
				code: "FORBIDDEN",
				message: "You do not have access to this index type",
			});
		}
	}

	// 2. Enable the highlight config for the project
	const config = await projectHighlightConfigRepo.enableProjectHighlightConfig({
		input,
		userId,
	});

	logEvent({
		event: "project_highlight_config.enabled",
		context: {
			requestId,
			userId,
			metadata: {
				projectId: input.projectId,
				projectHighlightConfigId: config.id,
				highlightType: input.highlightType,
			},
		},
	});

	await insertEvent({
		type: "highlight_config.enabled",
		projectId: input.projectId,
		userId,
		entityType: "IndexEntry",
		entityId: config.id,
		metadata: {
			highlightType: input.highlightType,
			displayName: config.displayName,
			colorHue: input.colorHue,
		},
		requestId,
	});

	return config;
};

// Legacy export for backward compatibility
export const enableProjectIndexType = async ({
	input,
	userId,
	requestId,
}: {
	input: EnableProjectIndexTypeInput;
	userId: string;
	requestId: string;
}): Promise<ProjectIndexType> => {
	const config = await enableProjectHighlightConfig({
		input,
		userId,
		requestId,
	});
	return {
		...config,
		indexType: config.highlightType as IndexType,
	};
};

export const updateProjectHighlightConfig = async ({
	id,
	input,
	userId,
	requestId,
}: {
	id: string;
	input: UpdateProjectHighlightConfigInput;
	userId: string;
	requestId: string;
}): Promise<ProjectHighlightConfig> => {
	const updated = await projectHighlightConfigRepo.updateProjectHighlightConfig(
		{
			id,
			input,
			userId,
		},
	);

	const found = requireFound(updated);

	logEvent({
		event: "project_highlight_config.updated",
		context: {
			requestId,
			userId,
			metadata: {
				projectHighlightConfigId: id,
				changes: input,
			},
		},
	});

	await insertEvent({
		type: "highlight_config.updated",
		projectId: found.project.id,
		userId,
		entityType: "IndexEntry",
		entityId: id,
		metadata: input,
		requestId,
	});

	return found;
};

// Legacy export for backward compatibility
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
	const config = await updateProjectHighlightConfig({
		id,
		input,
		userId,
		requestId,
	});
	return {
		...config,
		indexType: config.highlightType as IndexType,
	};
};

// Removed: Reordering is now a client-side concern (UI sorting)

export const listUserAddons = async ({
	userId,
	requestId,
}: {
	userId: string;
	requestId: string;
}): Promise<IndexType[]> => {
	const addons = await projectHighlightConfigRepo.listUserAddons({ userId });

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
	await projectHighlightConfigRepo.grantAddon({ userId, indexType });

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
	await projectHighlightConfigRepo.revokeAddon({ userId, indexType });

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

export const disableProjectHighlightConfig = async ({
	id,
	userId,
	requestId,
}: {
	id: string;
	userId: string;
	requestId: string;
}): Promise<ProjectHighlightConfig> => {
	// Get current state to check entry count
	const current =
		await projectHighlightConfigRepo.getProjectHighlightConfigById({
			id,
		});

	const found = requireFound(current);

	// Soft delete (set deleted_at)
	const disabled =
		await projectHighlightConfigRepo.disableProjectHighlightConfig({
			id,
			userId,
		});

	const result = requireFound(disabled);

	logEvent({
		event: "project_highlight_config.disabled",
		context: {
			requestId,
			userId,
			metadata: {
				projectHighlightConfigId: id,
				entryCount: found.entry_count,
			},
		},
	});

	await insertEvent({
		type: "highlight_config.disabled",
		projectId: found.project.id,
		userId,
		entityType: "IndexEntry",
		entityId: id,
		metadata: {
			highlightType: found.highlightType,
			displayName: found.displayName,
			hadEntries: found.entry_count > 0,
		},
		requestId,
	});

	return result;
};

// Legacy export for backward compatibility
export const disableProjectIndexType = async ({
	id,
	userId,
	requestId,
}: {
	id: string;
	userId: string;
	requestId: string;
}): Promise<ProjectIndexType> => {
	const config = await disableProjectHighlightConfig({ id, userId, requestId });
	return {
		...config,
		indexType: config.highlightType as IndexType,
	};
};
