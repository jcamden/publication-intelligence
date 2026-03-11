import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import { withUserContext } from "../../db/client";
import {
	indexEntries,
	indexEntryGroupEntries,
	indexEntryGroups,
	indexEntryGroupMatchers,
	indexMatchers,
} from "../../db/schema";
import type { AliasInput } from "./alias-engine.types";

// ============================================================================
// Types
// ============================================================================

export type IndexEntryGroupListItem = {
	id: string;
	projectId: string;
	projectIndexTypeId: string;
	name: string;
	slug: string;
	parserProfileId: string | null;
	sortMode: "a_z" | "canon_book_order";
	createdAt: Date;
	updatedAt: Date | null;
	deletedAt: Date | null;
};

export type IndexEntryGroupWithMatchers = IndexEntryGroupListItem & {
	matchers: Array<{ alias: string; matcherId: string; entryId: string }>;
};

export type CreateIndexEntryGroupInput = {
	projectId: string;
	projectIndexTypeId: string;
	name: string;
	slug: string;
	parserProfileId?: string | null;
	sortMode?: "a_z" | "canon_book_order";
	/** Seed provenance (audit only; does not gate edits) */
	seedSource?: string | null;
	seededAt?: Date | null;
	seedRunId?: string | null;
};

export type UpdateIndexEntryGroupInput = {
	name?: string;
	slug?: string;
	parserProfileId?: string | null;
	sortMode?: "a_z" | "canon_book_order";
};

// ============================================================================
// List / get groups
// ============================================================================

/**
 * List groups for a project + index type. By default excludes soft-deleted.
 */
export const listGroups = async ({
	userId,
	projectId,
	projectIndexTypeId,
	includeDeleted = false,
}: {
	userId: string;
	projectId: string;
	projectIndexTypeId: string;
	includeDeleted?: boolean;
}): Promise<IndexEntryGroupListItem[]> => {
	return await withUserContext({
		userId,
		fn: async (tx) => {
			const conditions = [
				eq(indexEntryGroups.projectId, projectId),
				eq(indexEntryGroups.projectIndexTypeId, projectIndexTypeId),
			];
			if (!includeDeleted) {
				conditions.push(isNull(indexEntryGroups.deletedAt));
			}
			const rows = await tx
				.select({
					id: indexEntryGroups.id,
					projectId: indexEntryGroups.projectId,
					projectIndexTypeId: indexEntryGroups.projectIndexTypeId,
					name: indexEntryGroups.name,
					slug: indexEntryGroups.slug,
					parserProfileId: indexEntryGroups.parserProfileId,
					sortMode: indexEntryGroups.sortMode,
					createdAt: indexEntryGroups.createdAt,
					updatedAt: indexEntryGroups.updatedAt,
					deletedAt: indexEntryGroups.deletedAt,
				})
				.from(indexEntryGroups)
				.where(and(...conditions))
				.orderBy(asc(indexEntryGroups.name));
			return rows.map((r) => ({
				id: r.id,
				projectId: r.projectId,
				projectIndexTypeId: r.projectIndexTypeId,
				name: r.name,
				slug: r.slug,
				parserProfileId: r.parserProfileId,
				sortMode: r.sortMode as "a_z" | "canon_book_order",
				createdAt: r.createdAt,
				updatedAt: r.updatedAt,
				deletedAt: r.deletedAt,
			}));
		},
	});
};

/**
 * Get one group by id (with RLS). Returns null if not found or deleted.
 */
export const getGroup = async ({
	userId,
	groupId,
}: {
	userId: string;
	groupId: string;
}): Promise<IndexEntryGroupListItem | null> => {
	return await withUserContext({
		userId,
		fn: async (tx) => {
			const [row] = await tx
				.select({
					id: indexEntryGroups.id,
					projectId: indexEntryGroups.projectId,
					projectIndexTypeId: indexEntryGroups.projectIndexTypeId,
					name: indexEntryGroups.name,
					slug: indexEntryGroups.slug,
					parserProfileId: indexEntryGroups.parserProfileId,
					sortMode: indexEntryGroups.sortMode,
					createdAt: indexEntryGroups.createdAt,
					updatedAt: indexEntryGroups.updatedAt,
					deletedAt: indexEntryGroups.deletedAt,
				})
				.from(indexEntryGroups)
				.where(eq(indexEntryGroups.id, groupId))
				.limit(1);
			if (!row) return null;
			return {
				id: row.id,
				projectId: row.projectId,
				projectIndexTypeId: row.projectIndexTypeId,
				name: row.name,
				slug: row.slug,
				parserProfileId: row.parserProfileId,
				sortMode: row.sortMode as "a_z" | "canon_book_order",
				createdAt: row.createdAt,
				updatedAt: row.updatedAt,
				deletedAt: row.deletedAt,
			};
		},
	});
};

