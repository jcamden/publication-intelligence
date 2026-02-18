import { and, count, eq, ilike, inArray, isNull, or, sql } from "drizzle-orm";
import { db, withUserContext } from "../../db/client";
import {
	indexEntries,
	indexMatchers,
	indexMentions,
	indexRelations,
	projectIndexTypes,
} from "../../db/schema";
import * as indexMentionRepo from "../index-mention/index-mention.repo";
import type {
	CreateIndexEntryInput,
	CrossReference,
	IndexEntry,
	IndexEntryListItem,
	IndexEntrySearchResult,
	IndexView,
	UpdateIndexEntryInput,
	UpdateIndexEntryParentInput,
} from "./index-entry.types";
import { mergeAndFormatPageRanges } from "./page-range-utils";
import { generateSlug } from "./slug-utils";

// ============================================================================
// Repository Layer - Database queries for IndexEntry
// ============================================================================

export const listIndexEntries = async ({
	projectId,
	projectIndexTypeId,
	includeDeleted = false,
}: {
	projectId: string;
	projectIndexTypeId?: string;
	includeDeleted?: boolean;
}): Promise<IndexEntryListItem[]> => {
	const entries = await db
		.select({
			id: indexEntries.id,
			projectIndexTypeId: indexEntries.projectIndexTypeId,
			slug: indexEntries.slug,
			label: indexEntries.label,
			status: indexEntries.status,
			parentId: indexEntries.parentId,
			createdAt: indexEntries.createdAt,
			updatedAt: indexEntries.updatedAt,
			projectIndexType: {
				id: projectIndexTypes.id,
				indexType: projectIndexTypes.highlightType,
				colorHue: projectIndexTypes.colorHue,
			},
		})
		.from(indexEntries)
		.innerJoin(
			projectIndexTypes,
			eq(indexEntries.projectIndexTypeId, projectIndexTypes.id),
		)
		.where(
			and(
				eq(indexEntries.projectId, projectId),
				projectIndexTypeId
					? eq(indexEntries.projectIndexTypeId, projectIndexTypeId)
					: undefined,
				includeDeleted ? undefined : isNull(indexEntries.deletedAt),
			),
		)
		.orderBy(indexEntries.parentId, indexEntries.label);

	const entryIds = entries.map((e) => e.id);

	if (entryIds.length === 0) {
		return [];
	}

	const [mentionCounts, childCounts, matchers] = await Promise.all([
		db
			.select({
				entryId: indexMentions.entryId,
				count: count(),
			})
			.from(indexMentions)
			.where(
				and(
					inArray(indexMentions.entryId, entryIds),
					isNull(indexMentions.deletedAt),
				),
			)
			.groupBy(indexMentions.entryId),
		db
			.select({
				parentId: indexEntries.parentId,
				count: count(),
			})
			.from(indexEntries)
			.where(
				and(
					inArray(indexEntries.parentId, entryIds),
					isNull(indexEntries.deletedAt),
				),
			)
			.groupBy(indexEntries.parentId),
		db
			.select({
				id: indexMatchers.id,
				entryId: indexMatchers.entryId,
				text: indexMatchers.text,
				matcherType: indexMatchers.matcherType,
				revision: indexMatchers.revision,
				createdAt: indexMatchers.createdAt,
				updatedAt: indexMatchers.updatedAt,
			})
			.from(indexMatchers)
			.where(inArray(indexMatchers.entryId, entryIds)),
	]);

	const mentionCountMap = new Map(
		mentionCounts.map((mc) => [mc.entryId, mc.count]),
	);
	const childCountMap = new Map(
		childCounts
			.filter((cc) => cc.parentId !== null)
			.map((cc) => [cc.parentId as string, cc.count]),
	);
	const matchersMap = new Map<string, typeof matchers>();
	for (const matcher of matchers) {
		const existing = matchersMap.get(matcher.entryId) || [];
		existing.push(matcher);
		matchersMap.set(matcher.entryId, existing);
	}

	const parentIds = entries
		.map((e) => e.parentId)
		.filter((id): id is string => id !== null);

	const parentEntries =
		parentIds.length > 0
			? await db
					.select({
						id: indexEntries.id,
						label: indexEntries.label,
					})
					.from(indexEntries)
					.where(inArray(indexEntries.id, parentIds))
			: [];

	const parentMap = new Map(parentEntries.map((p) => [p.id, p]));

	return entries.map((entry) => ({
		id: entry.id,
		projectIndexTypeId: entry.projectIndexTypeId,
		slug: entry.slug,
		label: entry.label,
		status: entry.status,
		parentId: entry.parentId,
		parent: entry.parentId ? parentMap.get(entry.parentId) || null : null,
		projectIndexType: entry.projectIndexType,
		mentionCount: mentionCountMap.get(entry.id) || 0,
		childCount: childCountMap.get(entry.id) || 0,
		matchers: (matchersMap.get(entry.id) || []).map((m) => ({
			id: m.id,
			entryId: m.entryId,
			text: m.text,
			matcherType: m.matcherType,
			revision: m.revision,
			createdAt: m.createdAt.toISOString(),
			updatedAt: m.updatedAt?.toISOString() || null,
		})),
		createdAt: entry.createdAt.toISOString(),
		updatedAt: entry.updatedAt?.toISOString() || null,
	}));
};

