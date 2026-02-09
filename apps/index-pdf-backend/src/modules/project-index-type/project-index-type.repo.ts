import { and, eq, isNull, sql } from "drizzle-orm";
import { db, withUserContext } from "../../db/client";
import {
	indexEntries,
	projectIndexTypes,
	userIndexTypeAddons,
} from "../../db/schema";
import {
	getIndexTypeConfig,
	type IndexType,
} from "../../db/schema/index-type-config";
import type {
	AvailableIndexType,
	EnableProjectIndexTypeInput,
	ProjectIndexType,
	ProjectIndexTypeListItem,
	UpdateProjectIndexTypeInput,
} from "./project-index-type.types";

// ============================================================================
// Repository Layer - Database queries
// ============================================================================

export const listProjectIndexTypes = async ({
	projectId,
}: {
	projectId: string;
}): Promise<ProjectIndexTypeListItem[]> => {
	const result = await db
		.select({
			id: projectIndexTypes.id,
			colorHue: projectIndexTypes.colorHue,
			visible: projectIndexTypes.isVisible,
			indexType: projectIndexTypes.indexType,
			entry_count: sql<number>`(
				SELECT COUNT(*)::int 
				FROM ${indexEntries} 
				WHERE ${indexEntries.projectIndexTypeId} = ${projectIndexTypes.id}
					AND ${indexEntries.deletedAt} IS NULL
			)`,
		})
		.from(projectIndexTypes)
		.where(
			and(
				eq(projectIndexTypes.projectId, projectId),
				isNull(projectIndexTypes.deletedAt),
			),
		);

	return result.map((row) => {
		const config = getIndexTypeConfig(row.indexType as IndexType);
		if (!config) {
			throw new Error(
				`Index type ${row.indexType} is not configured (inactive or removed)`,
			);
		}
		return {
			id: row.id,
			colorHue: row.colorHue,
			visible: row.visible,
			indexType: row.indexType as IndexType,
			displayName: config.displayName,
			entry_count: row.entry_count,
		};
	});
};

export const listAvailableIndexTypes = async ({
	userId,
	projectId,
}: {
	userId: string;
	projectId: string;
}): Promise<AvailableIndexType[]> => {
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

	if (userAddons.length === 0) {
		return [];
	}

	const userIndexTypes = userAddons.map((a) => a.indexType as IndexType);

	// Step 2: Get index types already enabled in project
	const enabledTypes = await db
		.select({ indexType: projectIndexTypes.indexType })
		.from(projectIndexTypes)
		.where(
			and(
				eq(projectIndexTypes.projectId, projectId),
				isNull(projectIndexTypes.deletedAt),
			),
		);

	const enabledIndexTypes = enabledTypes.map((e) => e.indexType as IndexType);

	// Filter out already-enabled types
	const availableTypes = userIndexTypes.filter(
		(type) => !enabledIndexTypes.includes(type),
	);

	if (availableTypes.length === 0) {
		return [];
	}

	// Step 3: Return available types with metadata from config (filter out inactive types)
	return availableTypes
		.map((type) => {
			const config = getIndexTypeConfig(type);
			if (!config) return null; // Skip inactive types
			return {
				indexType: type,
				displayName: config.displayName,
				description: config.description,
				defaultColor: config.defaultColor,
			};
		})
		.filter((type): type is NonNullable<typeof type> => type !== null);
};