/**
 * Fetch group metadata + matcher snapshot for detection. Returns null if group not found or deleted.
 */
export const getGroupMatcherSnapshot = async ({
	userId,
	groupId,
	indexType,
}: {
	userId: string;
	groupId: string;
	indexType: string;
}): Promise<AliasInput[] | null> => {
	const group = await getGroup({ userId, groupId });
	if (!group || group.deletedAt) return null;

	return await withUserContext({
		userId,
		fn: async (tx) => {
			const rows = await tx
				.select({
					alias: indexMatchers.text,
					matcherId: indexMatchers.id,
					entryId: indexMatchers.entryId,
				})
				.from(indexEntryGroupMatchers)
				.innerJoin(
					indexMatchers,
					eq(indexEntryGroupMatchers.matcherId, indexMatchers.id),
				)
				.innerJoin(
					indexEntries,
					and(
						eq(indexMatchers.entryId, indexEntries.id),
						eq(indexEntries.projectIndexTypeId, indexMatchers.projectIndexTypeId),
					),
				)
				.where(
					and(
						eq(indexEntryGroupMatchers.groupId, groupId),
						isNull(indexEntries.deletedAt),
					),
				)
				.orderBy(
					asc(indexEntryGroupMatchers.position),
					asc(indexEntryGroupMatchers.matcherId),
				);
			return rows.map((r) => ({
				alias: r.alias,
				matcherId: r.matcherId,
				entryId: r.entryId,
				indexType,
				groupId,
			}));
		},
	});
};

/**
 * Group metadata for detection run snapshot (id, parser_profile_id, sort_mode).
 * Used to resolve parser profile per group and cache for the run.
 */
export type IndexEntryGroupRunMeta = {
	id: string;
	parserProfileId: string | null;
	sortMode: "a_z" | "canon_book_order";
};

/**
 * List group metadata for given IDs (same project + projectIndexTypeId, deterministic order by name).
 * Used once per run to build group/profile cache. Returns only groups that exist and are not deleted.
 */
export const listGroupsByIds = async ({
	userId,
	projectId,
	projectIndexTypeId,
	groupIds,
}: {
	userId: string;
	projectId: string;
	projectIndexTypeId: string;
	groupIds: string[];
}): Promise<IndexEntryGroupRunMeta[]> => {
	if (groupIds.length === 0) return [];

	return await withUserContext({
		userId,
		fn: async (tx) => {
			const rows = await tx
				.select({
					id: indexEntryGroups.id,
					parserProfileId: indexEntryGroups.parserProfileId,
					sortMode: indexEntryGroups.sortMode,
				})
				.from(indexEntryGroups)
				.where(
					and(
						inArray(indexEntryGroups.id, groupIds),
						eq(indexEntryGroups.projectId, projectId),
						eq(indexEntryGroups.projectIndexTypeId, projectIndexTypeId),
						isNull(indexEntryGroups.deletedAt),
					),
				)
				.orderBy(asc(indexEntryGroups.name));
			return rows.map((r) => ({
				id: r.id,
				parserProfileId: r.parserProfileId,
				sortMode: r.sortMode as "a_z" | "canon_book_order",
			}));
		},
	});
};

/**
 * Resolve group IDs for a matcher run. Validates that groups belong to project + projectIndexTypeId.
 * - When indexEntryGroupIds: returns those IDs that exist, are active, and match project+type.
 * - When runAllGroups: returns all active group IDs for that projectIndexTypeId.
 * Returns empty array when no valid groups (e.g. runAllGroups but no groups created yet).
 */
