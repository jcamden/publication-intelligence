import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { db, withUserContext } from "../../db/client";
import {
	indexEntries,
	indexMentions,
	indexMentionTypes,
	projectIndexTypes,
	sourceDocuments,
} from "../../db/schema";
import type {
	BoundingBox,
	CreateIndexMentionInput,
	IndexMention,
	IndexMentionListItem,
	UpdateIndexMentionInput,
	UpdateIndexMentionTypesInput,
} from "./index-mention.types";

// ============================================================================
// Repository Layer - Database queries for IndexMention
// ============================================================================

export const listIndexMentions = async ({
	projectId,
	documentId,
	pageNumber,
	projectIndexTypeIds,
	includeDeleted = false,
}: {
	projectId: string;
	documentId?: string;
	pageNumber?: number;
	projectIndexTypeIds?: string[];
	includeDeleted?: boolean;
}): Promise<IndexMentionListItem[]> => {
	const baseQuery = db
		.select({
			id: indexMentions.id,
			entryId: indexMentions.entryId,
			pageNumber: indexMentions.pageNumber,
			textSpan: indexMentions.textSpan,
			bboxes: indexMentions.bboxes,
			mentionType: indexMentions.mentionType,
			detectionRunId: indexMentions.detectionRunId,
			createdAt: indexMentions.createdAt,
			entry: {
				id: indexEntries.id,
				label: indexEntries.label,
			},
		})
		.from(indexMentions)
		.innerJoin(indexEntries, eq(indexMentions.entryId, indexEntries.id))
		.innerJoin(
			sourceDocuments,
			eq(indexMentions.documentId, sourceDocuments.id),
		)
		.where(
			and(
				eq(sourceDocuments.projectId, projectId),
				documentId ? eq(indexMentions.documentId, documentId) : undefined,
				pageNumber ? eq(indexMentions.pageNumber, pageNumber) : undefined,
				includeDeleted ? undefined : isNull(indexMentions.deletedAt),
			),
		)
		.orderBy(indexMentions.pageNumber, indexMentions.createdAt);

	const mentions = await baseQuery;

	if (mentions.length === 0) {
		return [];
	}

	const mentionIds = mentions.map((m) => m.id);

	const mentionTypesData = await db
		.select({
			mentionId: indexMentionTypes.indexMentionId,
			projectIndexTypeId: indexMentionTypes.projectIndexTypeId,
			indexType: projectIndexTypes.highlightType,
			colorHue: projectIndexTypes.colorHue,
		})
		.from(indexMentionTypes)
		.innerJoin(
			projectIndexTypes,
			eq(indexMentionTypes.projectIndexTypeId, projectIndexTypes.id),
		)
		.where(inArray(indexMentionTypes.indexMentionId, mentionIds));

	const mentionTypesMap = new Map<
		string,
		Array<{
			projectIndexTypeId: string;
			indexType: string;
			colorHue: number;
		}>
	>();

	for (const mt of mentionTypesData) {
		const existing = mentionTypesMap.get(mt.mentionId) || [];
		existing.push({
			projectIndexTypeId: mt.projectIndexTypeId,
			indexType: mt.indexType,
			colorHue: mt.colorHue,
		});
		mentionTypesMap.set(mt.mentionId, existing);
	}

	let filteredMentions = mentions;

	if (projectIndexTypeIds && projectIndexTypeIds.length > 0) {
		filteredMentions = mentions.filter((mention) => {
			const types = mentionTypesMap.get(mention.id) || [];
			return types.some((t) =>
				projectIndexTypeIds.includes(t.projectIndexTypeId),
			);
		});
	}

	return filteredMentions.map((mention) => ({
		id: mention.id,
		entryId: mention.entryId,
		entry: mention.entry,
		pageNumber: mention.pageNumber,
		textSpan: mention.textSpan,
		bboxes: mention.bboxes as unknown as BoundingBox[] | null,
		mentionType: mention.mentionType,
		detectionRunId: mention.detectionRunId,
		indexTypes: mentionTypesMap.get(mention.id) || [],
		createdAt: mention.createdAt.toISOString(),
	}));
};

