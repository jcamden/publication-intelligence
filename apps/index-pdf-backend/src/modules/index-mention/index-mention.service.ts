import { TRPCError } from "@trpc/server";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "../../db/client";
import { indexEntries, projectIndexTypes } from "../../db/schema";
import { requireFound } from "../../lib/errors";
import { logEvent } from "../../logger";
import { insertEvent } from "../event/event.repo";
import * as indexMentionRepo from "./index-mention.repo";
import type {
	BulkCreateIndexMentionsInput,
	CreateIndexMentionInput,
	DeleteIndexMentionInput,
	IndexMention,
	IndexMentionListItem,
	ListIndexMentionsInput,
	UpdateIndexMentionInput,
	UpdateIndexMentionTypesInput,
} from "./index-mention.types";

// ============================================================================
// Service Layer - Business logic and orchestration
// ============================================================================

export const listIndexMentions = async ({
	projectId,
	documentId,
	pageNumber,
	projectIndexTypeIds,
	includeDeleted,
	userId,
	requestId,
}: ListIndexMentionsInput & {
	userId: string;
	requestId: string;
}): Promise<IndexMentionListItem[]> => {
	logEvent({
		event: "index_mention.list_requested",
		context: {
			requestId,
			userId,
			metadata: {
				projectId,
				documentId,
				pageNumber,
				projectIndexTypeIds,
				includeDeleted,
			},
		},
	});

	return await indexMentionRepo.listIndexMentions({
		projectId,
		documentId,
		pageNumber,
		projectIndexTypeIds,
		includeDeleted,
	});
};

export const createIndexMention = async ({
	input,
	userId,
	requestId,
}: {
	input: CreateIndexMentionInput;
	userId: string;
	requestId: string;
}): Promise<IndexMention> => {
	const entry = await db
		.select({
			id: indexEntries.id,
			projectId: indexEntries.projectId,
			projectIndexTypeId: indexEntries.projectIndexTypeId,
		})
		.from(indexEntries)
		.where(eq(indexEntries.id, input.entryId))
		.limit(1);

	if (entry.length === 0) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Index entry not found",
		});
	}

	const indexTypeValidation = await db
		.select({ id: projectIndexTypes.id })
		.from(projectIndexTypes)
		.where(
			and(
				inArray(projectIndexTypes.id, input.projectIndexTypeIds),
				eq(projectIndexTypes.projectId, entry[0].projectId),
			),
		);

	if (indexTypeValidation.length !== input.projectIndexTypeIds.length) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message:
				"One or more index types are invalid or do not belong to project",
		});
	}

	const mention = await indexMentionRepo.createIndexMention({
		input,
		userId,
	});

	logEvent({
		event: "index_mention.created",
		context: {
			requestId,
			userId,
			metadata: {
				mentionId: mention.id,
				entryId: input.entryId,
				documentId: input.documentId,
				pageNumber: input.pageNumber,
				mentionType: input.mentionType,
				projectIndexTypeIds: input.projectIndexTypeIds,
			},
		},
	});

	await insertEvent({
		type: "index_mention.created",
		projectId: entry[0].projectId,
		userId,
		entityType: "IndexMention",
		entityId: mention.id,
		metadata: {
			entryId: mention.entryId,
			documentId: mention.documentId,
			pageNumber: mention.pageNumber,
			textSpan: mention.textSpan,
		},
		requestId,
	});

	return mention;
};

export const updateIndexMention = async ({
	input,
	userId,
	requestId,
}: {
	input: UpdateIndexMentionInput;
	userId: string;
	requestId: string;
}): Promise<IndexMention> => {
	const existing = await indexMentionRepo.getIndexMentionById({ id: input.id });
	const mention = requireFound(existing);

	if (input.entryId) {
		const entry = await db
			.select({ id: indexEntries.id })
			.from(indexEntries)
			.where(eq(indexEntries.id, input.entryId))
			.limit(1);

		if (entry.length === 0) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Index entry not found",
			});
		}
	}

	if (input.projectIndexTypeIds && input.projectIndexTypeIds.length > 0) {
		const entry = await db
			.select({ id: indexEntries.id, projectId: indexEntries.projectId })
			.from(indexEntries)
			.where(eq(indexEntries.id, mention.entryId))
			.limit(1);

		if (entry.length > 0) {
			const indexTypeValidation = await db
				.select({ id: projectIndexTypes.id })
				.from(projectIndexTypes)
				.where(
					and(
						inArray(projectIndexTypes.id, input.projectIndexTypeIds),
						eq(projectIndexTypes.projectId, entry[0].projectId),
					),
				);

			if (indexTypeValidation.length !== input.projectIndexTypeIds.length) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message:
						"One or more index types are invalid or do not belong to project",
				});
			}
		}
	}

	const updated = await indexMentionRepo.updateIndexMention({
		input,
		userId,
	});

	const result = requireFound(updated);

	logEvent({
		event: "index_mention.updated",
		context: {
			requestId,
			userId,
			metadata: {
				mentionId: input.id,
				changes: input,
			},
		},
	});

	const entry = await db
		.select({ projectId: indexEntries.projectId })
		.from(indexEntries)
		.where(eq(indexEntries.id, result.entryId))
		.limit(1);

	if (entry.length > 0) {
		await insertEvent({
			type: "index_mention.updated",
			projectId: entry[0].projectId,
			userId,
			entityType: "IndexMention",
			entityId: result.id,
			metadata: {
				entryId: result.entryId,
				revision: result.revision,
			},
			requestId,
		});
	}

	return result;
};

