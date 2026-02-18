import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { db, withUserContext } from "../../db/client";
import {
	indexEntries,
	indexMentions,
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
	const mentions = await db
		.select({
			id: indexMentions.id,
			entryId: indexMentions.entryId,
			projectIndexTypeId: indexMentions.projectIndexTypeId,
			pageNumber: indexMentions.pageNumber,
			textSpan: indexMentions.textSpan,
			bboxes: indexMentions.bboxes,
			mentionType: indexMentions.mentionType,
			pageSublocation: indexMentions.pageSublocation,
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
				projectIndexTypeIds && projectIndexTypeIds.length > 0
					? inArray(indexMentions.projectIndexTypeId, projectIndexTypeIds)
					: undefined,
				includeDeleted ? undefined : isNull(indexMentions.deletedAt),
			),
		)
		.orderBy(indexMentions.pageNumber, indexMentions.createdAt);

	if (mentions.length === 0) {
		return [];
	}

	const uniqueTypeIds = [...new Set(mentions.map((m) => m.projectIndexTypeId))];
	const indexTypes = await db
		.select({
			id: projectIndexTypes.id,
			indexType: projectIndexTypes.highlightType,
			colorHue: projectIndexTypes.colorHue,
		})
		.from(projectIndexTypes)
		.where(inArray(projectIndexTypes.id, uniqueTypeIds));

	const indexTypeMap = new Map(indexTypes.map((t) => [t.id, t]));

	return mentions.map((mention) => {
		const indexType = indexTypeMap.get(mention.projectIndexTypeId);
		return {
			id: mention.id,
			entryId: mention.entryId,
			entry: mention.entry,
			pageNumber: mention.pageNumber,
			textSpan: mention.textSpan,
			bboxes: mention.bboxes as unknown as BoundingBox[] | null,
			mentionType: mention.mentionType,
			pageSublocation: mention.pageSublocation,
			detectionRunId: mention.detectionRunId,
			indexTypes: indexType
				? [
						{
							projectIndexTypeId: mention.projectIndexTypeId,
							indexType: indexType.indexType,
							colorHue: indexType.colorHue,
						},
					]
				: [],
			createdAt: mention.createdAt.toISOString(),
		};
	});
};

export type MentionPageSpan = {
	entryId: string;
	pageNumber: number;
	pageNumberEnd: number | null;
};