export const getIndexEntryById = async ({
	id,
}: {
	id: string;
}): Promise<IndexEntry | null> => {
	const result = await db
		.select({
			id: indexEntries.id,
			projectId: indexEntries.projectId,
			projectIndexTypeId: indexEntries.projectIndexTypeId,
			slug: indexEntries.slug,
			label: indexEntries.label,
			status: indexEntries.status,
			revision: indexEntries.revision,
			parentId: indexEntries.parentId,
			createdAt: indexEntries.createdAt,
			updatedAt: indexEntries.updatedAt,
			deletedAt: indexEntries.deletedAt,
		})
		.from(indexEntries)
		.where(eq(indexEntries.id, id))
		.limit(1);

	if (result.length === 0) {
		return null;
	}

	const entry = result[0];
	const matchers = await db
		.select({
			id: indexMatchers.id,
			entryId: indexMatchers.entryId,
			text: indexMatchers.text,
			matcherType: indexMatchers.matcherType,
			revision: indexMatchers.revision,
			createdAt: indexMatchers.createdAt,
			updatedAt: indexMatchers.updatedAt,
		})
		.from(indexMatchers)
		.where(eq(indexMatchers.entryId, id));

	return {
		id: entry.id,
		projectId: entry.projectId,
		projectIndexTypeId: entry.projectIndexTypeId,
		slug: entry.slug,
		label: entry.label,
		status: entry.status,
		revision: entry.revision,
		parentId: entry.parentId,
		createdAt: entry.createdAt.toISOString(),
		updatedAt: entry.updatedAt?.toISOString() || null,
		deletedAt: entry.deletedAt?.toISOString() || null,
		matchers: matchers.map((m) => ({
			id: m.id,
			entryId: m.entryId,
			text: m.text,
			matcherType: m.matcherType,
			revision: m.revision,
			createdAt: m.createdAt.toISOString(),
			updatedAt: m.updatedAt?.toISOString() || null,
		})),
	};
};

export const createIndexEntry = async ({
	input,
	userId,
}: {
	input: CreateIndexEntryInput;
	userId: string;
}): Promise<IndexEntry> => {
	return await withUserContext({
		userId,
		fn: async (tx) => {
			// Generate slug from label and hierarchy if not provided
			const slug =
				input.slug ||
				(await generateSlug({
					label: input.label,
					parentId: input.parentId || null,
					getEntryById: async (id: string) => {
						const result = await tx
							.select({
								label: indexEntries.label,
								parentId: indexEntries.parentId,
							})
							.from(indexEntries)
							.where(eq(indexEntries.id, id))
							.limit(1);
						return result[0] || null;
					},
				}));

			const [entry] = await tx
				.insert(indexEntries)
				.values({
					projectId: input.projectId,
					projectIndexTypeId: input.projectIndexTypeId,
					slug,
					label: input.label,
					parentId: input.parentId || null,
					status: "active",
					revision: 1,
				})
				.returning();

			if (!entry) {
				throw new Error("Failed to create index entry");
			}

			if (input.matchers && input.matchers.length > 0) {
				await tx.insert(indexMatchers).values(
					input.matchers.map((text) => ({
						entryId: entry.id,
						text,
						matcherType: "alias" as const,
						revision: 1,
					})),
				);
			}

			const matchers = input.matchers
				? await tx
						.select({
							id: indexMatchers.id,
							entryId: indexMatchers.entryId,
							text: indexMatchers.text,
							matcherType: indexMatchers.matcherType,
							revision: indexMatchers.revision,
							createdAt: indexMatchers.createdAt,
							updatedAt: indexMatchers.updatedAt,
						})
						.from(indexMatchers)
						.where(eq(indexMatchers.entryId, entry.id))
				: [];

			return {
				id: entry.id,
				projectId: entry.projectId,
				projectIndexTypeId: entry.projectIndexTypeId,
				slug: entry.slug,
				label: entry.label,
				status: entry.status,
				revision: entry.revision,
				parentId: entry.parentId,
				createdAt: entry.createdAt.toISOString(),
				updatedAt: entry.updatedAt?.toISOString() || null,
				deletedAt: entry.deletedAt?.toISOString() || null,
				matchers: matchers.map((m) => ({
					id: m.id,
					entryId: m.entryId,
					text: m.text,
					matcherType: m.matcherType,
					revision: m.revision,
					createdAt: m.createdAt.toISOString(),
					updatedAt: m.updatedAt?.toISOString() || null,
				})),
			};
		},
	});
};