export const getIndexMentionById = async ({
	id,
}: {
	id: string;
}): Promise<IndexMention | null> => {
	const result = await db
		.select({
			id: indexMentions.id,
			entryId: indexMentions.entryId,
			documentId: indexMentions.documentId,
			pageNumber: indexMentions.pageNumber,
			pageNumberEnd: indexMentions.pageNumberEnd,
			textSpan: indexMentions.textSpan,
			startOffset: indexMentions.startOffset,
			endOffset: indexMentions.endOffset,
			bboxes: indexMentions.bboxes,
			rangeType: indexMentions.rangeType,
			mentionType: indexMentions.mentionType,
			suggestedByLlmId: indexMentions.suggestedByLlmId,
			detectionRunId: indexMentions.detectionRunId,
			note: indexMentions.note,
			revision: indexMentions.revision,
			createdAt: indexMentions.createdAt,
			updatedAt: indexMentions.updatedAt,
			deletedAt: indexMentions.deletedAt,
			entry: {
				id: indexEntries.id,
				label: indexEntries.label,
				projectIndexTypeId: indexEntries.projectIndexTypeId,
			},
		})
		.from(indexMentions)
		.innerJoin(indexEntries, eq(indexMentions.entryId, indexEntries.id))
		.where(eq(indexMentions.id, id))
		.limit(1);

	if (result.length === 0) {
		return null;
	}

	const mention = result[0];

	const types = await db
		.select({
			id: indexMentionTypes.id,
			projectIndexTypeId: indexMentionTypes.projectIndexTypeId,
			projectIndexType: {
				id: projectIndexTypes.id,
				indexType: projectIndexTypes.highlightType,
				colorHue: projectIndexTypes.colorHue,
			},
		})
		.from(indexMentionTypes)
		.innerJoin(
			projectIndexTypes,
			eq(indexMentionTypes.projectIndexTypeId, projectIndexTypes.id),
		)
		.where(eq(indexMentionTypes.indexMentionId, id));

	return {
		id: mention.id,
		entryId: mention.entryId,
		documentId: mention.documentId,
		pageNumber: mention.pageNumber,
		pageNumberEnd: mention.pageNumberEnd,
		textSpan: mention.textSpan,
		startOffset: mention.startOffset,
		endOffset: mention.endOffset,
		bboxes: mention.bboxes as unknown as BoundingBox[] | null,
		rangeType: mention.rangeType,
		mentionType: mention.mentionType,
		suggestedByLlmId: mention.suggestedByLlmId,
		detectionRunId: mention.detectionRunId,
		note: mention.note,
		revision: mention.revision,
		createdAt: mention.createdAt.toISOString(),
		updatedAt: mention.updatedAt?.toISOString() || null,
		deletedAt: mention.deletedAt?.toISOString() || null,
		entry: mention.entry,
		indexTypes: types,
	};
};

export const createIndexMention = async ({
	input,
	userId,
}: {
	input: CreateIndexMentionInput;
	userId: string;
}): Promise<IndexMention> => {
	return await withUserContext({
		userId,
		fn: async (tx) => {
			const [mention] = await tx
				.insert(indexMentions)
				.values({
					entryId: input.entryId,
					documentId: input.documentId,
					pageNumber: input.pageNumber,
					textSpan: input.textSpan,
					bboxes:
						input.bboxesPdf as unknown as typeof indexMentions.$inferInsert.bboxes,
					rangeType: "single_page",
					mentionType: input.mentionType,
					revision: 1,
				})
				.returning();

			if (!mention) {
				throw new Error("Failed to create index mention");
			}

			await tx.insert(indexMentionTypes).values(
				input.projectIndexTypeIds.map((projectIndexTypeId) => ({
					indexMentionId: mention.id,
					projectIndexTypeId,
				})),
			);

			const entry = await tx
				.select({
					id: indexEntries.id,
					label: indexEntries.label,
					projectIndexTypeId: indexEntries.projectIndexTypeId,
				})
				.from(indexEntries)
				.where(eq(indexEntries.id, input.entryId))
				.limit(1);

			const types = await tx
				.select({
					id: indexMentionTypes.id,
					projectIndexTypeId: indexMentionTypes.projectIndexTypeId,
					projectIndexType: {
						id: projectIndexTypes.id,
						indexType: projectIndexTypes.highlightType,
						colorHue: projectIndexTypes.colorHue,
					},
				})
				.from(indexMentionTypes)
				.innerJoin(
					projectIndexTypes,
					eq(indexMentionTypes.projectIndexTypeId, projectIndexTypes.id),
				)
				.where(eq(indexMentionTypes.indexMentionId, mention.id));

			return {
				id: mention.id,
				entryId: mention.entryId,
				documentId: mention.documentId,
				pageNumber: mention.pageNumber,
				pageNumberEnd: mention.pageNumberEnd,
				textSpan: mention.textSpan,
				startOffset: mention.startOffset,
				endOffset: mention.endOffset,
				bboxes: mention.bboxes as unknown as BoundingBox[] | null,
				rangeType: mention.rangeType,
				mentionType: mention.mentionType,
				suggestedByLlmId: mention.suggestedByLlmId,
				detectionRunId: mention.detectionRunId,
				note: mention.note,
				revision: mention.revision,
				createdAt: mention.createdAt.toISOString(),
				updatedAt: mention.updatedAt?.toISOString() || null,
				deletedAt: mention.deletedAt?.toISOString() || null,
				entry: entry[0] || undefined,
				indexTypes: types,
			};
		},
	});
};

