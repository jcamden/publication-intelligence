import { and, asc, count, eq, inArray, isNull, ne, sql } from "drizzle-orm";
import { withUserContext } from "../../../db/client";
import {
	indexEntries,
	indexEntryGroupEntries,
	indexEntryGroupMatchers,
	indexEntryGroups,
	indexMatchers,
} from "../../../db/schema";
import type { AliasInput } from "../alias/alias-engine.types";

// ============================================================================
// Types
// ============================================================================

/** Sort mode from DB enum (includes canon-specific values for scripture groups). */
export type IndexEntryGroupSortMode =
	| "a_z"
	| "canon_book_order"
	| "custom"
	| "protestant"
	| "roman_catholic"
	| "tanakh"
	| "eastern_orthodox";

export type IndexEntryGroupListItem = {
	id: string;
	projectId: string;
	projectIndexTypeId: string;
	name: string;
	sortMode: IndexEntryGroupSortMode;
	position: number | null;
	createdAt: Date;
	updatedAt: Date | null;
	deletedAt: Date | null;
};

/** List item with matcher count for detection UI. */
export type IndexEntryGroupListItemWithMeta = IndexEntryGroupListItem & {
	matcherCount: number;
};

export type IndexEntryGroupWithMatchers = IndexEntryGroupListItem & {
	matchers: Array<{ alias: string; matcherId: string; entryId: string }>;
};

export type CreateIndexEntryGroupInput = {
	projectId: string;
	projectIndexTypeId: string;
	name: string;
	sortMode?: IndexEntryGroupSortMode;
	/** Seed provenance (audit only; does not gate edits) */
	seedSource?: string | null;
	seededAt?: Date | null;
	seedRunId?: string | null;
};

export type UpdateIndexEntryGroupInput = {
	name?: string;
	sortMode?: IndexEntryGroupSortMode;
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
					sortMode: indexEntryGroups.sortMode,
					position: indexEntryGroups.position,
					createdAt: indexEntryGroups.createdAt,
					updatedAt: indexEntryGroups.updatedAt,
					deletedAt: indexEntryGroups.deletedAt,
				})
				.from(indexEntryGroups)
				.where(and(...conditions))
				.orderBy(
					sql`${indexEntryGroups.position} ASC NULLS LAST`,
					asc(indexEntryGroups.name),
				);
			return rows.map((r) => ({
				id: r.id,
				projectId: r.projectId,
				projectIndexTypeId: r.projectIndexTypeId,
				name: r.name,
				sortMode: r.sortMode as IndexEntryGroupSortMode,
				position: r.position,
				createdAt: r.createdAt,
				updatedAt: r.updatedAt,
				deletedAt: r.deletedAt,
			}));
		},
	});
};

/**
 * List groups for a project + index type with matcher count per group. Excludes soft-deleted.
 */