export const updateIndexMentionTypes = async ({
	input,
	userId,
	requestId,
}: {
	input: UpdateIndexMentionTypesInput;
	userId: string;
	requestId: string;
}): Promise<IndexMention[]> => {
	for (const mentionId of input.mentionIds) {
		const existing = await indexMentionRepo.getIndexMentionById({
			id: mentionId,
		});
		if (!existing) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: `Mention ${mentionId} not found`,
			});
		}
	}

	const firstMention = await indexMentionRepo.getIndexMentionById({
		id: input.mentionIds[0],
	});
	if (!firstMention) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Mention not found",
		});
	}

	const entry = await db
		.select({ projectId: indexEntries.projectId })
		.from(indexEntries)
		.where(eq(indexEntries.id, firstMention.entryId))
		.limit(1);

	if (entry.length > 0) {
		const indexTypeValidation = await db
			.select({ id: projectIndexTypes.id })
			.from(projectIndexTypes)
			.where(
				and(
					inArray(projectIndexTypes.id, input.projectIndexTypeIds),
					eq(projectIndexTypes.projectId, entry[0].projectId),
				),
			);

		if (indexTypeValidation.length !== input.projectIndexTypeIds.length) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message:
					"One or more index types are invalid or do not belong to project",
			});
		}
	}

	const updated = await indexMentionRepo.updateIndexMentionTypes({
		input,
		userId,
	});

	logEvent({
		event: "index_mention.types_updated",
		context: {
			requestId,
			userId,
			metadata: {
				mentionIds: input.mentionIds,
				operation: input.operation,
				projectIndexTypeIds: input.projectIndexTypeIds,
			},
		},
	});

	if (entry.length > 0) {
		await insertEvent({
			type: "index_mention.types_updated",
			projectId: entry[0].projectId,
			userId,
			entityType: "IndexMention",
			entityId: input.mentionIds[0],
			metadata: {
				count: input.mentionIds.length,
				operation: input.operation,
			},
			requestId,
		});
	}

	return updated;
};

export const bulkCreateIndexMentions = async ({
	input,
	userId,
	requestId,
}: {
	input: BulkCreateIndexMentionsInput;
	userId: string;
	requestId: string;
}): Promise<IndexMention[]> => {
	const entryIds = [...new Set(input.mentions.map((m) => m.entryId))];
	const entries = await db
		.select({
			id: indexEntries.id,
			projectId: indexEntries.projectId,
		})
		.from(indexEntries)
		.where(inArray(indexEntries.id, entryIds));

	if (entries.length !== entryIds.length) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "One or more index entries not found",
		});
	}

	const projectId = entries[0].projectId;

	const allProjectIndexTypeIds = [
		...new Set(input.mentions.flatMap((m) => m.projectIndexTypeIds)),
	];
	const indexTypeValidation = await db
		.select({ id: projectIndexTypes.id })
		.from(projectIndexTypes)
		.where(
			and(
				inArray(projectIndexTypes.id, allProjectIndexTypeIds),
				eq(projectIndexTypes.projectId, projectId),
			),
		);

	if (indexTypeValidation.length !== allProjectIndexTypeIds.length) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message:
				"One or more index types are invalid or do not belong to project",
		});
	}

	const created = await indexMentionRepo.bulkCreateIndexMentions({
		mentions: input.mentions,
		userId,
	});

	logEvent({
		event: "index_mention.bulk_created",
		context: {
			requestId,
			userId,
			metadata: {
				count: created.length,
				projectId,
			},
		},
	});

	await insertEvent({
		type: "index_mention.bulk_created",
		projectId,
		userId,
		entityType: "IndexMention",
		entityId: created[0]?.id || "",
		metadata: {
			count: created.length,
		},
		requestId,
	});

	return created;
};

export const deleteIndexMention = async ({
	input,
	userId,
	requestId,
}: {
	input: DeleteIndexMentionInput;
	userId: string;
	requestId: string;
}): Promise<IndexMention> => {
	const existing = await indexMentionRepo.getIndexMentionById({ id: input.id });
	const mention = requireFound(existing);

	const deleted = await indexMentionRepo.deleteIndexMention({
		id: input.id,
		userId,
	});

	const result = requireFound(deleted);

	logEvent({
		event: "index_mention.deleted",
		context: {
			requestId,
			userId,
			metadata: {
				mentionId: input.id,
			},
		},
	});

	const entry = await db
		.select({ projectId: indexEntries.projectId })
		.from(indexEntries)
		.where(eq(indexEntries.id, mention.entryId))
		.limit(1);

	if (entry.length > 0) {
		await insertEvent({
			type: "index_mention.deleted",
			projectId: entry[0].projectId,
			userId,
			entityType: "IndexMention",
			entityId: result.id,
			metadata: {
				entryId: result.entryId,
			},
			requestId,
		});
	}

	return result;
};