export const updateIndexMention = async ({
	input,
	userId,
}: {
	input: UpdateIndexMentionInput;
	userId: string;
}): Promise<IndexMention | null> => {
	return await withUserContext({
		userId,
		fn: async (tx) => {
			const updateValues: Partial<typeof indexMentions.$inferInsert> = {
				updatedAt: new Date(),
			};

			if (input.entryId !== undefined) {
				updateValues.entryId = input.entryId;
			}

			if (input.textSpan !== undefined) {
				updateValues.textSpan = input.textSpan;
			}

			const result = await tx
				.update(indexMentions)
				.set({
					...updateValues,
					revision: sql`${indexMentions.revision} + 1`,
				})
				.where(eq(indexMentions.id, input.id))
				.returning({ id: indexMentions.id });

			if (result.length === 0) {
				return null;
			}

			if (input.projectIndexTypeIds !== undefined) {
				await tx
					.delete(indexMentionTypes)
					.where(eq(indexMentionTypes.indexMentionId, input.id));

				if (input.projectIndexTypeIds.length > 0) {
					await tx.insert(indexMentionTypes).values(
						input.projectIndexTypeIds.map((projectIndexTypeId) => ({
							indexMentionId: input.id,
							projectIndexTypeId,
						})),
					);
				}
			}

			const mention = await tx
				.select({
					id: indexMentions.id,
					entryId: indexMentions.entryId,
					documentId: indexMentions.documentId,
					pageNumber: indexMentions.pageNumber,
					pageNumberEnd: indexMentions.pageNumberEnd,
					textSpan: indexMentions.textSpan,
					startOffset: indexMentions.startOffset,
					endOffset: indexMentions.endOffset,
					bboxes: indexMentions.bboxes,
					rangeType: indexMentions.rangeType,
					mentionType: indexMentions.mentionType,
					suggestedByLlmId: indexMentions.suggestedByLlmId,
					detectionRunId: indexMentions.detectionRunId,
					note: indexMentions.note,
					revision: indexMentions.revision,
					createdAt: indexMentions.createdAt,
					updatedAt: indexMentions.updatedAt,
					deletedAt: indexMentions.deletedAt,
				})
				.from(indexMentions)
				.where(eq(indexMentions.id, input.id))
				.limit(1);

			if (mention.length === 0) {
				return null;
			}

			const entry = await tx
				.select({
					id: indexEntries.id,
					label: indexEntries.label,
					projectIndexTypeId: indexEntries.projectIndexTypeId,
				})
				.from(indexEntries)
				.where(eq(indexEntries.id, mention[0].entryId))
				.limit(1);

			const types = await tx
				.select({
					id: indexMentionTypes.id,
					projectIndexTypeId: indexMentionTypes.projectIndexTypeId,
					projectIndexType: {
						id: projectIndexTypes.id,
						indexType: projectIndexTypes.highlightType,
						colorHue: projectIndexTypes.colorHue,
					},
				})
				.from(indexMentionTypes)
				.innerJoin(
					projectIndexTypes,
					eq(indexMentionTypes.projectIndexTypeId, projectIndexTypes.id),
				)
				.where(eq(indexMentionTypes.indexMentionId, input.id));

			const m = mention[0];
			return {
				id: m.id,
				entryId: m.entryId,
				documentId: m.documentId,
				pageNumber: m.pageNumber,
				pageNumberEnd: m.pageNumberEnd,
				textSpan: m.textSpan,
				startOffset: m.startOffset,
				endOffset: m.endOffset,
				bboxes: m.bboxes as unknown as BoundingBox[] | null,
				rangeType: m.rangeType,
				mentionType: m.mentionType,
				suggestedByLlmId: m.suggestedByLlmId,
				detectionRunId: m.detectionRunId,
				note: m.note,
				revision: m.revision,
				createdAt: m.createdAt.toISOString(),
				updatedAt: m.updatedAt?.toISOString() || null,
				deletedAt: m.deletedAt?.toISOString() || null,
				entry: entry[0] || undefined,
				indexTypes: types,
			};
		},
	});
};