export const listGroupsWithMeta = async ({
	userId,
	projectId,
	projectIndexTypeId,
}: {
	userId: string;
	projectId: string;
	projectIndexTypeId: string;
}): Promise<IndexEntryGroupListItemWithMeta[]> => {
	return await withUserContext({
		userId,
		fn: async (tx) => {
			const rows = await tx
				.select({
					id: indexEntryGroups.id,
					projectId: indexEntryGroups.projectId,
					projectIndexTypeId: indexEntryGroups.projectIndexTypeId,
					name: indexEntryGroups.name,
					sortMode: indexEntryGroups.sortMode,
					position: indexEntryGroups.position,
					createdAt: indexEntryGroups.createdAt,
					updatedAt: indexEntryGroups.updatedAt,
					deletedAt: indexEntryGroups.deletedAt,
					matcherCount: count(indexEntryGroupMatchers.matcherId),
				})
				.from(indexEntryGroups)
				.leftJoin(
					indexEntryGroupMatchers,
					eq(indexEntryGroupMatchers.groupId, indexEntryGroups.id),
				)
				.where(
					and(
						eq(indexEntryGroups.projectId, projectId),
						eq(indexEntryGroups.projectIndexTypeId, projectIndexTypeId),
						isNull(indexEntryGroups.deletedAt),
					),
				)
				.groupBy(
					indexEntryGroups.id,
					indexEntryGroups.projectId,
					indexEntryGroups.projectIndexTypeId,
					indexEntryGroups.name,
					indexEntryGroups.sortMode,
					indexEntryGroups.position,
					indexEntryGroups.createdAt,
					indexEntryGroups.updatedAt,
					indexEntryGroups.deletedAt,
				)
				.orderBy(
					sql`${indexEntryGroups.position} ASC NULLS LAST`,
					asc(indexEntryGroups.name),
				);
			return rows.map((r) => ({
				id: r.id,
				projectId: r.projectId,
				projectIndexTypeId: r.projectIndexTypeId,
				name: r.name,
				sortMode: r.sortMode as IndexEntryGroupSortMode,
				position: r.position,
				createdAt: r.createdAt,
				updatedAt: r.updatedAt,
				deletedAt: r.deletedAt,
				matcherCount: Number(r.matcherCount),
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
					sortMode: indexEntryGroups.sortMode,
					position: indexEntryGroups.position,
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
				sortMode: row.sortMode as IndexEntryGroupSortMode,
				position: row.position,
				createdAt: row.createdAt,
				updatedAt: row.updatedAt,
				deletedAt: row.deletedAt,
			};
		},
	});
};

/** Group with entries for Edit Group modal. */
export type IndexEntryGroupWithEntries = IndexEntryGroupListItem & {
	entries: Array<{
		entryId: string;
		label: string;
		slug: string;
		position: number | null;
		matcherCount: number;
	}>;
	matcherCount: number;
};

/**
 * Get group with entries (for Edit Group modal). Returns null if not found or deleted.
 */
export const getGroupWithEntries = async ({
	userId,
	groupId,
}: {
	userId: string;
	groupId: string;
}): Promise<IndexEntryGroupWithEntries | null> => {
	const group = await getGroup({ userId, groupId });
	if (!group || group.deletedAt) return null;

	return await withUserContext({
		userId,
		fn: async (tx) => {
			const [matcherCountRow] = await tx
				.select({ count: count() })
				.from(indexEntryGroupMatchers)
				.where(eq(indexEntryGroupMatchers.groupId, groupId));

			const entryRows = await tx
				.select({
					entryId: indexEntryGroupEntries.entryId,
					position: indexEntryGroupEntries.position,
					label: indexEntries.label,
					slug: indexEntries.slug,
				})
				.from(indexEntryGroupEntries)
				.innerJoin(
					indexEntries,
					eq(indexEntryGroupEntries.entryId, indexEntries.id),
				)
				.where(
					and(
						eq(indexEntryGroupEntries.groupId, groupId),
						isNull(indexEntries.deletedAt),
					),
				)
				.orderBy(asc(indexEntryGroupEntries.position), asc(indexEntries.label));

			const entryIds = entryRows.map((r) => r.entryId);
			const matcherCounts =
				entryIds.length > 0
					? await tx
							.select({
								entryId: indexMatchers.entryId,
								count: count(),
							})
							.from(indexMatchers)
							.where(inArray(indexMatchers.entryId, entryIds))
							.groupBy(indexMatchers.entryId)
					: [];
			const matcherCountMap = new Map(
				matcherCounts.map((m) => [m.entryId, Number(m.count)]),
			);

			return {
				...group,
				matcherCount: Number(matcherCountRow?.count ?? 0),
				entries: entryRows.map((r) => ({
					entryId: r.entryId,
					label: r.label,
					slug: r.slug,
					position: r.position,
					matcherCount: matcherCountMap.get(r.entryId) ?? 0,
				})),
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
						eq(
							indexEntries.projectIndexTypeId,
							indexMatchers.projectIndexTypeId,
						),
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
 * Group metadata for detection run snapshot (id, sort_mode).
 * Parser profile is derived from index type, not per group.
 */
export type IndexEntryGroupRunMeta = {
	id: string;
	sortMode: IndexEntryGroupSortMode;
};

/**
 * List group metadata for given IDs (same project + projectIndexTypeId, deterministic order by name).
 * Returns only groups that exist and are not deleted.
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
				.orderBy(
					sql`${indexEntryGroups.position} ASC NULLS LAST`,
					asc(indexEntryGroups.name),
				);
			return rows.map((r) => ({
				id: r.id,
				sortMode: r.sortMode as IndexEntryGroupSortMode,
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
					.orderBy(
						sql`${indexEntryGroups.position} ASC NULLS LAST`,
						asc(indexEntryGroups.name),
					);
				return rows.map((r) => r.id);
			}
			if (Array.isArray(indexEntryGroupIds) && indexEntryGroupIds.length > 0) {
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
 * List matcher aliases for detection run: matchers from (1) index_entry_group_matchers
 * and (2) entries in index_entry_group_entries and their descendants.
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
			// Order groups by position then name so snapshot order is deterministic
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
				.orderBy(
					sql`${indexEntryGroups.position} ASC NULLS LAST`,
					asc(indexEntryGroups.name),
				);

			const result: AliasInput[] = [];
			for (const g of orderedGroups) {
				const seenMatcherIds = new Set<string>();

				// (1) Matchers from index_entry_group_matchers (direct matcher-to-group)
				const directRows = await tx
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
				for (const r of directRows) {
					seenMatcherIds.add(r.matcherId);
					result.push({
						alias: r.alias,
						matcherId: r.matcherId,
						entryId: r.entryId,
						indexType,
						groupId: g.id,
					});
				}

				// (2) Matchers from entries in index_entry_group_entries and their descendants
				// Collect root entry IDs, then iteratively add descendants
				const rootEntryRows = await tx
					.select({ entryId: indexEntryGroupEntries.entryId })
					.from(indexEntryGroupEntries)
					.where(eq(indexEntryGroupEntries.groupId, g.id));
				const entryIds = new Set(rootEntryRows.map((r) => r.entryId));
				for (;;) {
					const parentIds = [...entryIds];
					const children = await tx
						.select({ id: indexEntries.id })
						.from(indexEntries)
						.where(
							and(
								inArray(indexEntries.parentId, parentIds),
								isNull(indexEntries.deletedAt),
							),
						);
					let added = 0;
					for (const c of children) {
						if (!entryIds.has(c.id)) {
							entryIds.add(c.id);
							added++;
						}
					}
					if (added === 0) break;
				}
				if (entryIds.size > 0) {
					const entryBasedRows = await tx
						.select({
							alias: indexMatchers.text,
							matcherId: indexMatchers.id,
							entryId: indexMatchers.entryId,
						})
						.from(indexMatchers)
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
								inArray(indexMatchers.entryId, [...entryIds]),
								eq(indexMatchers.projectIndexTypeId, projectIndexTypeId),
								isNull(indexEntries.deletedAt),
							),
						)
						.orderBy(asc(indexMatchers.id));
					for (const r of entryBasedRows) {
						if (seenMatcherIds.has(r.matcherId)) continue;
						seenMatcherIds.add(r.matcherId);
						result.push({
							alias: r.alias,
							matcherId: r.matcherId,
							entryId: r.entryId,
							indexType,
							groupId: g.id,
						});
					}
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
				sortMode: row.sortMode as IndexEntryGroupSortMode,
				position: row.position,
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
			const switchingToCustom = input.sortMode === "custom";

			if (switchingToCustom) {
				// Snapshot current order into position before switching
				const [current] = await tx
					.select({ sortMode: indexEntryGroups.sortMode })
					.from(indexEntryGroups)
					.where(eq(indexEntryGroups.id, groupId))
					.limit(1);
				if (current && current.sortMode !== "custom") {
					const entries = await tx
						.select({
							entryId: indexEntryGroupEntries.entryId,
							position: indexEntryGroupEntries.position,
							label: indexEntries.label,
						})
						.from(indexEntryGroupEntries)
						.innerJoin(
							indexEntries,
							eq(indexEntryGroupEntries.entryId, indexEntries.id),
						)
						.where(eq(indexEntryGroupEntries.groupId, groupId))
						.orderBy(
							asc(indexEntryGroupEntries.position),
							asc(indexEntries.label),
						);
					for (let i = 0; i < entries.length; i++) {
						await tx
							.update(indexEntryGroupEntries)
							.set({ position: i })
							.where(
								and(
									eq(indexEntryGroupEntries.groupId, groupId),
									eq(indexEntryGroupEntries.entryId, entries[i].entryId),
								),
							);
					}
				}
			}

			const updatePayload: Record<string, unknown> = {
				updatedAt: new Date(),
			};
			if (input.name !== undefined) updatePayload.name = input.name;
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
				sortMode: row.sortMode as IndexEntryGroupSortMode,
				position: row.position,
				createdAt: row.createdAt,
				updatedAt: row.updatedAt,
				deletedAt: row.deletedAt,
			};
		},
	});
};

/**
 * Reorder groups by updating position for each group. Validates all groupIds
 * belong to project + projectIndexTypeId.
 */
export const reorderGroups = async ({
	userId,
	projectId,
	projectIndexTypeId,
	groupIds,
}: {
	userId: string;
	projectId: string;
	projectIndexTypeId: string;
	groupIds: string[];
}): Promise<void> => {
	if (groupIds.length === 0) return;

	await withUserContext({
		userId,
		fn: async (tx) => {
			// Validate all groups exist and belong to project+type
			const rows = await tx
				.select({ id: indexEntryGroups.id })
				.from(indexEntryGroups)
				.where(
					and(
						inArray(indexEntryGroups.id, groupIds),
						eq(indexEntryGroups.projectId, projectId),
						eq(indexEntryGroups.projectIndexTypeId, projectIndexTypeId),
						isNull(indexEntryGroups.deletedAt),
					),
				);
			const foundIds = new Set(rows.map((r) => r.id));
			if (foundIds.size !== groupIds.length) {
				const missing = groupIds.filter((id) => !foundIds.has(id));
				throw new Error(
					`Invalid group IDs or not in project: ${missing.join(", ")}`,
				);
			}
			for (let i = 0; i < groupIds.length; i++) {
				await tx
					.update(indexEntryGroups)
					.set({ position: i, updatedAt: new Date() })
					.where(
						and(
							eq(indexEntryGroups.id, groupIds[i]),
							eq(indexEntryGroups.projectId, projectId),
							eq(indexEntryGroups.projectIndexTypeId, projectIndexTypeId),
						),
					);
			}
		},
	});
};

/**
 * Merge source group into target: move all entries and matchers to target,
 * then soft-delete source. Both groups must exist, not be deleted, and belong
 * to the same project + projectIndexTypeId.
 */
export const mergeGroups = async ({
	userId,
	sourceGroupId,
	targetGroupId,
}: {
	userId: string;
	sourceGroupId: string;
	targetGroupId: string;
}): Promise<void> => {
	if (sourceGroupId === targetGroupId) {
		throw new Error("Source and target group must be different");
	}

	await withUserContext({
		userId,
		fn: async (tx) => {
			const [source, target] = await Promise.all([
				tx
					.select({
						id: indexEntryGroups.id,
						projectId: indexEntryGroups.projectId,
						projectIndexTypeId: indexEntryGroups.projectIndexTypeId,
					})
					.from(indexEntryGroups)
					.where(
						and(
							eq(indexEntryGroups.id, sourceGroupId),
							isNull(indexEntryGroups.deletedAt),
						),
					)
					.limit(1),
				tx
					.select({
						id: indexEntryGroups.id,
						projectId: indexEntryGroups.projectId,
						projectIndexTypeId: indexEntryGroups.projectIndexTypeId,
					})
					.from(indexEntryGroups)
					.where(
						and(
							eq(indexEntryGroups.id, targetGroupId),
							isNull(indexEntryGroups.deletedAt),
						),
					)
					.limit(1),
			]);

			const sourceRow = source[0];
			const targetRow = target[0];
			if (!sourceRow || !targetRow) {
				throw new Error("Source or target group not found or deleted");
			}
			if (sourceRow.projectId !== targetRow.projectId) {
				throw new Error("Groups must belong to same project");
			}
			if (sourceRow.projectIndexTypeId !== targetRow.projectIndexTypeId) {
				throw new Error("Groups must belong to same index type");
			}

			// Move entries: delete from source, add to target (transfer logic)
			const sourceEntries = await tx
				.select({
					entryId: indexEntryGroupEntries.entryId,
					position: indexEntryGroupEntries.position,
				})
				.from(indexEntryGroupEntries)
				.where(eq(indexEntryGroupEntries.groupId, sourceGroupId));

			await tx
				.delete(indexEntryGroupEntries)
				.where(eq(indexEntryGroupEntries.groupId, sourceGroupId));

			for (const { entryId, position } of sourceEntries) {
				// Remove from any other group (one group per entry)
				await tx
					.delete(indexEntryGroupEntries)
					.where(
						and(
							eq(indexEntryGroupEntries.entryId, entryId),
							ne(indexEntryGroupEntries.groupId, targetGroupId),
						),
					);
				await tx
					.insert(indexEntryGroupEntries)
					.values({
						groupId: targetGroupId,
						entryId,
						position,
					})
					.onConflictDoUpdate({
						target: [
							indexEntryGroupEntries.groupId,
							indexEntryGroupEntries.entryId,
						],
						set: { position },
					});
			}

			// Move matchers: delete from source, add to target
			const sourceMatchers = await tx
				.select({
					matcherId: indexEntryGroupMatchers.matcherId,
					position: indexEntryGroupMatchers.position,
				})
				.from(indexEntryGroupMatchers)
				.where(eq(indexEntryGroupMatchers.groupId, sourceGroupId));

			await tx
				.delete(indexEntryGroupMatchers)
				.where(eq(indexEntryGroupMatchers.groupId, sourceGroupId));

			for (const { matcherId, position } of sourceMatchers) {
				await tx
					.insert(indexEntryGroupMatchers)
					.values({
						groupId: targetGroupId,
						matcherId,
						position,
					})
					.onConflictDoNothing({
						target: [
							indexEntryGroupMatchers.groupId,
							indexEntryGroupMatchers.matcherId,
						],
					});
			}

			// Soft-delete source group
			await tx
				.update(indexEntryGroups)
				.set({ deletedAt: new Date(), updatedAt: new Date() })
				.where(eq(indexEntryGroups.id, sourceGroupId));
		},
	});
};

/**
 * Check if an entry is already in a group.
 */
export const hasEntryInGroup = async ({
	userId,
	groupId,
	entryId,
}: {
	userId: string;
	groupId: string;
	entryId: string;
}): Promise<boolean> => {
	return await withUserContext({
		userId,
		fn: async (tx) => {
			const [row] = await tx
				.select({ entryId: indexEntryGroupEntries.entryId })
				.from(indexEntryGroupEntries)
				.where(
					and(
						eq(indexEntryGroupEntries.groupId, groupId),
						eq(indexEntryGroupEntries.entryId, entryId),
					),
				)
				.limit(1);
			return !!row;
		},
	});
};

/**
 * Get entry IDs that belong to a group (root entries in index_entry_group_entries).
 * Used when deleteEntries=true to know which entries to delete.
 */
export const getGroupEntryIds = async ({
	userId,
	groupId,
}: {
	userId: string;
	groupId: string;
}): Promise<string[]> => {
	return await withUserContext({
		userId,
		fn: async (tx) => {
			const rows = await tx
				.select({ entryId: indexEntryGroupEntries.entryId })
				.from(indexEntryGroupEntries)
				.where(eq(indexEntryGroupEntries.groupId, groupId));
			return rows.map((r) => r.entryId);
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

export type AddEntryToGroupResult = {
	transferredFrom: string | null;
};

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
}): Promise<AddEntryToGroupResult> => {
	return await withUserContext({
		userId,
		fn: async (tx) => {
			// One group per entry: remove from any other group first
			const deleted = await tx
				.delete(indexEntryGroupEntries)
				.where(
					and(
						eq(indexEntryGroupEntries.entryId, entryId),
						ne(indexEntryGroupEntries.groupId, groupId),
					),
				)
				.returning({ groupId: indexEntryGroupEntries.groupId });

			const transferredFrom = deleted.length > 0 ? deleted[0].groupId : null;

			await tx
				.insert(indexEntryGroupEntries)
				.values({ groupId, entryId, position: position ?? null })
				.onConflictDoUpdate({
					target: [
						indexEntryGroupEntries.groupId,
						indexEntryGroupEntries.entryId,
					],
					set: { position: position ?? null },
				});

			return { transferredFrom };
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

/**
 * Reorder entries within a group (custom sort mode). Updates position for each entry.
 */
export const reorderGroupEntries = async ({
	userId,
	groupId,
	entryIds,
}: {
	userId: string;
	groupId: string;
	entryIds: string[];
}): Promise<void> => {
	await withUserContext({
		userId,
		fn: async (tx) => {
			for (let i = 0; i < entryIds.length; i++) {
				await tx
					.update(indexEntryGroupEntries)
					.set({ position: i })
					.where(
						and(
							eq(indexEntryGroupEntries.groupId, groupId),
							eq(indexEntryGroupEntries.entryId, entryIds[i]),
						),
					);
			}
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
