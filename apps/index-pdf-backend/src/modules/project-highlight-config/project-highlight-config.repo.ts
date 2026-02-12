import { and, eq, isNull, sql } from "drizzle-orm";
import { db, withUserContext } from "../../db/client";
import {
	indexEntries,
	projectHighlightConfigs,
	userIndexTypeAddons,
} from "../../db/schema";
import {
	getIndexTypeConfig,
	type IndexType,
} from "../../db/schema/index-type-config";
import type {
	AvailableHighlightType,
	AvailableIndexType,
	EnableProjectHighlightConfigInput,
	EnableProjectIndexTypeInput,
	HighlightType,
	ProjectHighlightConfig,
	ProjectHighlightConfigListItem,
	ProjectIndexType,
	ProjectIndexTypeListItem,
	UpdateProjectHighlightConfigInput,
	UpdateProjectIndexTypeInput,
} from "./project-highlight-config.types";

// ============================================================================
// Repository Layer - Database queries
// ============================================================================

// Default hues for each highlight type
const DEFAULT_HUES: Record<HighlightType, number> = {
	subject: 230, // Blue
	author: 270, // Purple
	scripture: 160, // Green
	exclude: 0, // Red
	page_number: 270, // Purple
};

// Display names for each highlight type
const HIGHLIGHT_DISPLAY_NAMES: Record<HighlightType, string> = {
	subject: "Subject",
	author: "Author",
	scripture: "Scripture",
	exclude: "Exclude Region",
	page_number: "Page Number Region",
};

// Descriptions for each highlight type
const HIGHLIGHT_DESCRIPTIONS: Record<HighlightType, string> = {
	subject: "Topical index of key concepts, themes, and subjects",
	author: "Index of cited authors and their works",
	scripture: "Biblical and scriptural reference index",
	exclude: "Regions to exclude from text extraction",
	page_number: "Regions for page number detection",
};

export const listProjectHighlightConfigs = async ({
	projectId,
}: {
	projectId: string;
}): Promise<ProjectHighlightConfigListItem[]> => {
	const result = await db
		.select({
			id: projectHighlightConfigs.id,
			colorHue: projectHighlightConfigs.colorHue,
			visible: projectHighlightConfigs.isVisible,
			highlightType: projectHighlightConfigs.highlightType,
			entry_count: sql<number>`(
				SELECT COUNT(*)::int 
				FROM ${indexEntries} 
				WHERE ${indexEntries.projectIndexTypeId} = ${projectHighlightConfigs.id}
					AND ${indexEntries.deletedAt} IS NULL
			)`,
		})
		.from(projectHighlightConfigs)
		.where(
			and(
				eq(projectHighlightConfigs.projectId, projectId),
				isNull(projectHighlightConfigs.deletedAt),
			),
		);

	return result.map((row) => {
		const highlightType = row.highlightType as HighlightType;
		return {
			id: row.id,
			colorHue: row.colorHue,
			visible: row.visible,
			highlightType,
			displayName: HIGHLIGHT_DISPLAY_NAMES[highlightType],
			entry_count: row.entry_count,
		};
	});
};

// Legacy export for backward compatibility
export const listProjectIndexTypes = async ({
	projectId,
}: {
	projectId: string;
}): Promise<ProjectIndexTypeListItem[]> => {
	const configs = await listProjectHighlightConfigs({ projectId });
	// Filter to only index types and map to old format
	return configs
		.filter((c) => ["subject", "author", "scripture"].includes(c.highlightType))
		.map((c) => ({
			...c,
			indexType: c.highlightType as IndexType,
		}));
};