export const updateIndexMentionTypes = async ({
	input,
	userId,
}: {
	input: UpdateIndexMentionTypesInput;
	userId: string;
}): Promise<IndexMention[]> => {
	return await withUserContext({
		userId,
		fn: async (tx) => {
			for (const mentionId of input.mentionIds) {
				if (input.operation === "replace") {
					await tx
						.delete(indexMentionTypes)
						.where(eq(indexMentionTypes.indexMentionId, mentionId));

					await tx.insert(indexMentionTypes).values(
						input.projectIndexTypeIds.map((projectIndexTypeId) => ({
							indexMentionId: mentionId,
							projectIndexTypeId,
						})),
					);
				} else if (input.operation === "add") {
					const existing = await tx
						.select({
							projectIndexTypeId: indexMentionTypes.projectIndexTypeId,
						})
						.from(indexMentionTypes)
						.where(eq(indexMentionTypes.indexMentionId, mentionId));

					const existingIds = new Set(
						existing.map((e) => e.projectIndexTypeId),
					);
					const newIds = input.projectIndexTypeIds.filter(
						(id) => !existingIds.has(id),
					);

					if (newIds.length > 0) {
						await tx.insert(indexMentionTypes).values(
							newIds.map((projectIndexTypeId) => ({
								indexMentionId: mentionId,
								projectIndexTypeId,
							})),
						);
					}
				} else if (input.operation === "remove") {
					await tx
						.delete(indexMentionTypes)
						.where(
							and(
								eq(indexMentionTypes.indexMentionId, mentionId),
								inArray(
									indexMentionTypes.projectIndexTypeId,
									input.projectIndexTypeIds,
								),
							),
						);
				}

				await tx
					.update(indexMentions)
					.set({
						updatedAt: new Date(),
						revision: sql`${indexMentions.revision} + 1`,
					})
					.where(eq(indexMentions.id, mentionId));
			}

			const mentions = await tx
				.select({
					id: indexMentions.id,
					entryId: indexMentions.entryId,
					documentId: indexMentions.documentId,
					pageNumber: indexMentions.pageNumber,
					pageNumberEnd: indexMentions.pageNumberEnd,
					textSpan: indexMentions.textSpan,
					startOffset: indexMentions.startOffset,
					endOffset: indexMentions.endOffset,
					bboxes: indexMentions.bboxes,
					rangeType: indexMentions.rangeType,
					mentionType: indexMentions.mentionType,
					suggestedByLlmId: indexMentions.suggestedByLlmId,
					detectionRunId: indexMentions.detectionRunId,
					note: indexMentions.note,
					revision: indexMentions.revision,
					createdAt: indexMentions.createdAt,
					updatedAt: indexMentions.updatedAt,
					deletedAt: indexMentions.deletedAt,
				})
				.from(indexMentions)
				.where(inArray(indexMentions.id, input.mentionIds));

			const entryIds = [...new Set(mentions.map((m) => m.entryId))];
			const entries = await tx
				.select({
					id: indexEntries.id,
					label: indexEntries.label,
					projectIndexTypeId: indexEntries.projectIndexTypeId,
				})
				.from(indexEntries)
				.where(inArray(indexEntries.id, entryIds));

			const entryMap = new Map(entries.map((e) => [e.id, e]));

			const allTypes = await tx
				.select({
					mentionId: indexMentionTypes.indexMentionId,
					id: indexMentionTypes.id,
					projectIndexTypeId: indexMentionTypes.projectIndexTypeId,
					projectIndexType: {
						id: projectIndexTypes.id,
						indexType: projectIndexTypes.highlightType,
						colorHue: projectIndexTypes.colorHue,
					},
				})
				.from(indexMentionTypes)
				.innerJoin(
					projectIndexTypes,
					eq(indexMentionTypes.projectIndexTypeId, projectIndexTypes.id),
				)
				.where(inArray(indexMentionTypes.indexMentionId, input.mentionIds));

			const typesMap = new Map<string, typeof allTypes>();
			for (const type of allTypes) {
				const existing = typesMap.get(type.mentionId) || [];
				existing.push(type);
				typesMap.set(type.mentionId, existing);
			}

			return mentions.map((m) => ({
				id: m.id,
				entryId: m.entryId,
				documentId: m.documentId,
				pageNumber: m.pageNumber,
				pageNumberEnd: m.pageNumberEnd,
				textSpan: m.textSpan,
				startOffset: m.startOffset,
				endOffset: m.endOffset,
				bboxes: m.bboxes as unknown as BoundingBox[] | null,
				rangeType: m.rangeType,
				mentionType: m.mentionType,
				suggestedByLlmId: m.suggestedByLlmId,
				detectionRunId: m.detectionRunId,
				note: m.note,
				revision: m.revision,
				createdAt: m.createdAt.toISOString(),
				updatedAt: m.updatedAt?.toISOString() || null,
				deletedAt: m.deletedAt?.toISOString() || null,
				entry: entryMap.get(m.entryId),
				indexTypes: (typesMap.get(m.id) || []).map((t) => ({
					id: t.id,
					projectIndexTypeId: t.projectIndexTypeId,
					projectIndexType: t.projectIndexType,
				})),
			}));
		},
	});
};

