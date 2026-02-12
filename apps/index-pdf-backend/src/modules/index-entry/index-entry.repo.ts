import { and, count, eq, ilike, inArray, isNull, or, sql } from "drizzle-orm";
import { db, withUserContext } from "../../db/client";
import {
	indexEntries,
	indexMentions,
	indexVariants,
	projectIndexTypes,
} from "../../db/schema";
import type {
	CreateIndexEntryInput,
	IndexEntry,
	IndexEntryListItem,
	IndexEntrySearchResult,
	UpdateIndexEntryInput,
	UpdateIndexEntryParentInput,
} from "./index-entry.types";

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
			description: indexEntries.description,
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

	const [mentionCounts, childCounts, variants] = await Promise.all([
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
				id: indexVariants.id,
				entryId: indexVariants.entryId,
				text: indexVariants.text,
				variantType: indexVariants.variantType,
				revision: indexVariants.revision,
				createdAt: indexVariants.createdAt,
				updatedAt: indexVariants.updatedAt,
			})
			.from(indexVariants)
			.where(inArray(indexVariants.entryId, entryIds)),
	]);

	const mentionCountMap = new Map(
		mentionCounts.map((mc) => [mc.entryId, mc.count]),
	);
	const childCountMap = new Map(
		childCounts
			.filter((cc) => cc.parentId !== null)
			.map((cc) => [cc.parentId as string, cc.count]),
	);
	const variantsMap = new Map<string, typeof variants>();
	for (const variant of variants) {
		const existing = variantsMap.get(variant.entryId) || [];
		existing.push(variant);
		variantsMap.set(variant.entryId, existing);
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
		description: entry.description,
		status: entry.status,
		parentId: entry.parentId,
		parent: entry.parentId ? parentMap.get(entry.parentId) || null : null,
		projectIndexType: entry.projectIndexType,
		mentionCount: mentionCountMap.get(entry.id) || 0,
		childCount: childCountMap.get(entry.id) || 0,
		variants: (variantsMap.get(entry.id) || []).map((v) => ({
			id: v.id,
			entryId: v.entryId,
			text: v.text,
			variantType: v.variantType,
			revision: v.revision,
			createdAt: v.createdAt.toISOString(),
			updatedAt: v.updatedAt?.toISOString() || null,
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
			description: indexEntries.description,
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
	const variants = await db
		.select({
			id: indexVariants.id,
			entryId: indexVariants.entryId,
			text: indexVariants.text,
			variantType: indexVariants.variantType,
			revision: indexVariants.revision,
			createdAt: indexVariants.createdAt,
			updatedAt: indexVariants.updatedAt,
		})
		.from(indexVariants)
		.where(eq(indexVariants.entryId, id));

	return {
		id: entry.id,
		projectId: entry.projectId,
		projectIndexTypeId: entry.projectIndexTypeId,
		slug: entry.slug,
		label: entry.label,
		description: entry.description,
		status: entry.status,
		revision: entry.revision,
		parentId: entry.parentId,
		createdAt: entry.createdAt.toISOString(),
		updatedAt: entry.updatedAt?.toISOString() || null,
		deletedAt: entry.deletedAt?.toISOString() || null,
		variants: variants.map((v) => ({
			id: v.id,
			entryId: v.entryId,
			text: v.text,
			variantType: v.variantType,
			revision: v.revision,
			createdAt: v.createdAt.toISOString(),
			updatedAt: v.updatedAt?.toISOString() || null,
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
			const [entry] = await tx
				.insert(indexEntries)
				.values({
					projectId: input.projectId,
					projectIndexTypeId: input.projectIndexTypeId,
					slug: input.slug,
					label: input.label,
					description: input.description || null,
					parentId: input.parentId || null,
					status: "active",
					revision: 1,
				})
				.returning();

			if (!entry) {
				throw new Error("Failed to create index entry");
			}

			if (input.variants && input.variants.length > 0) {
				await tx.insert(indexVariants).values(
					input.variants.map((text) => ({
						entryId: entry.id,
						text,
						variantType: "alias" as const,
						revision: 1,
					})),
				);
			}

			const variants = input.variants
				? await tx
						.select({
							id: indexVariants.id,
							entryId: indexVariants.entryId,
							text: indexVariants.text,
							variantType: indexVariants.variantType,
							revision: indexVariants.revision,
							createdAt: indexVariants.createdAt,
							updatedAt: indexVariants.updatedAt,
						})
						.from(indexVariants)
						.where(eq(indexVariants.entryId, entry.id))
				: [];

			return {
				id: entry.id,
				projectId: entry.projectId,
				projectIndexTypeId: entry.projectIndexTypeId,
				slug: entry.slug,
				label: entry.label,
				description: entry.description,
				status: entry.status,
				revision: entry.revision,
				parentId: entry.parentId,
				createdAt: entry.createdAt.toISOString(),
				updatedAt: entry.updatedAt?.toISOString() || null,
				deletedAt: entry.deletedAt?.toISOString() || null,
				variants: variants.map((v) => ({
					id: v.id,
					entryId: v.entryId,
					text: v.text,
					variantType: v.variantType,
					revision: v.revision,
					createdAt: v.createdAt.toISOString(),
					updatedAt: v.updatedAt?.toISOString() || null,
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

			if (input.description !== undefined) {
				updateValues.description = input.description;
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

			if (input.variants !== undefined) {
				await tx
					.delete(indexVariants)
					.where(eq(indexVariants.entryId, input.id));

				if (input.variants.length > 0) {
					await tx.insert(indexVariants).values(
						input.variants.map((text) => ({
							entryId: input.id,
							text,
							variantType: "alias" as const,
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
					description: indexEntries.description,
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

			const variants = await tx
				.select({
					id: indexVariants.id,
					entryId: indexVariants.entryId,
					text: indexVariants.text,
					variantType: indexVariants.variantType,
					revision: indexVariants.revision,
					createdAt: indexVariants.createdAt,
					updatedAt: indexVariants.updatedAt,
				})
				.from(indexVariants)
				.where(eq(indexVariants.entryId, input.id));

			const e = entry[0];
			return {
				id: e.id,
				projectId: e.projectId,
				projectIndexTypeId: e.projectIndexTypeId,
				slug: e.slug,
				label: e.label,
				description: e.description,
				status: e.status,
				revision: e.revision,
				parentId: e.parentId,
				createdAt: e.createdAt.toISOString(),
				updatedAt: e.updatedAt?.toISOString() || null,
				deletedAt: e.deletedAt?.toISOString() || null,
				variants: variants.map((v) => ({
					id: v.id,
					entryId: v.entryId,
					text: v.text,
					variantType: v.variantType,
					revision: v.revision,
					createdAt: v.createdAt.toISOString(),
					updatedAt: v.updatedAt?.toISOString() || null,
				})),
			};
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

			const entry = await tx
				.select({
					id: indexEntries.id,
					projectId: indexEntries.projectId,
					projectIndexTypeId: indexEntries.projectIndexTypeId,
					slug: indexEntries.slug,
					label: indexEntries.label,
					description: indexEntries.description,
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

			const variants = await tx
				.select({
					id: indexVariants.id,
					entryId: indexVariants.entryId,
					text: indexVariants.text,
					variantType: indexVariants.variantType,
					revision: indexVariants.revision,
					createdAt: indexVariants.createdAt,
					updatedAt: indexVariants.updatedAt,
				})
				.from(indexVariants)
				.where(eq(indexVariants.entryId, input.id));

			const e = entry[0];
			return {
				id: e.id,
				projectId: e.projectId,
				projectIndexTypeId: e.projectIndexTypeId,
				slug: e.slug,
				label: e.label,
				description: e.description,
				status: e.status,
				revision: e.revision,
				parentId: e.parentId,
				createdAt: e.createdAt.toISOString(),
				updatedAt: e.updatedAt?.toISOString() || null,
				deletedAt: e.deletedAt?.toISOString() || null,
				variants: variants.map((v) => ({
					id: v.id,
					entryId: v.entryId,
					text: v.text,
					variantType: v.variantType,
					revision: v.revision,
					createdAt: v.createdAt.toISOString(),
					updatedAt: v.updatedAt?.toISOString() || null,
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

				await tx
					.update(indexEntries)
					.set({ deletedAt: new Date() })
					.where(inArray(indexEntries.id, allIds));
			} else {
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
					description: indexEntries.description,
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

			const variants = await tx
				.select({
					id: indexVariants.id,
					entryId: indexVariants.entryId,
					text: indexVariants.text,
					variantType: indexVariants.variantType,
					revision: indexVariants.revision,
					createdAt: indexVariants.createdAt,
					updatedAt: indexVariants.updatedAt,
				})
				.from(indexVariants)
				.where(eq(indexVariants.entryId, id));

			const e = entry[0];
			return {
				id: e.id,
				projectId: e.projectId,
				projectIndexTypeId: e.projectIndexTypeId,
				slug: e.slug,
				label: e.label,
				description: e.description,
				status: e.status,
				revision: e.revision,
				parentId: e.parentId,
				createdAt: e.createdAt.toISOString(),
				updatedAt: e.updatedAt?.toISOString() || null,
				deletedAt: e.deletedAt?.toISOString() || null,
				variants: variants.map((v) => ({
					id: v.id,
					entryId: v.entryId,
					text: v.text,
					variantType: v.variantType,
					revision: v.revision,
					createdAt: v.createdAt.toISOString(),
					updatedAt: v.updatedAt?.toISOString() || null,
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
			description: indexEntries.description,
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

	const variantMatches = await db
		.select({
			id: indexEntries.id,
			label: indexEntries.label,
			slug: indexEntries.slug,
			description: indexEntries.description,
			parentId: indexEntries.parentId,
			matchedText: indexVariants.text,
		})
		.from(indexEntries)
		.innerJoin(indexVariants, eq(indexEntries.id, indexVariants.entryId))
		.where(
			and(
				eq(indexEntries.projectId, projectId),
				eq(indexEntries.projectIndexTypeId, projectIndexTypeId),
				isNull(indexEntries.deletedAt),
				ilike(indexVariants.text, searchPattern),
			),
		)
		.limit(limit);

	const allEntryIds = [
		...new Set([
			...labelMatches.map((m) => m.id),
			...variantMatches.map((m) => m.id),
		]),
	];

	if (allEntryIds.length === 0) {
		return [];
	}

	const parentIds = [...labelMatches, ...variantMatches]
		.map((e) => e.parentId)
		.filter((id): id is string => id !== null);

	const [parents, variants] = await Promise.all([
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
				id: indexVariants.id,
				entryId: indexVariants.entryId,
				text: indexVariants.text,
				variantType: indexVariants.variantType,
				revision: indexVariants.revision,
				createdAt: indexVariants.createdAt,
				updatedAt: indexVariants.updatedAt,
			})
			.from(indexVariants)
			.where(inArray(indexVariants.entryId, allEntryIds)),
	]);

	const parentMap = new Map(parents.map((p) => [p.id, p]));
	const variantsMap = new Map<string, typeof variants>();
	for (const variant of variants) {
		const existing = variantsMap.get(variant.entryId) || [];
		existing.push(variant);
		variantsMap.set(variant.entryId, existing);
	}

	const labelResults: IndexEntrySearchResult[] = labelMatches.map((match) => ({
		id: match.id,
		label: match.label,
		slug: match.slug,
		description: match.description,
		parentId: match.parentId,
		parent: match.parentId ? parentMap.get(match.parentId) || null : null,
		variants: (variantsMap.get(match.id) || []).map((v) => ({
			id: v.id,
			entryId: v.entryId,
			text: v.text,
			variantType: v.variantType,
			revision: v.revision,
			createdAt: v.createdAt.toISOString(),
			updatedAt: v.updatedAt?.toISOString() || null,
		})),
		matchType: "label" as const,
	}));

	const variantResults: IndexEntrySearchResult[] = variantMatches
		.filter((match) => !labelMatches.some((lm) => lm.id === match.id))
		.map((match) => ({
			id: match.id,
			label: match.label,
			slug: match.slug,
			description: match.description,
			parentId: match.parentId,
			parent: match.parentId ? parentMap.get(match.parentId) || null : null,
			variants: (variantsMap.get(match.id) || []).map((v) => ({
				id: v.id,
				entryId: v.entryId,
				text: v.text,
				variantType: v.variantType,
				revision: v.revision,
				createdAt: v.createdAt.toISOString(),
				updatedAt: v.updatedAt?.toISOString() || null,
			})),
			matchType: "variant" as const,
			matchedText: match.matchedText,
		}));

	return [...labelResults, ...variantResults];
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
			description: indexEntries.description,
			status: indexEntries.status,
			revision: indexEntries.revision,
			parentId: indexEntries.parentId,
			createdAt: indexEntries.createdAt,
			updatedAt: indexEntries.updatedAt,
			deletedAt: indexEntries.deletedAt,
		})
		.from(indexEntries)
		.leftJoin(indexVariants, eq(indexEntries.id, indexVariants.entryId))
		.where(
			and(
				eq(indexEntries.projectId, projectId),
				eq(indexEntries.projectIndexTypeId, projectIndexTypeId),
				isNull(indexEntries.deletedAt),
				or(
					sql`LOWER(${indexEntries.label}) = ${normalized}`,
					sql`LOWER(${indexVariants.text}) = ${normalized}`,
				),
			),
		)
		.limit(1);

	if (result.length === 0) {
		return null;
	}

	const entry = result[0];
	const variants = await db
		.select({
			id: indexVariants.id,
			entryId: indexVariants.entryId,
			text: indexVariants.text,
			variantType: indexVariants.variantType,
			revision: indexVariants.revision,
			createdAt: indexVariants.createdAt,
			updatedAt: indexVariants.updatedAt,
		})
		.from(indexVariants)
		.where(eq(indexVariants.entryId, entry.id));

	return {
		id: entry.id,
		projectId: entry.projectId,
		projectIndexTypeId: entry.projectIndexTypeId,
		slug: entry.slug,
		label: entry.label,
		description: entry.description,
		status: entry.status,
		revision: entry.revision,
		parentId: entry.parentId,
		createdAt: entry.createdAt.toISOString(),
		updatedAt: entry.updatedAt?.toISOString() || null,
		deletedAt: entry.deletedAt?.toISOString() || null,
		variants: variants.map((v) => ({
			id: v.id,
			entryId: v.entryId,
			text: v.text,
			variantType: v.variantType,
			revision: v.revision,
			createdAt: v.createdAt.toISOString(),
			updatedAt: v.updatedAt?.toISOString() || null,
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