export const updateIndexEntry = async ({
	input,
	userId,
}: {
	input: UpdateIndexEntryInput;
	userId: string;
}): Promise<IndexEntry | null> => {
	return await withUserContext({
		userId,
		fn: async (tx) => {
			const updateValues: Partial<typeof indexEntries.$inferInsert> = {
				updatedAt: new Date(),
			};

			if (input.label !== undefined) {
				updateValues.label = input.label;
			}

			const result = await tx
				.update(indexEntries)
				.set({
					...updateValues,
					revision: sql`${indexEntries.revision} + 1`,
				})
				.where(eq(indexEntries.id, input.id))
				.returning({ id: indexEntries.id });

			if (result.length === 0) {
				return null;
			}

			if (input.matchers !== undefined) {
				await tx
					.delete(indexMatchers)
					.where(eq(indexMatchers.entryId, input.id));

				if (input.matchers.length > 0) {
					await tx.insert(indexMatchers).values(
						input.matchers.map((text) => ({
							entryId: input.id,
							text,
							matcherType: "alias" as const,
							revision: 1,
						})),
					);
				}
			}

			const entry = await tx
				.select({
					id: indexEntries.id,
					projectId: indexEntries.projectId,
					projectIndexTypeId: indexEntries.projectIndexTypeId,
					slug: indexEntries.slug,
					label: indexEntries.label,
					status: indexEntries.status,
					revision: indexEntries.revision,
					parentId: indexEntries.parentId,
					createdAt: indexEntries.createdAt,
					updatedAt: indexEntries.updatedAt,
					deletedAt: indexEntries.deletedAt,
				})
				.from(indexEntries)
				.where(eq(indexEntries.id, input.id))
				.limit(1);

			if (entry.length === 0) {
				return null;
			}

			const matchers = await tx
				.select({
					id: indexMatchers.id,
					entryId: indexMatchers.entryId,
					text: indexMatchers.text,
					matcherType: indexMatchers.matcherType,
					revision: indexMatchers.revision,
					createdAt: indexMatchers.createdAt,
					updatedAt: indexMatchers.updatedAt,
				})
				.from(indexMatchers)
				.where(eq(indexMatchers.entryId, input.id));

			const e = entry[0];
			return {
				id: e.id,
				projectId: e.projectId,
				projectIndexTypeId: e.projectIndexTypeId,
				slug: e.slug,
				label: e.label,
				status: e.status,
				revision: e.revision,
				parentId: e.parentId,
				createdAt: e.createdAt.toISOString(),
				updatedAt: e.updatedAt?.toISOString() || null,
				deletedAt: e.deletedAt?.toISOString() || null,
				matchers: matchers.map((m) => ({
					id: m.id,
					entryId: m.entryId,
					text: m.text,
					matcherType: m.matcherType,
					revision: m.revision,
					createdAt: m.createdAt.toISOString(),
					updatedAt: m.updatedAt?.toISOString() || null,
				})),
			};
		},
	});
};

export const approveIndexEntry = async ({
	id,
	userId,
}: {
	id: string;
	userId: string;
}): Promise<IndexEntry | null> => {
	return await withUserContext({
		userId,
		fn: async (tx) => {
			try {
				// First check if entry exists
				const existingEntry = await tx
					.select({ id: indexEntries.id, status: indexEntries.status })
					.from(indexEntries)
					.where(eq(indexEntries.id, id))
					.limit(1);

				if (existingEntry.length === 0) {
					console.error(`[approveIndexEntry] Entry not found: ${id}`);
					return null;
				}

				console.log(
					`[approveIndexEntry] Approving entry ${id} with current status: ${existingEntry[0].status}`,
				);

				const result = await tx
					.update(indexEntries)
					.set({
						status: "active",
						updatedAt: new Date(),
						revision: sql`${indexEntries.revision} + 1`,
					})
					.where(eq(indexEntries.id, id))
					.returning({ id: indexEntries.id });

				if (result.length === 0) {
					console.error(
						`[approveIndexEntry] Update returned no results for ${id}`,
					);
					return null;
				}

				const entry = await tx
					.select({
						id: indexEntries.id,
						projectId: indexEntries.projectId,
						projectIndexTypeId: indexEntries.projectIndexTypeId,
						slug: indexEntries.slug,
						label: indexEntries.label,
						status: indexEntries.status,
						revision: indexEntries.revision,
						parentId: indexEntries.parentId,
						createdAt: indexEntries.createdAt,
						updatedAt: indexEntries.updatedAt,
						deletedAt: indexEntries.deletedAt,
					})
					.from(indexEntries)
					.where(eq(indexEntries.id, id))
					.limit(1);

				if (entry.length === 0) {
					console.error(
						`[approveIndexEntry] Entry vanished after update: ${id}`,
					);
					return null;
				}

				const matchers = await tx
					.select({
						id: indexMatchers.id,
						entryId: indexMatchers.entryId,
						text: indexMatchers.text,
						matcherType: indexMatchers.matcherType,
						revision: indexMatchers.revision,
						createdAt: indexMatchers.createdAt,
						updatedAt: indexMatchers.updatedAt,
					})
					.from(indexMatchers)
					.where(eq(indexMatchers.entryId, id));

				console.log(
					`[approveIndexEntry] Successfully approved entry ${id}, found ${matchers.length} matchers`,
				);

				const e = entry[0];
				return {
					id: e.id,
					projectId: e.projectId,
					projectIndexTypeId: e.projectIndexTypeId,
					slug: e.slug,
					label: e.label,
					status: e.status,
					revision: e.revision,
					parentId: e.parentId,
					createdAt: e.createdAt.toISOString(),
					updatedAt: e.updatedAt?.toISOString() || null,
					deletedAt: e.deletedAt?.toISOString() || null,
					matchers: matchers.map((m) => ({
						id: m.id,
						entryId: m.entryId,
						text: m.text,
						matcherType: m.matcherType,
						revision: m.revision,
						createdAt: m.createdAt.toISOString(),
						updatedAt: m.updatedAt?.toISOString() || null,
					})),
				};
			} catch (error) {
				console.error(
					`[approveIndexEntry] Error approving entry ${id}:`,
					error,
				);
				throw error;
			}
		},
	});
};