export const bulkCreateIndexMentions = async ({
	mentions,
	userId,
}: {
	mentions: CreateIndexMentionInput[];
	userId: string;
}): Promise<IndexMention[]> => {
	return await withUserContext({
		userId,
		fn: async (tx) => {
			const createdMentions = await tx
				.insert(indexMentions)
				.values(
					mentions.map((m) => ({
						entryId: m.entryId,
						documentId: m.documentId,
						pageNumber: m.pageNumber,
						textSpan: m.textSpan,
						bboxes:
							m.bboxesPdf as unknown as typeof indexMentions.$inferInsert.bboxes,
						rangeType: "single_page" as const,
						mentionType: m.mentionType,
						revision: 1,
					})),
				)
				.returning();

			const mentionTypeValues = createdMentions.flatMap((mention, index) =>
				mentions[index].projectIndexTypeIds.map((projectIndexTypeId) => ({
					indexMentionId: mention.id,
					projectIndexTypeId,
				})),
			);

			await tx.insert(indexMentionTypes).values(mentionTypeValues);

			const entryIds = [...new Set(mentions.map((m) => m.entryId))];
			const entries = await tx
				.select({
					id: indexEntries.id,
					label: indexEntries.label,
					projectIndexTypeId: indexEntries.projectIndexTypeId,
				})
				.from(indexEntries)
				.where(inArray(indexEntries.id, entryIds));

			const entryMap = new Map(entries.map((e) => [e.id, e]));

			const mentionIds = createdMentions.map((m) => m.id);
			const allTypes = await tx
				.select({
					mentionId: indexMentionTypes.indexMentionId,
					id: indexMentionTypes.id,
					projectIndexTypeId: indexMentionTypes.projectIndexTypeId,
					projectIndexType: {
						id: projectIndexTypes.id,
						indexType: projectIndexTypes.highlightType,
						colorHue: projectIndexTypes.colorHue,
					},
				})
				.from(indexMentionTypes)
				.innerJoin(
					projectIndexTypes,
					eq(indexMentionTypes.projectIndexTypeId, projectIndexTypes.id),
				)
				.where(inArray(indexMentionTypes.indexMentionId, mentionIds));

			const typesMap = new Map<string, typeof allTypes>();
			for (const type of allTypes) {
				const existing = typesMap.get(type.mentionId) || [];
				existing.push(type);
				typesMap.set(type.mentionId, existing);
			}

			return createdMentions.map((m) => ({
				id: m.id,
				entryId: m.entryId,
				documentId: m.documentId,
				pageNumber: m.pageNumber,
				pageNumberEnd: m.pageNumberEnd,
				textSpan: m.textSpan,
				startOffset: m.startOffset,
				endOffset: m.endOffset,
				bboxes: m.bboxes as unknown as BoundingBox[] | null,
				rangeType: m.rangeType,
				mentionType: m.mentionType,
				suggestedByLlmId: m.suggestedByLlmId,
				detectionRunId: m.detectionRunId,
				note: m.note,
				revision: m.revision,
				createdAt: m.createdAt.toISOString(),
				updatedAt: m.updatedAt?.toISOString() || null,
				deletedAt: m.deletedAt?.toISOString() || null,
				entry: entryMap.get(m.entryId),
				indexTypes: (typesMap.get(m.id) || []).map((t) => ({
					id: t.id,
					projectIndexTypeId: t.projectIndexTypeId,
					projectIndexType: t.projectIndexType,
				})),
			}));
		},
	});
};