export const listMentionPageSpans = async ({
	projectId,
	projectIndexTypeId,
}: {
	projectId: string;
	projectIndexTypeId: string;
}): Promise<MentionPageSpan[]> => {
	const rows = await db
		.select({
			entryId: indexMentions.entryId,
			pageNumber: indexMentions.pageNumber,
			pageNumberEnd: indexMentions.pageNumberEnd,
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
				eq(indexMentions.projectIndexTypeId, projectIndexTypeId),
				isNull(indexMentions.deletedAt),
			),
		);

	return rows.map((r) => ({
		entryId: r.entryId,
		pageNumber: r.pageNumber,
		pageNumberEnd: r.pageNumberEnd,
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
			projectIndexTypeId: indexMentions.projectIndexTypeId,
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

	const [indexType] = await db
		.select({
			id: projectIndexTypes.id,
			indexType: projectIndexTypes.highlightType,
			colorHue: projectIndexTypes.colorHue,
		})
		.from(projectIndexTypes)
		.where(eq(projectIndexTypes.id, mention.projectIndexTypeId))
		.limit(1);

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
		indexTypes: indexType
			? [
					{
						id: indexType.id,
						projectIndexTypeId: mention.projectIndexTypeId,
						projectIndexType: {
							id: indexType.id,
							indexType: indexType.indexType,
							colorHue: indexType.colorHue,
						},
					},
				]
			: [],
	};
};

export const createIndexMention = async ({
	input,
	projectIndexTypeId,
	userId,
}: {
	input: CreateIndexMentionInput;
	projectIndexTypeId: string;
	userId: string;
}): Promise<IndexMention> => {
	return await withUserContext({
		userId,
		fn: async (tx) => {
			const [mention] = await tx
				.insert(indexMentions)
				.values({
					entryId: input.entryId,
					projectIndexTypeId,
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

			const entry = await tx
				.select({
					id: indexEntries.id,
					label: indexEntries.label,
					projectIndexTypeId: indexEntries.projectIndexTypeId,
				})
				.from(indexEntries)
				.where(eq(indexEntries.id, input.entryId))
				.limit(1);

			const [indexType] = await tx
				.select({
					id: projectIndexTypes.id,
					indexType: projectIndexTypes.highlightType,
					colorHue: projectIndexTypes.colorHue,
				})
				.from(projectIndexTypes)
				.where(eq(projectIndexTypes.id, projectIndexTypeId))
				.limit(1);

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
				indexTypes: indexType
					? [
							{
								id: indexType.id,
								projectIndexTypeId: projectIndexTypeId,
								projectIndexType: {
									id: indexType.id,
									indexType: indexType.indexType,
									colorHue: indexType.colorHue,
								},
							},
						]
					: [],
			};
		},
	});
};

export const updateIndexMention = async ({
	input,
	projectIndexTypeId,
	userId,
}: {
	input: UpdateIndexMentionInput;
	projectIndexTypeId?: string;
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

			if (projectIndexTypeId !== undefined) {
				updateValues.projectIndexTypeId = projectIndexTypeId;
			}

			if (input.textSpan !== undefined) {
				updateValues.textSpan = input.textSpan;
			}

			if (input.pageSublocation !== undefined) {
				updateValues.pageSublocation = input.pageSublocation;
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

			const mention = await tx
				.select({
					id: indexMentions.id,
					entryId: indexMentions.entryId,
					projectIndexTypeId: indexMentions.projectIndexTypeId,
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

			const m = mention[0];

			const entry = await tx
				.select({
					id: indexEntries.id,
					label: indexEntries.label,
					projectIndexTypeId: indexEntries.projectIndexTypeId,
				})
				.from(indexEntries)
				.where(eq(indexEntries.id, m.entryId))
				.limit(1);

			const [indexType] = await tx
				.select({
					id: projectIndexTypes.id,
					indexType: projectIndexTypes.highlightType,
					colorHue: projectIndexTypes.colorHue,
				})
				.from(projectIndexTypes)
				.where(eq(projectIndexTypes.id, m.projectIndexTypeId))
				.limit(1);

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
				indexTypes: indexType
					? [
							{
								id: indexType.id,
								projectIndexTypeId: m.projectIndexTypeId,
								projectIndexType: {
									id: indexType.id,
									indexType: indexType.indexType,
									colorHue: indexType.colorHue,
								},
							},
						]
					: [],
			};
		},
	});
};

export const updateIndexMentionTypes = async (_params: {
	input: UpdateIndexMentionTypesInput;
	userId: string;
}): Promise<IndexMention[]> => {
	throw new Error(
		"updateIndexMentionTypes is no longer supported. Mentions inherit their index type from their entry. To change a mention's index type, move it to an entry with the desired type using updateIndexMention with a new entryId.",
	);
};

export const bulkCreateIndexMentions = async ({
	mentions,
	entryTypeMap,
	userId,
}: {
	mentions: CreateIndexMentionInput[];
	entryTypeMap: Map<string, string>;
	userId: string;
}): Promise<IndexMention[]> => {
	return await withUserContext({
		userId,
		fn: async (tx) => {
			const createdMentions = await tx
				.insert(indexMentions)
				.values(
					mentions.map((m) => {
						const projectIndexTypeId = entryTypeMap.get(m.entryId);
						if (!projectIndexTypeId) {
							throw new Error(
								`No projectIndexTypeId found for entry ${m.entryId}`,
							);
						}
						return {
							entryId: m.entryId,
							projectIndexTypeId,
							documentId: m.documentId,
							pageNumber: m.pageNumber,
							textSpan: m.textSpan,
							bboxes:
								m.bboxesPdf as unknown as typeof indexMentions.$inferInsert.bboxes,
							rangeType: "single_page" as const,
							mentionType: m.mentionType,
							revision: 1,
						};
					}),
				)
				.returning();

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

			const projectIndexTypeIds = [
				...new Set(createdMentions.map((m) => m.projectIndexTypeId)),
			];
			const indexTypes = await tx
				.select({
					id: projectIndexTypes.id,
					indexType: projectIndexTypes.highlightType,
					colorHue: projectIndexTypes.colorHue,
				})
				.from(projectIndexTypes)
				.where(inArray(projectIndexTypes.id, projectIndexTypeIds));

			const indexTypeMap = new Map(indexTypes.map((t) => [t.id, t]));

			return createdMentions.map((m) => {
				const indexType = indexTypeMap.get(m.projectIndexTypeId);
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
					entry: entryMap.get(m.entryId),
					indexTypes: indexType
						? [
								{
									id: indexType.id,
									projectIndexTypeId: m.projectIndexTypeId,
									projectIndexType: {
										id: indexType.id,
										indexType: indexType.indexType,
										colorHue: indexType.colorHue,
									},
								},
							]
						: [],
				};
			});
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
					projectIndexTypeId: indexMentions.projectIndexTypeId,
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

			const m = mention[0];

			const entry = await tx
				.select({
					id: indexEntries.id,
					label: indexEntries.label,
					projectIndexTypeId: indexEntries.projectIndexTypeId,
				})
				.from(indexEntries)
				.where(eq(indexEntries.id, m.entryId))
				.limit(1);

			const [indexType] = await tx
				.select({
					id: projectIndexTypes.id,
					indexType: projectIndexTypes.highlightType,
					colorHue: projectIndexTypes.colorHue,
				})
				.from(projectIndexTypes)
				.where(eq(projectIndexTypes.id, m.projectIndexTypeId))
				.limit(1);

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
				indexTypes: indexType
					? [
							{
								id: indexType.id,
								projectIndexTypeId: m.projectIndexTypeId,
								projectIndexType: {
									id: indexType.id,
									indexType: indexType.indexType,
									colorHue: indexType.colorHue,
								},
							},
						]
					: [],
			};
		},
	});
};