export const updateIndexEntryParent = async ({
	input,
	userId,
}: {
	input: UpdateIndexEntryParentInput;
	userId: string;
}): Promise<IndexEntry | null> => {
	return await withUserContext({
		userId,
		fn: async (tx) => {
			// First update the parentId
			const result = await tx
				.update(indexEntries)
				.set({
					parentId: input.parentId || null,
					updatedAt: new Date(),
					revision: sql`${indexEntries.revision} + 1`,
				})
				.where(eq(indexEntries.id, input.id))
				.returning({ id: indexEntries.id });

			if (result.length === 0) {
				return null;
			}

			// Get the updated entry to regenerate its slug
			const entryData = await tx
				.select({
					id: indexEntries.id,
					label: indexEntries.label,
					parentId: indexEntries.parentId,
				})
				.from(indexEntries)
				.where(eq(indexEntries.id, input.id))
				.limit(1);

			if (entryData.length === 0) {
				return null;
			}

			// Regenerate slug for the moved entry
			const newSlug = await generateSlug({
				label: entryData[0].label,
				parentId: entryData[0].parentId,
				getEntryById: async (id: string) => {
					const result = await tx
						.select({
							label: indexEntries.label,
							parentId: indexEntries.parentId,
						})
						.from(indexEntries)
						.where(eq(indexEntries.id, id))
						.limit(1);
					return result[0] || null;
				},
			});

			await tx
				.update(indexEntries)
				.set({ slug: newSlug })
				.where(eq(indexEntries.id, input.id));

			// Get all descendants and regenerate their slugs
			const descendants = await getDescendants({ entryId: input.id, tx });

			for (const descendant of descendants) {
				const descendantData = await tx
					.select({
						label: indexEntries.label,
						parentId: indexEntries.parentId,
					})
					.from(indexEntries)
					.where(eq(indexEntries.id, descendant.id))
					.limit(1);

				if (descendantData.length > 0) {
					const descendantSlug = await generateSlug({
						label: descendantData[0].label,
						parentId: descendantData[0].parentId,
						getEntryById: async (id: string) => {
							const result = await tx
								.select({
									label: indexEntries.label,
									parentId: indexEntries.parentId,
								})
								.from(indexEntries)
								.where(eq(indexEntries.id, id))
								.limit(1);
							return result[0] || null;
						},
					});

					await tx
						.update(indexEntries)
						.set({ slug: descendantSlug })
						.where(eq(indexEntries.id, descendant.id));
				}
			}

			// Now fetch the final entry with all fields
			const entry = await tx
				.select({
					id: indexEntries.id,
					projectId: indexEntries.projectId,
					projectIndexTypeId: indexEntries.projectIndexTypeId,
					slug: indexEntries.slug,
					label: indexEntries.label,
					status: indexEntries.status,
					revision: indexEntries.revision,
					parentId: indexEntries.parentId,
					createdAt: indexEntries.createdAt,
					updatedAt: indexEntries.updatedAt,
					deletedAt: indexEntries.deletedAt,
				})
				.from(indexEntries)
				.where(eq(indexEntries.id, input.id))
				.limit(1);

			if (entry.length === 0) {
				return null;
			}

			const matchers = await tx
				.select({
					id: indexMatchers.id,
					entryId: indexMatchers.entryId,
					text: indexMatchers.text,
					matcherType: indexMatchers.matcherType,
					revision: indexMatchers.revision,
					createdAt: indexMatchers.createdAt,
					updatedAt: indexMatchers.updatedAt,
				})
				.from(indexMatchers)
				.where(eq(indexMatchers.entryId, input.id));

			const e = entry[0];
			return {
				id: e.id,
				projectId: e.projectId,
				projectIndexTypeId: e.projectIndexTypeId,
				slug: e.slug,
				label: e.label,
				status: e.status,
				revision: e.revision,
				parentId: e.parentId,
				createdAt: e.createdAt.toISOString(),
				updatedAt: e.updatedAt?.toISOString() || null,
				deletedAt: e.deletedAt?.toISOString() || null,
				matchers: matchers.map((m) => ({
					id: m.id,
					entryId: m.entryId,
					text: m.text,
					matcherType: m.matcherType,
					revision: m.revision,
					createdAt: m.createdAt.toISOString(),
					updatedAt: m.updatedAt?.toISOString() || null,
				})),
			};
		},
	});
};