export const approveIndexMention = async ({
	id,
	userId,
}: {
	id: string;
	userId: string;
}): Promise<IndexMention | null> => {
	return await withUserContext({
		userId,
		fn: async (tx) => {
			const result = await tx
				.update(indexMentions)
				.set({
					detectionRunId: null,
					suggestedByLlmId: null,
					updatedAt: new Date(),
					revision: sql`${indexMentions.revision} + 1`,
				})
				.where(eq(indexMentions.id, id))
				.returning({ id: indexMentions.id });

			if (result.length === 0) {
				return null;
			}

			return await getIndexMentionById({ id });
		},
	});
};

export const deleteIndexMention = async ({
	id,
	userId,
}: {
	id: string;
	userId: string;
}): Promise<IndexMention | null> => {
	return await withUserContext({
		userId,
		fn: async (tx) => {
			await tx
				.update(indexMentions)
				.set({ deletedAt: new Date() })
				.where(eq(indexMentions.id, id));

			const mention = await tx
				.select({
					id: indexMentions.id,
					entryId: indexMentions.entryId,
					documentId: indexMentions.documentId,
					pageNumber: indexMentions.pageNumber,
					pageNumberEnd: indexMentions.pageNumberEnd,
					textSpan: indexMentions.textSpan,
					startOffset: indexMentions.startOffset,
					endOffset: indexMentions.endOffset,
					bboxes: indexMentions.bboxes,
					rangeType: indexMentions.rangeType,
					mentionType: indexMentions.mentionType,
					suggestedByLlmId: indexMentions.suggestedByLlmId,
					detectionRunId: indexMentions.detectionRunId,
					note: indexMentions.note,
					revision: indexMentions.revision,
					createdAt: indexMentions.createdAt,
					updatedAt: indexMentions.updatedAt,
					deletedAt: indexMentions.deletedAt,
				})
				.from(indexMentions)
				.where(eq(indexMentions.id, id))
				.limit(1);

			if (mention.length === 0) {
				return null;
			}

			const entry = await tx
				.select({
					id: indexEntries.id,
					label: indexEntries.label,
					projectIndexTypeId: indexEntries.projectIndexTypeId,
				})
				.from(indexEntries)
				.where(eq(indexEntries.id, mention[0].entryId))
				.limit(1);

			const types = await tx
				.select({
					id: indexMentionTypes.id,
					projectIndexTypeId: indexMentionTypes.projectIndexTypeId,
					projectIndexType: {
						id: projectIndexTypes.id,
						indexType: projectIndexTypes.highlightType,
						colorHue: projectIndexTypes.colorHue,
					},
				})
				.from(indexMentionTypes)
				.innerJoin(
					projectIndexTypes,
					eq(indexMentionTypes.projectIndexTypeId, projectIndexTypes.id),
				)
				.where(eq(indexMentionTypes.indexMentionId, id));

			const m = mention[0];
			return {
				id: m.id,
				entryId: m.entryId,
				documentId: m.documentId,
				pageNumber: m.pageNumber,
				pageNumberEnd: m.pageNumberEnd,
				textSpan: m.textSpan,
				startOffset: m.startOffset,
				endOffset: m.endOffset,
				bboxes: m.bboxes as unknown as BoundingBox[] | null,
				rangeType: m.rangeType,
				mentionType: m.mentionType,
				suggestedByLlmId: m.suggestedByLlmId,
				detectionRunId: m.detectionRunId,
				note: m.note,
				revision: m.revision,
				createdAt: m.createdAt.toISOString(),
				updatedAt: m.updatedAt?.toISOString() || null,
				deletedAt: m.deletedAt?.toISOString() || null,
				entry: entry[0] || undefined,
				indexTypes: types,
			};
		},
	});
};