export const enableProjectIndexType = async ({
	input,
	userId,
}: {
	input: EnableProjectIndexTypeInput;
	userId: string;
}): Promise<ProjectIndexType> => {
	return await withUserContext({
		userId,
		fn: async (tx) => {
			const [projectIndexType] = await tx
				.insert(projectIndexTypes)
				.values({
					projectId: input.projectId,
					indexType: input.indexType,
					colorHue: input.colorHue,
					isVisible: true,
				})
				.returning();

			if (!projectIndexType) {
				throw new Error("Failed to enable project index type");
			}

			// Return the full type with metadata (inline to avoid nested transaction)
			const result = await tx
				.select({
					id: projectIndexTypes.id,
					projectId: projectIndexTypes.projectId,
					indexType: projectIndexTypes.indexType,
					colorHue: projectIndexTypes.colorHue,
					visible: projectIndexTypes.isVisible,
					created_at: projectIndexTypes.createdAt,
					updated_at: projectIndexTypes.updatedAt,
					deleted_at: projectIndexTypes.deletedAt,
					entry_count: sql<number>`(
						SELECT COUNT(*)::int 
						FROM ${indexEntries} 
						WHERE ${indexEntries.projectIndexTypeId} = ${projectIndexTypes.id}
							AND ${indexEntries.deletedAt} IS NULL
					)`,
				})
				.from(projectIndexTypes)
				.where(eq(projectIndexTypes.id, projectIndexType.id))
				.limit(1);

			if (result.length === 0) {
				throw new Error("Failed to retrieve enabled project index type");
			}

			const row = result[0];
			const config = getIndexTypeConfig(row.indexType as IndexType);
			if (!config) {
				throw new Error(
					`Index type ${row.indexType} is not configured (inactive or removed)`,
				);
			}

			return {
				id: row.id,
				project: { id: row.projectId },
				indexType: row.indexType as IndexType,
				displayName: config.displayName,
				description: config.description,
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

export const getProjectIndexTypeById = async ({
	id,
}: {
	id: string;
}): Promise<ProjectIndexType | null> => {
	const result = await db
		.select({
			id: projectIndexTypes.id,
			projectId: projectIndexTypes.projectId,
			indexType: projectIndexTypes.indexType,
			colorHue: projectIndexTypes.colorHue,
			visible: projectIndexTypes.isVisible,
			created_at: projectIndexTypes.createdAt,
			updated_at: projectIndexTypes.updatedAt,
			deleted_at: projectIndexTypes.deletedAt,
			entry_count: sql<number>`(
				SELECT COUNT(*)::int 
				FROM ${indexEntries} 
				WHERE ${indexEntries.projectIndexTypeId} = ${projectIndexTypes.id}
					AND ${indexEntries.deletedAt} IS NULL
			)`,
		})
		.from(projectIndexTypes)
		.where(eq(projectIndexTypes.id, id))
		.limit(1);

	if (result.length === 0) {
		return null;
	}

	const row = result[0];
	const config = getIndexTypeConfig(row.indexType as IndexType);
	if (!config) {
		throw new Error(
			`Index type ${row.indexType} is not configured (inactive or removed)`,
		);
	}

	return {
		id: row.id,
		project: { id: row.projectId },
		indexType: row.indexType as IndexType,
		displayName: config.displayName,
		description: config.description,
		colorHue: row.colorHue,
		visible: row.visible,
		created_at: row.created_at.toISOString(),
		updated_at: row.updated_at ? row.updated_at.toISOString() : null,
		deleted_at: row.deleted_at ? row.deleted_at.toISOString() : null,
		entry_count: row.entry_count,
		is_deleted: row.deleted_at !== null,
	};
};

export const updateProjectIndexType = async ({
	id,
	input,
	userId,
}: {
	id: string;
	input: UpdateProjectIndexTypeInput;
	userId: string;
}): Promise<ProjectIndexType | null> => {
	return await withUserContext({
		userId,
		fn: async (tx) => {
			const updateValues: Partial<typeof projectIndexTypes.$inferInsert> = {
				updatedAt: new Date(),
			};

			if (input.colorHue !== undefined) {
				updateValues.colorHue = input.colorHue;
			}

			if (input.visible !== undefined) {
				updateValues.isVisible = input.visible;
			}

			const result = await tx
				.update(projectIndexTypes)
				.set(updateValues)
				.where(eq(projectIndexTypes.id, id))
				.returning({ id: projectIndexTypes.id });

			if (result.length === 0) {
				return null;
			}

			// Inline getProjectIndexTypeById logic to avoid nested transaction
			const queryResult = await tx
				.select({
					id: projectIndexTypes.id,
					projectId: projectIndexTypes.projectId,
					indexType: projectIndexTypes.indexType,
					colorHue: projectIndexTypes.colorHue,
					visible: projectIndexTypes.isVisible,
					created_at: projectIndexTypes.createdAt,
					updated_at: projectIndexTypes.updatedAt,
					deleted_at: projectIndexTypes.deletedAt,
					entry_count: sql<number>`(
						SELECT COUNT(*)::int 
						FROM ${indexEntries} 
						WHERE ${indexEntries.projectIndexTypeId} = ${projectIndexTypes.id}
							AND ${indexEntries.deletedAt} IS NULL
					)`,
				})
				.from(projectIndexTypes)
				.where(eq(projectIndexTypes.id, id))
				.limit(1);

			if (queryResult.length === 0) {
				return null;
			}

			const row = queryResult[0];
			const config = getIndexTypeConfig(row.indexType as IndexType);
			if (!config) {
				throw new Error(
					`Index type ${row.indexType} is not configured (inactive or removed)`,
				);
			}

			return {
				id: row.id,
				project: { id: row.projectId },
				indexType: row.indexType as IndexType,
				displayName: config.displayName,
				description: config.description,
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

// Removed: Ordinal is now a client-side sorting concern

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

export const disableProjectIndexType = async ({
	id,
	userId,
}: {
	id: string;
	userId: string;
}): Promise<ProjectIndexType | null> => {
	return await withUserContext({
		userId,
		fn: async (tx) => {
			const result = await tx
				.update(projectIndexTypes)
				.set({
					deletedAt: new Date(),
				})
				.where(eq(projectIndexTypes.id, id))
				.returning({ id: projectIndexTypes.id });

			if (result.length === 0) {
				return null;
			}

			// Inline getProjectIndexTypeById logic to avoid nested transaction
			const queryResult = await tx
				.select({
					id: projectIndexTypes.id,
					projectId: projectIndexTypes.projectId,
					indexType: projectIndexTypes.indexType,
					colorHue: projectIndexTypes.colorHue,
					visible: projectIndexTypes.isVisible,
					created_at: projectIndexTypes.createdAt,
					updated_at: projectIndexTypes.updatedAt,
					deleted_at: projectIndexTypes.deletedAt,
					entry_count: sql<number>`(
						SELECT COUNT(*)::int 
						FROM ${indexEntries} 
						WHERE ${indexEntries.projectIndexTypeId} = ${projectIndexTypes.id}
							AND ${indexEntries.deletedAt} IS NULL
					)`,
				})
				.from(projectIndexTypes)
				.where(eq(projectIndexTypes.id, id))
				.limit(1);

			if (queryResult.length === 0) {
				return null;
			}

			const row = queryResult[0];
			const config = getIndexTypeConfig(row.indexType as IndexType);
			if (!config) {
				throw new Error(
					`Index type ${row.indexType} is not configured (inactive or removed)`,
				);
			}

			return {
				id: row.id,
				project: { id: row.projectId },
				indexType: row.indexType as IndexType,
				displayName: config.displayName,
				description: config.description,
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