export const deleteIndexEntry = async ({
	id,
	userId,
	cascadeToChildren = false,
}: {
	id: string;
	userId: string;
	cascadeToChildren?: boolean;
}): Promise<IndexEntry | null> => {
	return await withUserContext({
		userId,
		fn: async (tx) => {
			if (cascadeToChildren) {
				const descendants = await getDescendants({ entryId: id, tx });
				const allIds = [id, ...descendants.map((d) => d.id)];

				// Soft-delete all associated mentions
				await tx
					.update(indexMentions)
					.set({ deletedAt: new Date() })
					.where(inArray(indexMentions.entryId, allIds));

				await tx
					.update(indexEntries)
					.set({ deletedAt: new Date() })
					.where(inArray(indexEntries.id, allIds));
			} else {
				// Soft-delete all associated mentions
				await tx
					.update(indexMentions)
					.set({ deletedAt: new Date() })
					.where(eq(indexMentions.entryId, id));

				await tx
					.update(indexEntries)
					.set({ deletedAt: new Date() })
					.where(eq(indexEntries.id, id));
			}

			const entry = await tx
				.select({
					id: indexEntries.id,
					projectId: indexEntries.projectId,
					projectIndexTypeId: indexEntries.projectIndexTypeId,
					slug: indexEntries.slug,
					label: indexEntries.label,
					status: indexEntries.status,
					revision: indexEntries.revision,
					parentId: indexEntries.parentId,
					createdAt: indexEntries.createdAt,
					updatedAt: indexEntries.updatedAt,
					deletedAt: indexEntries.deletedAt,
				})
				.from(indexEntries)
				.where(eq(indexEntries.id, id))
				.limit(1);

			if (entry.length === 0) {
				return null;
			}

			const matchers = await tx
				.select({
					id: indexMatchers.id,
					entryId: indexMatchers.entryId,
					text: indexMatchers.text,
					matcherType: indexMatchers.matcherType,
					revision: indexMatchers.revision,
					createdAt: indexMatchers.createdAt,
					updatedAt: indexMatchers.updatedAt,
				})
				.from(indexMatchers)
				.where(eq(indexMatchers.entryId, id));

			const e = entry[0];
			return {
				id: e.id,
				projectId: e.projectId,
				projectIndexTypeId: e.projectIndexTypeId,
				slug: e.slug,
				label: e.label,
				status: e.status,
				revision: e.revision,
				parentId: e.parentId,
				createdAt: e.createdAt.toISOString(),
				updatedAt: e.updatedAt?.toISOString() || null,
				deletedAt: e.deletedAt?.toISOString() || null,
				matchers: matchers.map((m) => ({
					id: m.id,
					entryId: m.entryId,
					text: m.text,
					matcherType: m.matcherType,
					revision: m.revision,
					createdAt: m.createdAt.toISOString(),
					updatedAt: m.updatedAt?.toISOString() || null,
				})),
			};
		},
	});
};

