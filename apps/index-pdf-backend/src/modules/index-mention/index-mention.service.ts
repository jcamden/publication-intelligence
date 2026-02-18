import { TRPCError } from "@trpc/server";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { db } from "../../db/client";
import {
	indexEntries,
	indexMentions,
	projectIndexTypes,
} from "../../db/schema";
import { requireFound } from "../../lib/errors";
import { logEvent } from "../../logger";
import { insertEvent } from "../event/event.repo";
import * as indexEntryRepo from "../index-entry/index-entry.repo";
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
		.where(
			and(eq(indexEntries.id, input.entryId), isNull(indexEntries.deletedAt)),
		)
		.limit(1);

	if (entry.length === 0) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Index entry not found or deleted",
		});
	}

	const hasSee = await indexEntryRepo.entryHasSeeCrossReference({
		entryId: input.entryId,
	});
	if (hasSee) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message:
				"Mentions cannot target an entry that has a See cross-reference. Use the target entry instead.",
		});
	}

	const mention = await indexMentionRepo.createIndexMention({
		input,
		projectIndexTypeId: entry[0].projectIndexTypeId,
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
	requireFound(existing);

	let projectIndexTypeId: string | undefined;

	if (input.entryId) {
		const entry = await db
			.select({
				id: indexEntries.id,
				projectIndexTypeId: indexEntries.projectIndexTypeId,
			})
			.from(indexEntries)
			.where(
				and(eq(indexEntries.id, input.entryId), isNull(indexEntries.deletedAt)),
			)
			.limit(1);

		if (entry.length === 0) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Index entry not found or deleted",
			});
		}

		const hasSee = await indexEntryRepo.entryHasSeeCrossReference({
			entryId: input.entryId,
		});
		if (hasSee) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message:
					"Mentions cannot target an entry that has a See cross-reference. Use the target entry instead.",
			});
		}

		// Inherit index type from new entry
		projectIndexTypeId = entry[0].projectIndexTypeId;
	}

	const updated = await indexMentionRepo.updateIndexMention({
		input,
		projectIndexTypeId,
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
			projectIndexTypeId: indexEntries.projectIndexTypeId,
		})
		.from(indexEntries)
		.where(
			and(inArray(indexEntries.id, entryIds), isNull(indexEntries.deletedAt)),
		);

	if (entries.length !== entryIds.length) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "One or more index entries not found or deleted",
		});
	}

	const projectId = entries[0].projectId;

	// Create a map of entryId to projectIndexTypeId
	const entryTypeMap = new Map(
		entries.map((e) => [e.id, e.projectIndexTypeId]),
	);

	const created = await indexMentionRepo.bulkCreateIndexMentions({
		mentions: input.mentions,
		entryTypeMap,
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

export const approveIndexMention = async ({
	id,
	projectId,
	userId,
	requestId,
}: {
	id: string;
	projectId: string;
	userId: string;
	requestId: string;
}): Promise<IndexMention | null> => {
	logEvent({
		event: "index_mention.approve_suggested",
		context: { requestId, userId, metadata: { mentionId: id, projectId } },
	});

	const approved = await indexMentionRepo.approveIndexMention({ id, userId });

	if (!approved) {
		throw new Error("Mention not found or approval failed");
	}

	logEvent({
		event: "index_mention.approved",
		context: { requestId, userId, metadata: { mentionId: id, projectId } },
	});

	return approved;
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

export const deleteAllMentionsByEntry = async ({
	entryId,
	projectId,
	userId,
	requestId,
}: {
	entryId: string;
	projectId: string;
	userId: string;
	requestId: string;
}): Promise<{ deletedCount: number }> => {
	logEvent({
		event: "index_mention.bulk_delete_by_entry_requested",
		context: {
			requestId,
			userId,
			metadata: {
				entryId,
				projectId,
			},
		},
	});

	// Get all mentions for this entry
	const mentions = await db
		.select({ id: indexMentions.id })
		.from(indexMentions)
		.innerJoin(indexEntries, eq(indexMentions.entryId, indexEntries.id))
		.where(
			and(
				eq(indexMentions.entryId, entryId),
				eq(indexEntries.projectId, projectId),
				isNull(indexMentions.deletedAt),
			),
		);

	// Delete all mentions
	for (const mention of mentions) {
		await indexMentionRepo.deleteIndexMention({
			id: mention.id,
			userId,
		});
	}

	logEvent({
		event: "index_mention.bulk_deleted_by_entry",
		context: {
			requestId,
			userId,
			metadata: {
				entryId,
				projectId,
				deletedCount: mentions.length,
			},
		},
	});

	await insertEvent({
		type: "index_mention.bulk_deleted_by_entry",
		projectId,
		userId,
		entityType: "IndexEntry",
		entityId: entryId,
		metadata: {
			deletedCount: mentions.length,
		},
		requestId,
	});

	return { deletedCount: mentions.length };
};