export const listAvailableHighlightTypes = async ({
	userId,
	projectId,
}: {
	userId: string;
	projectId: string;
}): Promise<AvailableHighlightType[]> => {
	// Step 1: Get user's addon index types
	const userAddons = await db
		.select({ indexType: userIndexTypeAddons.indexType })
		.from(userIndexTypeAddons)
		.where(
			and(
				eq(userIndexTypeAddons.userId, userId),
				sql`(${userIndexTypeAddons.expiresAt} IS NULL OR ${userIndexTypeAddons.expiresAt} > NOW())`,
			),
		);

	const userIndexTypes = userAddons.map((a) => a.indexType as IndexType);

	// Step 2: Get highlight types already enabled in project
	const enabledTypes = await db
		.select({ highlightType: projectHighlightConfigs.highlightType })
		.from(projectHighlightConfigs)
		.where(
			and(
				eq(projectHighlightConfigs.projectId, projectId),
				isNull(projectHighlightConfigs.deletedAt),
			),
		);

	const enabledHighlightTypes = enabledTypes.map(
		(e) => e.highlightType as HighlightType,
	);

	// Step 3: Build list of available types
	const available: AvailableHighlightType[] = [];

	// Add index types user has addons for
	for (const indexType of userIndexTypes) {
		if (!enabledHighlightTypes.includes(indexType)) {
			const config = getIndexTypeConfig(indexType);
			if (config) {
				// Only include active types
				available.push({
					highlightType: indexType,
					displayName: config.displayName,
					description: config.description,
					defaultHue: DEFAULT_HUES[indexType],
				});
			}
		}
	}

	// Add region types (always available, no addon needed)
	const regionTypes: HighlightType[] = ["exclude", "page_number"];
	for (const regionType of regionTypes) {
		if (!enabledHighlightTypes.includes(regionType)) {
			available.push({
				highlightType: regionType,
				displayName: HIGHLIGHT_DISPLAY_NAMES[regionType],
				description: HIGHLIGHT_DESCRIPTIONS[regionType],
				defaultHue: DEFAULT_HUES[regionType],
			});
		}
	}

	return available;
};

// Legacy export for backward compatibility
export const listAvailableIndexTypes = async ({
	userId,
	projectId,
}: {
	userId: string;
	projectId: string;
}): Promise<AvailableIndexType[]> => {
	const available = await listAvailableHighlightTypes({ userId, projectId });
	// Filter to only index types and map to old format
	return available
		.filter((a) => ["subject", "author", "scripture"].includes(a.highlightType))
		.map((a) => {
			const config = getIndexTypeConfig(a.highlightType as IndexType);
			return {
				...a,
				indexType: a.highlightType as IndexType,
				defaultColor: config?.defaultColor || "#000000",
			};
		});
};

export const enableProjectHighlightConfig = async ({
	input,
	userId,
}: {
	input: EnableProjectHighlightConfigInput;
	userId: string;
}): Promise<ProjectHighlightConfig> => {
	return await withUserContext({
		userId,
		fn: async (tx) => {
			const [config] = await tx
				.insert(projectHighlightConfigs)
				.values({
					projectId: input.projectId,
					highlightType: input.highlightType,
					colorHue: input.colorHue,
					isVisible: true,
				})
				.returning();

			if (!config) {
				throw new Error("Failed to enable project highlight config");
			}

			// Return the full config with metadata
			const result = await tx
				.select({
					id: projectHighlightConfigs.id,
					projectId: projectHighlightConfigs.projectId,
					highlightType: projectHighlightConfigs.highlightType,
					colorHue: projectHighlightConfigs.colorHue,
					visible: projectHighlightConfigs.isVisible,
					created_at: projectHighlightConfigs.createdAt,
					updated_at: projectHighlightConfigs.updatedAt,
					deleted_at: projectHighlightConfigs.deletedAt,
					entry_count: sql<number>`(
						SELECT COUNT(*)::int 
						FROM ${indexEntries} 
						WHERE ${indexEntries.projectIndexTypeId} = ${projectHighlightConfigs.id}
							AND ${indexEntries.deletedAt} IS NULL
					)`,
				})
				.from(projectHighlightConfigs)
				.where(eq(projectHighlightConfigs.id, config.id))
				.limit(1);

			if (result.length === 0) {
				throw new Error("Failed to retrieve enabled project highlight config");
			}

			const row = result[0];
			const highlightType = row.highlightType as HighlightType;

			return {
				id: row.id,
				project: { id: row.projectId },
				highlightType,
				displayName: HIGHLIGHT_DISPLAY_NAMES[highlightType],
				description: HIGHLIGHT_DESCRIPTIONS[highlightType],
				colorHue: row.colorHue,
				visible: row.visible,
				created_at: row.created_at.toISOString(),
				updated_at: row.updated_at ? row.updated_at.toISOString() : null,
				deleted_at: row.deleted_at ? row.deleted_at.toISOString() : null,
				entry_count: row.entry_count,
				is_deleted: row.deleted_at !== null,
			};
		},
	});
};

// Legacy export for backward compatibility
export const enableProjectIndexType = async ({
	input,
	userId,
}: {
	input: EnableProjectIndexTypeInput;
	userId: string;
}): Promise<ProjectIndexType> => {
	const config = await enableProjectHighlightConfig({ input, userId });
	return {
		...config,
		indexType: config.highlightType as IndexType,
	};
};