export const searchIndexEntries = async ({
	projectId,
	projectIndexTypeId,
	query,
	limit = 20,
}: {
	projectId: string;
	projectIndexTypeId: string;
	query: string;
	limit?: number;
}): Promise<IndexEntrySearchResult[]> => {
	const searchPattern = `%${query}%`;

	const labelMatches = await db
		.select({
			id: indexEntries.id,
			label: indexEntries.label,
			slug: indexEntries.slug,
			parentId: indexEntries.parentId,
		})
		.from(indexEntries)
		.where(
			and(
				eq(indexEntries.projectId, projectId),
				eq(indexEntries.projectIndexTypeId, projectIndexTypeId),
				isNull(indexEntries.deletedAt),
				ilike(indexEntries.label, searchPattern),
			),
		)
		.limit(limit);

	const matcherMatches = await db
		.select({
			id: indexEntries.id,
			label: indexEntries.label,
			slug: indexEntries.slug,
			parentId: indexEntries.parentId,
			matchedText: indexMatchers.text,
		})
		.from(indexEntries)
		.innerJoin(indexMatchers, eq(indexEntries.id, indexMatchers.entryId))
		.where(
			and(
				eq(indexEntries.projectId, projectId),
				eq(indexEntries.projectIndexTypeId, projectIndexTypeId),
				isNull(indexEntries.deletedAt),
				ilike(indexMatchers.text, searchPattern),
			),
		)
		.limit(limit);

	const allEntryIds = [
		...new Set([
			...labelMatches.map((m) => m.id),
			...matcherMatches.map((m) => m.id),
		]),
	];

	if (allEntryIds.length === 0) {
		return [];
	}

	const parentIds = [...labelMatches, ...matcherMatches]
		.map((e) => e.parentId)
		.filter((id): id is string => id !== null);

	const [parents, matchers] = await Promise.all([
		parentIds.length > 0
			? db
					.select({
						id: indexEntries.id,
						label: indexEntries.label,
					})
					.from(indexEntries)
					.where(inArray(indexEntries.id, parentIds))
			: Promise.resolve([]),
		db
			.select({
				id: indexMatchers.id,
				entryId: indexMatchers.entryId,
				text: indexMatchers.text,
				matcherType: indexMatchers.matcherType,
				revision: indexMatchers.revision,
				createdAt: indexMatchers.createdAt,
				updatedAt: indexMatchers.updatedAt,
			})
			.from(indexMatchers)
			.where(inArray(indexMatchers.entryId, allEntryIds)),
	]);

	const parentMap = new Map(parents.map((p) => [p.id, p]));
	const matchersMap = new Map<string, typeof matchers>();
	for (const matcher of matchers) {
		const existing = matchersMap.get(matcher.entryId) || [];
		existing.push(matcher);
		matchersMap.set(matcher.entryId, existing);
	}

	const labelResults: IndexEntrySearchResult[] = labelMatches.map((match) => ({
		id: match.id,
		label: match.label,
		slug: match.slug,
		parentId: match.parentId,
		parent: match.parentId ? parentMap.get(match.parentId) || null : null,
		matchers: (matchersMap.get(match.id) || []).map((m) => ({
			id: m.id,
			entryId: m.entryId,
			text: m.text,
			matcherType: m.matcherType,
			revision: m.revision,
			createdAt: m.createdAt.toISOString(),
			updatedAt: m.updatedAt?.toISOString() || null,
		})),
		matchType: "label" as const,
	}));

	const matcherResults: IndexEntrySearchResult[] = matcherMatches
		.filter((match) => !labelMatches.some((lm) => lm.id === match.id))
		.map((match) => ({
			id: match.id,
			label: match.label,
			slug: match.slug,
			parentId: match.parentId,
			parent: match.parentId ? parentMap.get(match.parentId) || null : null,
			matchers: (matchersMap.get(match.id) || []).map((m) => ({
				id: m.id,
				entryId: m.entryId,
				text: m.text,
				matcherType: m.matcherType,
				revision: m.revision,
				createdAt: m.createdAt.toISOString(),
				updatedAt: m.updatedAt?.toISOString() || null,
			})),
			matchType: "matcher" as const,
			matchedText: match.matchedText,
		}));

	return [...labelResults, ...matcherResults];
};

export const checkExactMatch = async ({
	projectId,
	projectIndexTypeId,
	text,
}: {
	projectId: string;
	projectIndexTypeId: string;
	text: string;
}): Promise<IndexEntry | null> => {
	const normalized = text.trim().toLowerCase();

	const result = await db
		.select({
			id: indexEntries.id,
			projectId: indexEntries.projectId,
			projectIndexTypeId: indexEntries.projectIndexTypeId,
			slug: indexEntries.slug,
			label: indexEntries.label,
			status: indexEntries.status,
			revision: indexEntries.revision,
			parentId: indexEntries.parentId,
			createdAt: indexEntries.createdAt,
			updatedAt: indexEntries.updatedAt,
			deletedAt: indexEntries.deletedAt,
		})
		.from(indexEntries)
		.leftJoin(indexMatchers, eq(indexEntries.id, indexMatchers.entryId))
		.where(
			and(
				eq(indexEntries.projectId, projectId),
				eq(indexEntries.projectIndexTypeId, projectIndexTypeId),
				isNull(indexEntries.deletedAt),
				or(
					sql`LOWER(${indexEntries.label}) = ${normalized}`,
					sql`LOWER(${indexMatchers.text}) = ${normalized}`,
				),
			),
		)
		.limit(1);

	if (result.length === 0) {
		return null;
	}

	const entry = result[0];
	const matchers = await db
		.select({
			id: indexMatchers.id,
			entryId: indexMatchers.entryId,
			text: indexMatchers.text,
			matcherType: indexMatchers.matcherType,
			revision: indexMatchers.revision,
			createdAt: indexMatchers.createdAt,
			updatedAt: indexMatchers.updatedAt,
		})
		.from(indexMatchers)
		.where(eq(indexMatchers.entryId, entry.id));

	return {
		id: entry.id,
		projectId: entry.projectId,
		projectIndexTypeId: entry.projectIndexTypeId,
		slug: entry.slug,
		label: entry.label,
		status: entry.status,
		revision: entry.revision,
		parentId: entry.parentId,
		createdAt: entry.createdAt.toISOString(),
		updatedAt: entry.updatedAt?.toISOString() || null,
		deletedAt: entry.deletedAt?.toISOString() || null,
		matchers: matchers.map((m) => ({
			id: m.id,
			entryId: m.entryId,
			text: m.text,
			matcherType: m.matcherType,
			revision: m.revision,
			createdAt: m.createdAt.toISOString(),
			updatedAt: m.updatedAt?.toISOString() || null,
		})),
	};
};