export const resolveRunGroupIds = async ({
	userId,
	projectId,
	projectIndexTypeId,
	indexEntryGroupIds,
	runAllGroups,
}: {
	userId: string;
	projectId: string;
	projectIndexTypeId: string;
	indexEntryGroupIds: string[] | null;
	runAllGroups: boolean | null;
}): Promise<string[]> => {
	return await withUserContext({
		userId,
		fn: async (tx) => {
			if (runAllGroups === true) {
				const rows = await tx
					.select({ id: indexEntryGroups.id })
					.from(indexEntryGroups)
					.where(
						and(
							eq(indexEntryGroups.projectId, projectId),
							eq(indexEntryGroups.projectIndexTypeId, projectIndexTypeId),
							isNull(indexEntryGroups.deletedAt),
						),
					)
					.orderBy(asc(indexEntryGroups.name));
				return rows.map((r) => r.id);
			}
			if (
				Array.isArray(indexEntryGroupIds) &&
				indexEntryGroupIds.length > 0
			) {
				const rows = await tx
					.select({ id: indexEntryGroups.id })
					.from(indexEntryGroups)
					.where(
						and(
							inArray(indexEntryGroups.id, indexEntryGroupIds),
							eq(indexEntryGroups.projectId, projectId),
							eq(indexEntryGroups.projectIndexTypeId, projectIndexTypeId),
							isNull(indexEntryGroups.deletedAt),
						),
					);
				return rows.map((r) => r.id);
			}
			return [];
		},
	});
};

/**
 * List matcher aliases for detection run: only matchers that belong to the given group IDs.
 * Deterministic order: by group (name), then position, then matcher id.
 */
export const listMatcherAliasesByGroupIds = async ({
	userId,
	projectId,
	projectIndexTypeId,
	indexType,
	groupIds,
}: {
	userId: string;
	projectId: string;
	projectIndexTypeId: string;
	indexType: string;
	groupIds: string[];
}): Promise<AliasInput[]> => {
	if (groupIds.length === 0) return [];

	return await withUserContext({
		userId,
		fn: async (tx) => {
			// Order groups by name so snapshot order is deterministic
			const orderedGroups = await tx
				.select({ id: indexEntryGroups.id })
				.from(indexEntryGroups)
				.where(
					and(
						inArray(indexEntryGroups.id, groupIds),
						eq(indexEntryGroups.projectId, projectId),
						eq(indexEntryGroups.projectIndexTypeId, projectIndexTypeId),
					),
				)
				.orderBy(asc(indexEntryGroups.name));

			const result: AliasInput[] = [];
			for (const g of orderedGroups) {
				const rows = await tx
					.select({
						alias: indexMatchers.text,
						matcherId: indexMatchers.id,
						entryId: indexMatchers.entryId,
					})
					.from(indexEntryGroupMatchers)
					.innerJoin(
						indexMatchers,
						eq(indexEntryGroupMatchers.matcherId, indexMatchers.id),
					)
					.innerJoin(
						indexEntries,
						and(
							eq(indexMatchers.entryId, indexEntries.id),
							eq(
								indexEntries.projectIndexTypeId,
								indexMatchers.projectIndexTypeId,
							),
						),
					)
					.where(
						and(
							eq(indexEntryGroupMatchers.groupId, g.id),
							isNull(indexEntries.deletedAt),
						),
					)
					.orderBy(
						asc(indexEntryGroupMatchers.position),
						asc(indexEntryGroupMatchers.matcherId),
					);
				for (const r of rows) {
					result.push({
						alias: r.alias,
						matcherId: r.matcherId,
						entryId: r.entryId,
						indexType,
						groupId: g.id,
					});
				}
			}
			return result;
		},
	});
};

// ============================================================================
// Create / update / delete group
// ============================================================================

export const createGroup = async ({
	userId,
	input,
}: {
	userId: string;
	input: CreateIndexEntryGroupInput;
}): Promise<IndexEntryGroupListItem> => {
	return await withUserContext({
		userId,
		fn: async (tx) => {
			const [row] = await tx
				.insert(indexEntryGroups)
				.values({
					projectId: input.projectId,
					projectIndexTypeId: input.projectIndexTypeId,
					name: input.name,
					slug: input.slug,
					parserProfileId: input.parserProfileId ?? null,
					sortMode: input.sortMode ?? "a_z",
					...(input.seedSource != null && { seedSource: input.seedSource }),
					...(input.seededAt != null && { seededAt: input.seededAt }),
					...(input.seedRunId != null && { seedRunId: input.seedRunId }),
				})
				.returning();
			if (!row) throw new Error("Failed to create index entry group");
			return {
				id: row.id,
				projectId: row.projectId,
				projectIndexTypeId: row.projectIndexTypeId,
				name: row.name,
				slug: row.slug,
				parserProfileId: row.parserProfileId,
				sortMode: row.sortMode as "a_z" | "canon_book_order",
				createdAt: row.createdAt,
				updatedAt: row.updatedAt,
				deletedAt: row.deletedAt,
			};
		},
	});
};