export const getProjectHighlightConfigById = async ({
	id,
}: {
	id: string;
}): Promise<ProjectHighlightConfig | null> => {
	const result = await db
		.select({
			id: projectHighlightConfigs.id,
			projectId: projectHighlightConfigs.projectId,
			highlightType: projectHighlightConfigs.highlightType,
			colorHue: projectHighlightConfigs.colorHue,
			visible: projectHighlightConfigs.isVisible,
			created_at: projectHighlightConfigs.createdAt,
			updated_at: projectHighlightConfigs.updatedAt,
			deleted_at: projectHighlightConfigs.deletedAt,
			entry_count: sql<number>`(
				SELECT COUNT(*)::int 
				FROM ${indexEntries} 
				WHERE ${indexEntries.projectIndexTypeId} = ${projectHighlightConfigs.id}
					AND ${indexEntries.deletedAt} IS NULL
			)`,
		})
		.from(projectHighlightConfigs)
		.where(eq(projectHighlightConfigs.id, id))
		.limit(1);

	if (result.length === 0) {
		return null;
	}

	const row = result[0];
	const highlightType = row.highlightType as HighlightType;

	return {
		id: row.id,
		project: { id: row.projectId },
		highlightType,
		displayName: HIGHLIGHT_DISPLAY_NAMES[highlightType],
		description: HIGHLIGHT_DESCRIPTIONS[highlightType],
		colorHue: row.colorHue,
		visible: row.visible,
		created_at: row.created_at.toISOString(),
		updated_at: row.updated_at ? row.updated_at.toISOString() : null,
		deleted_at: row.deleted_at ? row.deleted_at.toISOString() : null,
		entry_count: row.entry_count,
		is_deleted: row.deleted_at !== null,
	};
};

// Legacy export for backward compatibility
export const getProjectIndexTypeById = async ({
	id,
}: {
	id: string;
}): Promise<ProjectIndexType | null> => {
	const config = await getProjectHighlightConfigById({ id });
	if (!config) return null;
	return {
		...config,
		indexType: config.highlightType as IndexType,
	};
};

export const updateProjectHighlightConfig = async ({
	id,
	input,
	userId,
}: {
	id: string;
	input: UpdateProjectHighlightConfigInput;
	userId: string;
}): Promise<ProjectHighlightConfig | null> => {
	return await withUserContext({
		userId,
		fn: async (tx) => {
			const updateValues: Partial<typeof projectHighlightConfigs.$inferInsert> =
				{
					updatedAt: new Date(),
				};

			if (input.colorHue !== undefined) {
				updateValues.colorHue = input.colorHue;
			}

			if (input.visible !== undefined) {
				updateValues.isVisible = input.visible;
			}

			const result = await tx
				.update(projectHighlightConfigs)
				.set(updateValues)
				.where(eq(projectHighlightConfigs.id, id))
				.returning({ id: projectHighlightConfigs.id });

			if (result.length === 0) {
				return null;
			}

			// Inline getProjectHighlightConfigById logic to avoid nested transaction
			const queryResult = await tx
				.select({
					id: projectHighlightConfigs.id,
					projectId: projectHighlightConfigs.projectId,
					highlightType: projectHighlightConfigs.highlightType,
					colorHue: projectHighlightConfigs.colorHue,
					visible: projectHighlightConfigs.isVisible,
					created_at: projectHighlightConfigs.createdAt,
					updated_at: projectHighlightConfigs.updatedAt,
					deleted_at: projectHighlightConfigs.deletedAt,
					entry_count: sql<number>`(
						SELECT COUNT(*)::int 
						FROM ${indexEntries} 
						WHERE ${indexEntries.projectIndexTypeId} = ${projectHighlightConfigs.id}
							AND ${indexEntries.deletedAt} IS NULL
					)`,
				})
				.from(projectHighlightConfigs)
				.where(eq(projectHighlightConfigs.id, id))
				.limit(1);

			if (queryResult.length === 0) {
				return null;
			}

			const row = queryResult[0];
			const highlightType = row.highlightType as HighlightType;

			return {
				id: row.id,
				project: { id: row.projectId },
				highlightType,
				displayName: HIGHLIGHT_DISPLAY_NAMES[highlightType],
				description: HIGHLIGHT_DESCRIPTIONS[highlightType],
				colorHue: row.colorHue,
				visible: row.visible,
				created_at: row.created_at.toISOString(),
				updated_at: row.updated_at ? row.updated_at.toISOString() : null,
				deleted_at: row.deleted_at ? row.deleted_at.toISOString() : null,
				entry_count: row.entry_count,
				is_deleted: row.deleted_at !== null,
			};
		},
	});
};

// Legacy export for backward compatibility
export const updateProjectIndexType = async ({
	id,
	input,
	userId,
}: {
	id: string;
	input: UpdateProjectIndexTypeInput;
	userId: string;
}): Promise<ProjectIndexType | null> => {
	const config = await updateProjectHighlightConfig({ id, input, userId });
	if (!config) return null;
	return {
		...config,
		indexType: config.highlightType as IndexType,
	};
};