const getDescendants = async ({
	entryId,
	tx,
}: {
	entryId: string;
	tx: Parameters<Parameters<typeof withUserContext>[0]["fn"]>[0];
}): Promise<Array<{ id: string }>> => {
	const children = await tx
		.select({ id: indexEntries.id })
		.from(indexEntries)
		.where(
			and(eq(indexEntries.parentId, entryId), isNull(indexEntries.deletedAt)),
		);

	if (children.length === 0) {
		return [];
	}

	const allDescendants = [...children];

	for (const child of children) {
		const grandchildren = await getDescendants({ entryId: child.id, tx });
		allDescendants.push(...grandchildren);
	}

	return allDescendants;
};

// ============================================================================
// Cross-Reference Operations
// ============================================================================

export const getCrossReferences = async ({
	entryId,
}: {
	entryId: string;
}): Promise<
	Array<{
		id: string;
		fromEntryId: string;
		toEntryId: string | null;
		arbitraryValue: string | null;
		relationType: string;
		toEntry: { id: string; label: string } | null;
	}>
> => {
	const relations = await db
		.select({
			id: indexRelations.id,
			fromEntryId: indexRelations.fromEntryId,
			toEntryId: indexRelations.toEntryId,
			arbitraryValue: indexRelations.arbitraryValue,
			relationType: indexRelations.relationType,
		})
		.from(indexRelations)
		.where(eq(indexRelations.fromEntryId, entryId));

	const toEntryIds = relations
		.map((r) => r.toEntryId)
		.filter((id): id is string => id !== null);

	const toEntries =
		toEntryIds.length > 0
			? await db
					.select({
						id: indexEntries.id,
						label: indexEntries.label,
					})
					.from(indexEntries)
					.where(inArray(indexEntries.id, toEntryIds))
			: [];

	const toEntryMap = new Map(toEntries.map((e) => [e.id, e]));

	return relations.map((rel) => ({
		...rel,
		toEntry: rel.toEntryId ? toEntryMap.get(rel.toEntryId) || null : null,
	}));
};

export type CrossReferenceRow = {
	id: string;
	fromEntryId: string;
	toEntryId: string | null;
	arbitraryValue: string | null;
	relationType: string;
	toEntry: { id: string; label: string; parentId: string | null } | null;
};

export const entryHasSeeCrossReference = async ({
	entryId,
}: {
	entryId: string;
}): Promise<boolean> => {
	const [row] = await db
		.select({ id: indexRelations.id })
		.from(indexRelations)
		.where(
			and(
				eq(indexRelations.fromEntryId, entryId),
				eq(indexRelations.relationType, "see"),
			),
		)
		.limit(1);
	return !!row;
};

export const getCrossReferencesForEntries = async ({
	entryIds,
}: {
	entryIds: string[];
}): Promise<Map<string, CrossReferenceRow[]>> => {
	if (entryIds.length === 0) {
		return new Map();
	}

	const relations = await db
		.select({
			id: indexRelations.id,
			fromEntryId: indexRelations.fromEntryId,
			toEntryId: indexRelations.toEntryId,
			arbitraryValue: indexRelations.arbitraryValue,
			relationType: indexRelations.relationType,
		})
		.from(indexRelations)
		.where(inArray(indexRelations.fromEntryId, entryIds));

	const toEntryIds = relations
		.map((r) => r.toEntryId)
		.filter((id): id is string => id !== null);
	const uniqueToIds = [...new Set(toEntryIds)];

	const toEntries =
		uniqueToIds.length > 0
			? await db
					.select({
						id: indexEntries.id,
						label: indexEntries.label,
						parentId: indexEntries.parentId,
					})
					.from(indexEntries)
					.where(inArray(indexEntries.id, uniqueToIds))
			: [];

	const toEntryMap = new Map(
		toEntries.map((e) => [e.id, { ...e, parentId: e.parentId }]),
	);

	const byFrom = new Map<string, CrossReferenceRow[]>();
	for (const rel of relations) {
		const row: CrossReferenceRow = {
			...rel,
			toEntry: rel.toEntryId ? toEntryMap.get(rel.toEntryId) || null : null,
		};
		const list = byFrom.get(rel.fromEntryId) ?? [];
		list.push(row);
		byFrom.set(rel.fromEntryId, list);
	}
	return byFrom;
};

const crossReferenceRowToApi = (row: CrossReferenceRow): CrossReference => ({
	id: row.id,
	fromEntryId: row.fromEntryId,
	toEntryId: row.toEntryId,
	arbitraryValue: row.arbitraryValue,
	relationType: row.relationType as CrossReference["relationType"],
	toEntry: row.toEntry
		? { id: row.toEntry.id, label: row.toEntry.label }
		: null,
});