export const updateGroup = async ({
	userId,
	groupId,
	input,
}: {
	userId: string;
	groupId: string;
	input: UpdateIndexEntryGroupInput;
}): Promise<IndexEntryGroupListItem | null> => {
	return await withUserContext({
		userId,
		fn: async (tx) => {
			const updatePayload: Record<string, unknown> = {
				updatedAt: new Date(),
			};
			if (input.name !== undefined) updatePayload.name = input.name;
			if (input.slug !== undefined) updatePayload.slug = input.slug;
			if (input.parserProfileId !== undefined)
				updatePayload.parserProfileId = input.parserProfileId;
			if (input.sortMode !== undefined) updatePayload.sortMode = input.sortMode;

			const [row] = await tx
				.update(indexEntryGroups)
				.set(updatePayload as never)
				.where(eq(indexEntryGroups.id, groupId))
				.returning();
			if (!row) return null;
			return {
				id: row.id,
				projectId: row.projectId,
				projectIndexTypeId: row.projectIndexTypeId,
				name: row.name,
				slug: row.slug,
				parserProfileId: row.parserProfileId,
				sortMode: row.sortMode as "a_z" | "canon_book_order",
				createdAt: row.createdAt,
				updatedAt: row.updatedAt,
				deletedAt: row.deletedAt,
			};
		},
	});
};

/**
 * Soft-delete a group and remove its memberships only.
 * Entries and matchers are not deleted; mention history is preserved.
 */
export const deleteGroup = async ({
	userId,
	groupId,
}: {
	userId: string;
	groupId: string;
}): Promise<boolean> => {
	return await withUserContext({
		userId,
		fn: async (tx) => {
			// Remove memberships only; entries and matchers stay intact
			await tx
				.delete(indexEntryGroupEntries)
				.where(eq(indexEntryGroupEntries.groupId, groupId));
			await tx
				.delete(indexEntryGroupMatchers)
				.where(eq(indexEntryGroupMatchers.groupId, groupId));
			const [row] = await tx
				.update(indexEntryGroups)
				.set({ deletedAt: new Date(), updatedAt: new Date() })
				.where(eq(indexEntryGroups.id, groupId))
				.returning({ id: indexEntryGroups.id });
			return !!row;
		},
	});
};

// ============================================================================
// Membership: entries
// ============================================================================

export const addEntryToGroup = async ({
	userId,
	groupId,
	entryId,
	position,
}: {
	userId: string;
	groupId: string;
	entryId: string;
	position?: number | null;
}): Promise<void> => {
	await withUserContext({
		userId,
		fn: async (tx) => {
			await tx
				.insert(indexEntryGroupEntries)
				.values({ groupId, entryId, position: position ?? null })
				.onConflictDoNothing({
					target: [
						indexEntryGroupEntries.groupId,
						indexEntryGroupEntries.entryId,
					],
				});
		},
	});
};

export const removeEntryFromGroup = async ({
	userId,
	groupId,
	entryId,
}: {
	userId: string;
	groupId: string;
	entryId: string;
}): Promise<void> => {
	await withUserContext({
		userId,
		fn: async (tx) => {
			await tx
				.delete(indexEntryGroupEntries)
				.where(
					and(
						eq(indexEntryGroupEntries.groupId, groupId),
						eq(indexEntryGroupEntries.entryId, entryId),
					),
				);
		},
	});
};

// ============================================================================
// Membership: matchers
// ============================================================================

export const addMatcherToGroup = async ({
	userId,
	groupId,
	matcherId,
	position,
}: {
	userId: string;
	groupId: string;
	matcherId: string;
	position?: number | null;
}): Promise<void> => {
	await withUserContext({
		userId,
		fn: async (tx) => {
			await tx
				.insert(indexEntryGroupMatchers)
				.values({ groupId, matcherId, position: position ?? null })
				.onConflictDoNothing({
					target: [
						indexEntryGroupMatchers.groupId,
						indexEntryGroupMatchers.matcherId,
					],
				});
		},
	});
};

export const removeMatcherFromGroup = async ({
	userId,
	groupId,
	matcherId,
}: {
	userId: string;
	groupId: string;
	matcherId: string;
}): Promise<void> => {
	await withUserContext({
		userId,
		fn: async (tx) => {
			await tx
				.delete(indexEntryGroupMatchers)
				.where(
					and(
						eq(indexEntryGroupMatchers.groupId, groupId),
						eq(indexEntryGroupMatchers.matcherId, matcherId),
					),
				);
		},
	});
};