export const disableProjectHighlightConfig = async ({
	id,
	userId,
}: {
	id: string;
	userId: string;
}): Promise<ProjectHighlightConfig | null> => {
	return await withUserContext({
		userId,
		fn: async (tx) => {
			const result = await tx
				.update(projectHighlightConfigs)
				.set({
					deletedAt: new Date(),
				})
				.where(eq(projectHighlightConfigs.id, id))
				.returning({ id: projectHighlightConfigs.id });

			if (result.length === 0) {
				return null;
			}

			// Inline logic to avoid nested transaction
			const queryResult = await tx
				.select({
					id: projectHighlightConfigs.id,
					projectId: projectHighlightConfigs.projectId,
					highlightType: projectHighlightConfigs.highlightType,
					colorHue: projectHighlightConfigs.colorHue,
					visible: projectHighlightConfigs.isVisible,
					created_at: projectHighlightConfigs.createdAt,
					updated_at: projectHighlightConfigs.updatedAt,
					deleted_at: projectHighlightConfigs.deletedAt,
					entry_count: sql<number>`(
						SELECT COUNT(*)::int 
						FROM ${indexEntries} 
						WHERE ${indexEntries.projectIndexTypeId} = ${projectHighlightConfigs.id}
							AND ${indexEntries.deletedAt} IS NULL
					)`,
				})
				.from(projectHighlightConfigs)
				.where(eq(projectHighlightConfigs.id, id))
				.limit(1);

			if (queryResult.length === 0) {
				return null;
			}

			const row = queryResult[0];
			const highlightType = row.highlightType as HighlightType;

			return {
				id: row.id,
				project: { id: row.projectId },
				highlightType,
				displayName: HIGHLIGHT_DISPLAY_NAMES[highlightType],
				description: HIGHLIGHT_DESCRIPTIONS[highlightType],
				colorHue: row.colorHue,
				visible: row.visible,
				created_at: row.created_at.toISOString(),
				updated_at: row.updated_at ? row.updated_at.toISOString() : null,
				deleted_at: row.deleted_at ? row.deleted_at.toISOString() : null,
				entry_count: row.entry_count,
				is_deleted: row.deleted_at !== null,
			};
		},
	});
};

// Legacy export for backward compatibility
export const disableProjectIndexType = async ({
	id,
	userId,
}: {
	id: string;
	userId: string;
}): Promise<ProjectIndexType | null> => {
	const config = await disableProjectHighlightConfig({ id, userId });
	if (!config) return null;
	return {
		...config,
		indexType: config.highlightType as IndexType,
	};
};

// Addon management functions (only for index types, not regions)
export const listUserAddons = async ({
	userId,
}: {
	userId: string;
}): Promise<IndexType[]> => {
	const result = await db
		.select({ indexType: userIndexTypeAddons.indexType })
		.from(userIndexTypeAddons)
		.where(
			and(
				eq(userIndexTypeAddons.userId, userId),
				sql`(${userIndexTypeAddons.expiresAt} IS NULL OR ${userIndexTypeAddons.expiresAt} > NOW())`,
			),
		);

	return result.map((row) => row.indexType as IndexType);
};

export const grantAddon = async ({
	userId,
	indexType,
}: {
	userId: string;
	indexType: IndexType;
}): Promise<void> => {
	await db
		.insert(userIndexTypeAddons)
		.values({
			userId,
			indexType,
		})
		.onConflictDoNothing(); // Idempotent: don't error if already exists
};

export const revokeAddon = async ({
	userId,
	indexType,
}: {
	userId: string;
	indexType: IndexType;
}): Promise<void> => {
	await db
		.delete(userIndexTypeAddons)
		.where(
			and(
				eq(userIndexTypeAddons.userId, userId),
				eq(userIndexTypeAddons.indexType, indexType),
			),
		);
};

export const checkUserHasAddon = async ({
	userId,
	indexType,
}: {
	userId: string;
	indexType: IndexType;
}): Promise<boolean> => {
	const result = await db
		.select({ id: userIndexTypeAddons.id })
		.from(userIndexTypeAddons)
		.where(
			and(
				eq(userIndexTypeAddons.userId, userId),
				eq(userIndexTypeAddons.indexType, indexType),
				sql`(${userIndexTypeAddons.expiresAt} IS NULL OR ${userIndexTypeAddons.expiresAt} > NOW())`,
			),
		)
		.limit(1);

	return result.length > 0;
};