export const getIndexView = async ({
	projectId,
	projectIndexTypeId,
}: {
	projectId: string;
	projectIndexTypeId: string;
}): Promise<IndexView> => {
	const entries = await listIndexEntries({
		projectId,
		projectIndexTypeId,
	});

	const entryIds = entries.map((e) => e.id);
	if (entryIds.length === 0) {
		return {
			entries: [],
			pageRangesByEntryId: {},
			crossReferencesByEntryId: {},
		};
	}

	const [pageSpans, crossRefsMap] = await Promise.all([
		indexMentionRepo.listMentionPageSpans({
			projectId,
			projectIndexTypeId,
		}),
		getCrossReferencesForEntries({ entryIds }),
	]);

	const byEntryId = new Map<string, typeof pageSpans>();
	for (const span of pageSpans) {
		const list = byEntryId.get(span.entryId) ?? [];
		list.push(span);
		byEntryId.set(span.entryId, list);
	}

	const pageRangesByEntryId: Record<string, string> = {};
	for (const entryId of entryIds) {
		const spans = byEntryId.get(entryId) ?? [];
		pageRangesByEntryId[entryId] = mergeAndFormatPageRanges({
			mentions: spans,
		});
	}

	const crossReferencesByEntryId: Record<string, CrossReference[]> = {};
	for (const entryId of entryIds) {
		const rows = crossRefsMap.get(entryId) ?? [];
		crossReferencesByEntryId[entryId] = rows.map(crossReferenceRowToApi);
	}

	return {
		entries,
		pageRangesByEntryId,
		crossReferencesByEntryId,
	};
};

export const createCrossReference = async ({
	fromEntryId,
	toEntryId,
	arbitraryValue,
	relationType,
	userId,
}: {
	fromEntryId: string;
	toEntryId: string | null;
	arbitraryValue: string | null;
	relationType: "see" | "see_also" | "qv";
	userId: string;
}): Promise<{
	id: string;
	fromEntryId: string;
	toEntryId: string | null;
	arbitraryValue: string | null;
	relationType: string;
}> => {
	return await withUserContext({
		userId,
		fn: async (tx) => {
			const [relation] = await tx
				.insert(indexRelations)
				.values({
					fromEntryId,
					toEntryId: toEntryId ?? null,
					arbitraryValue: arbitraryValue?.trim() ?? null,
					relationType,
					revision: 1,
				})
				.returning();

			return relation;
		},
	});
};

export const deleteCrossReference = async ({
	id,
	userId,
}: {
	id: string;
	userId: string;
}): Promise<boolean> => {
	return await withUserContext({
		userId,
		fn: async (tx) => {
			const result = await tx
				.delete(indexRelations)
				.where(eq(indexRelations.id, id))
				.returning({ id: indexRelations.id });

			return result.length > 0;
		},
	});
};

export const hasSeeCrossReference = async ({
	entryId,
}: {
	entryId: string;
}): Promise<boolean> => {
	const result = await db
		.select({ id: indexRelations.id })
		.from(indexRelations)
		.where(
			and(
				eq(indexRelations.fromEntryId, entryId),
				eq(indexRelations.relationType, "see"),
			),
		)
		.limit(1);

	return result.length > 0;
};

export const transferMentions = async ({
	fromEntryId,
	toEntryId,
	userId,
}: {
	fromEntryId: string;
	toEntryId: string;
	userId: string;
}): Promise<number> => {
	return await withUserContext({
		userId,
		fn: async (tx) => {
			const result = await tx
				.update(indexMentions)
				.set({ entryId: toEntryId })
				.where(
					and(
						eq(indexMentions.entryId, fromEntryId),
						isNull(indexMentions.deletedAt),
					),
				)
				.returning({ id: indexMentions.id });

			return result.length;
		},
	});
};

export const getEntryMatchers = async ({
	entryId,
}: {
	entryId: string;
}): Promise<Array<{ id: string; text: string; matcherType: string }>> => {
	return await db
		.select({
			id: indexMatchers.id,
			text: indexMatchers.text,
			matcherType: indexMatchers.matcherType,
		})
		.from(indexMatchers)
		.where(eq(indexMatchers.entryId, entryId));
};

export const deleteAllMatchers = async ({
	entryId,
	userId,
}: {
	entryId: string;
	userId: string;
}): Promise<void> => {
	await withUserContext({
		userId,
		fn: async (tx) => {
			await tx.delete(indexMatchers).where(eq(indexMatchers.entryId, entryId));
		},
	});
};

export const addMatchersToEntry = async ({
	entryId,
	matchers,
	userId,
}: {
	entryId: string;
	matchers: string[];
	userId: string;
}): Promise<void> => {
	if (matchers.length === 0) return;

	await withUserContext({
		userId,
		fn: async (tx) => {
			await tx.insert(indexMatchers).values(
				matchers.map((text) => ({
					entryId,
					text,
					matcherType: "alias" as const,
					revision: 1,
				})),
			);
		},
	});
};

export const getMentionCount = async ({
	entryId,
}: {
	entryId: string;
}): Promise<number> => {
	const result = await db
		.select({ count: count() })
		.from(indexMentions)
		.where(
			and(eq(indexMentions.entryId, entryId), isNull(indexMentions.deletedAt)),
		);

	return result[0]?.count || 0;
};

export const getDirectChildCount = async ({
	entryId,
}: {
	entryId: string;
}): Promise<number> => {
	const result = await db
		.select({ count: count() })
		.from(indexEntries)
		.where(
			and(eq(indexEntries.parentId, entryId), isNull(indexEntries.deletedAt)),
		);

	return result[0]?.count || 0;
};
