import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { db } from "../../db/client";
import { indexEntries } from "../../db/schema";
import { emitEvent } from "../../event-bus/emit-event";
import { requireFound } from "../../lib/errors";
import { logEvent } from "../../logger";
import * as indexEntryRepo from "./index-entry.repo";
import type {
	CreateCrossReferenceInput,
	CreateIndexEntryInput,
	CrossReference,
	DeleteCrossReferenceInput,
	DeleteIndexEntryInput,
	IndexEntry,
	IndexEntryListItem,
	IndexEntrySearchResult,
	IndexView,
	TransferMatchersInput,
	TransferMentionsInput,
	UpdateIndexEntryInput,
	UpdateIndexEntryParentInput,
} from "./index-entry.types";
import {
	getDepth,
	validateParentIndexType,
	wouldCreateCycle,
} from "./index-entry.utils";

// ============================================================================
// Service Layer - Business logic and orchestration
// ============================================================================

export const listIndexEntries = async ({
	projectId,
	projectIndexTypeId,
	includeDeleted,
	userId,
	requestId,
}: {
	projectId: string;
	projectIndexTypeId?: string;
	includeDeleted?: boolean;
	userId: string;
	requestId: string;
}): Promise<IndexEntryListItem[]> => {
	logEvent({
		event: "index_entry.list_requested",
		context: {
			requestId,
			userId,
			metadata: { projectId, projectIndexTypeId, includeDeleted },
		},
	});

	return await indexEntryRepo.listIndexEntries({
		projectId,
		projectIndexTypeId,
		includeDeleted,
	});
};

export const getIndexView = async ({
	projectId,
	projectIndexTypeId,
	userId,
	requestId,
}: {
	projectId: string;
	projectIndexTypeId: string;
	userId: string;
	requestId: string;
}): Promise<IndexView> => {
	logEvent({
		event: "index_entry.index_view_requested",
		context: {
			requestId,
			userId,
			metadata: { projectId, projectIndexTypeId },
		},
	});

	return await indexEntryRepo.getIndexView({
		projectId,
		projectIndexTypeId,
	});
};

export const createIndexEntry = async ({
	input,
	userId,
	requestId,
}: {
	input: CreateIndexEntryInput;
	userId: string;
	requestId: string;
}): Promise<IndexEntry> => {
	if (input.parentId) {
		const parentId = input.parentId;
		await db.transaction(async (tx) => {
			const isValidParent = await validateParentIndexType({
				projectIndexTypeId: input.projectIndexTypeId,
				parentId,
				tx,
			});

			if (!isValidParent) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Parent must have the same index type",
				});
			}

			const depth = await getDepth({ entryId: parentId, tx });
			if (depth >= 4) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Maximum hierarchy depth (5 levels) exceeded",
				});
			}
		});
	}

	const entry = await indexEntryRepo.createIndexEntry({
		input,
		userId,
	});

	await emitEvent(
		{
			type: "index_entry.created",
			entityType: "IndexEntry",
			entityId: entry.id,
			metadata: {
				entryId: entry.id,
				projectId: input.projectId,
				projectIndexTypeId: entry.projectIndexTypeId,
				label: entry.label,
				slug: entry.slug,
				parentId: input.parentId,
				matcherCount: input.matchers?.length || 0,
			},
		},
		{ userId, projectId: input.projectId, requestId },
	);

	return entry;
};

const UNKNOWN_ENTRY_SLUG = "unknown";

export const updateIndexEntry = async ({
	input,
	userId,
	requestId,
}: {
	input: UpdateIndexEntryInput;
	userId: string;
	requestId: string;
}): Promise<IndexEntry> => {
	const current = await indexEntryRepo.getIndexEntryById({ id: input.id });
	const existing = requireFound(current);
	if (existing.slug === UNKNOWN_ENTRY_SLUG) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Cannot edit the Unknown entry",
		});
	}

	const updated = await indexEntryRepo.updateIndexEntry({
		input,
		userId,
	});

	const entry = requireFound(updated);

	await emitEvent(
		{
			type: "index_entry.updated",
			entityType: "IndexEntry",
			entityId: entry.id,
			metadata: {
				entryId: input.id,
				label: entry.label,
				revision: entry.revision,
				changes: input,
			},
		},
		{ userId, projectId: entry.projectId, requestId },
	);

	return entry;
};

export const approveIndexEntry = async ({
	id,
	projectId,
	userId,
	requestId,
}: {
	id: string;
	projectId: string;
	userId: string;
	requestId: string;
}): Promise<IndexEntry | null> => {
	logEvent({
		event: "index_entry.approve_suggested",
		context: { requestId, userId, metadata: { entryId: id, projectId } },
	});

	try {
		const approved = await indexEntryRepo.approveIndexEntry({ id, userId });

		if (!approved) {
			logEvent({
				event: "index_entry.approve_failed",
				context: {
					requestId,
					userId,
					metadata: { entryId: id, projectId, reason: "Entry not found" },
				},
			});
			throw new Error("Entry not found or approval failed");
		}

		logEvent({
			event: "index_entry.approved",
			context: { requestId, userId, metadata: { entryId: id, projectId } },
		});

		return approved;
	} catch (error) {
		logEvent({
			event: "index_entry.approve_error",
			context: {
				requestId,
				userId,
				metadata: {
					entryId: id,
					projectId,
					error: error instanceof Error ? error.message : String(error),
					stack: error instanceof Error ? error.stack : undefined,
				},
			},
		});
		throw error;
	}
};

export const updateIndexEntryParent = async ({
	input,
	userId,
	requestId,
}: {
	input: UpdateIndexEntryParentInput;
	userId: string;
	requestId: string;
}): Promise<IndexEntry> => {
	const current = await indexEntryRepo.getIndexEntryById({ id: input.id });
	const existingEntry = requireFound(current);
	if (existingEntry.slug === UNKNOWN_ENTRY_SLUG) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Cannot move the Unknown entry",
		});
	}

	if (input.parentId) {
		const parentId = input.parentId;
		await db.transaction(async (tx) => {
			const cycle = await wouldCreateCycle({
				entryId: input.id,
				newParentId: parentId,
				tx,
			});

			if (cycle) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Setting this parent would create a cycle in the hierarchy",
				});
			}

			const entryRows = await tx
				.select({
					projectIndexTypeId: indexEntries.projectIndexTypeId,
				})
				.from(indexEntries)
				.where(eq(indexEntries.id, input.id))
				.limit(1);

			if (entryRows.length === 0) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Entry not found",
				});
			}

			const isValidParent = await validateParentIndexType({
				projectIndexTypeId: entryRows[0].projectIndexTypeId,
				parentId,
				tx,
			});

			if (!isValidParent) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Parent must have the same index type",
				});
			}

			const depth = await getDepth({ entryId: parentId, tx });
			if (depth >= 4) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Maximum hierarchy depth (5 levels) exceeded",
				});
			}
		});
	}

	const updated = await indexEntryRepo.updateIndexEntryParent({
		input,
		userId,
	});

	const entry = requireFound(updated);

	await emitEvent(
		{
			type: "index_entry.parent_updated",
			entityType: "IndexEntry",
			entityId: entry.id,
			metadata: {
				entryId: input.id,
				label: entry.label,
				parentId: entry.parentId,
			},
		},
		{ userId, projectId: entry.projectId, requestId },
	);

	return entry;
};

export const deleteIndexEntry = async ({
	input,
	userId,
	requestId,
}: {
	input: DeleteIndexEntryInput;
	userId: string;
	requestId: string;
}): Promise<IndexEntry> => {
	const current = await indexEntryRepo.getIndexEntryById({ id: input.id });
	const entry = requireFound(current);

	if (entry.slug === UNKNOWN_ENTRY_SLUG) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Cannot delete the Unknown entry",
		});
	}

	if (!input.cascadeToChildren) {
		const children = await indexEntryRepo.listIndexEntries({
			projectId: entry.projectId,
			projectIndexTypeId: entry.projectIndexTypeId,
			includeDeleted: false,
		});

		const childCount = children.filter((c) => c.parentId === input.id).length;

		if (childCount > 0) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: `Cannot delete entry with ${childCount} children. Set cascadeToChildren=true to delete all descendants.`,
			});
		}
	}

	const deleted = await indexEntryRepo.deleteIndexEntry({
		id: input.id,
		userId,
		cascadeToChildren: input.cascadeToChildren,
	});

	const result = requireFound(deleted);

	await emitEvent(
		{
			type: "index_entry.deleted",
			entityType: "IndexEntry",
			entityId: entry.id,
			metadata: {
				entryId: input.id,
				label: entry.label,
				cascadeToChildren: input.cascadeToChildren,
				cascaded: input.cascadeToChildren,
			},
		},
		{ userId, projectId: entry.projectId, requestId },
	);

	return result;
};

export const searchIndexEntries = async ({
	projectId,
	projectIndexTypeId,
	query,
	limit,
	userId,
	requestId,
}: {
	projectId: string;
	projectIndexTypeId: string;
	query: string;
	limit?: number;
	userId: string;
	requestId: string;
}): Promise<IndexEntrySearchResult[]> => {
	logEvent({
		event: "index_entry.search_requested",
		context: {
			requestId,
			userId,
			metadata: { projectId, projectIndexTypeId, query, limit },
		},
	});

	return await indexEntryRepo.searchIndexEntries({
		projectId,
		projectIndexTypeId,
		query,
		limit,
	});
};

export const checkExactMatch = async ({
	projectId,
	projectIndexTypeId,
	text,
	userId,
	requestId,
}: {
	projectId: string;
	projectIndexTypeId: string;
	text: string;
	userId: string;
	requestId: string;
}): Promise<IndexEntry | null> => {
	logEvent({
		event: "index_entry.exact_match_requested",
		context: {
			requestId,
			userId,
			metadata: { projectId, projectIndexTypeId, text },
		},
	});

	return await indexEntryRepo.checkExactMatch({
		projectId,
		projectIndexTypeId,
		text,
	});
};

// ============================================================================
// Cross-Reference Service Functions
// ============================================================================

export const listCrossReferences = async ({
	entryId,
	userId,
	requestId,
}: {
	entryId: string;
	userId: string;
	requestId: string;
}): Promise<CrossReference[]> => {
	logEvent({
		event: "cross_reference.list_requested",
		context: {
			requestId,
			userId,
			metadata: { entryId },
		},
	});

	const relations = await indexEntryRepo.getCrossReferences({ entryId });
	return relations as CrossReference[];
};

const REDIRECT_TYPES = ["see", "qv"] as const;
const SEE_ALSO_TYPE = "see_also";

export const createCrossReference = async ({
	input,
	userId,
	requestId,
}: {
	input: CreateCrossReferenceInput;
	userId: string;
	requestId: string;
}): Promise<CrossReference> => {
	const existing = await indexEntryRepo.getCrossReferences({
		entryId: input.fromEntryId,
	});

	const hasRedirect = existing.some((r) =>
		REDIRECT_TYPES.includes(r.relationType as (typeof REDIRECT_TYPES)[number]),
	);
	const hasSeeAlso = existing.some((r) => r.relationType === SEE_ALSO_TYPE);

	if (input.relationType === SEE_ALSO_TYPE && hasRedirect) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message:
				'Cannot add "see also" cross-reference when entry already has a redirect (see or q.v.). Remove redirects first.',
		});
	}

	if (
		REDIRECT_TYPES.includes(
			input.relationType as (typeof REDIRECT_TYPES)[number],
		) &&
		hasSeeAlso
	) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message:
				'Cannot add redirect (see or q.v.) when entry already has "see also" cross-references. Remove them first.',
		});
	}

	// "See" cross-reference enforcement
	if (input.relationType === "see") {
		// Check if source entry has mentions
		const mentionCount = await indexEntryRepo.getMentionCount({
			entryId: input.fromEntryId,
		});

		if (mentionCount > 0) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: `Cannot create "see" cross-reference. Entry has ${mentionCount} mentions. Transfer or delete them first.`,
			});
		}

		// Delete all matchers from source entry (label remains as implicit default)
		await indexEntryRepo.deleteAllMatchers({
			entryId: input.fromEntryId,
			userId,
		});

		logEvent({
			event: "cross_reference.see_matchers_removed",
			context: {
				requestId,
				userId,
				metadata: {
					fromEntryId: input.fromEntryId,
					toEntryId: input.toEntryId,
				},
			},
		});
	}

	const toEntryId = input.toEntryId ?? null;
	const arbitraryValue = input.arbitraryValue?.trim()
		? input.arbitraryValue.trim()
		: null;

	const relation = await indexEntryRepo.createCrossReference({
		fromEntryId: input.fromEntryId,
		toEntryId,
		arbitraryValue,
		relationType: input.relationType,
		userId,
	});

	logEvent({
		event: "cross_reference.created",
		context: {
			requestId,
			userId,
			metadata: {
				relationId: relation.id,
				fromEntryId: input.fromEntryId,
				toEntryId: relation.toEntryId,
				arbitraryValue: relation.arbitraryValue,
				relationType: input.relationType,
			},
		},
	});

	return relation as CrossReference;
};

export const deleteCrossReference = async ({
	input,
	userId,
	requestId,
}: {
	input: DeleteCrossReferenceInput;
	userId: string;
	requestId: string;
}): Promise<boolean> => {
	const deleted = await indexEntryRepo.deleteCrossReference({
		id: input.id,
		userId,
	});

	logEvent({
		event: "cross_reference.deleted",
		context: {
			requestId,
			userId,
			metadata: {
				relationId: input.id,
			},
		},
	});

	return deleted;
};

export const transferMentions = async ({
	input,
	userId,
	requestId,
}: {
	input: TransferMentionsInput;
	userId: string;
	requestId: string;
}): Promise<{ count: number }> => {
	// Validate both entries have same index type and neither is Unknown
	const [fromEntry] = await db
		.select({
			projectIndexTypeId: indexEntries.projectIndexTypeId,
			slug: indexEntries.slug,
		})
		.from(indexEntries)
		.where(eq(indexEntries.id, input.fromEntryId))
		.limit(1);

	const [toEntry] = await db
		.select({
			projectIndexTypeId: indexEntries.projectIndexTypeId,
			slug: indexEntries.slug,
		})
		.from(indexEntries)
		.where(eq(indexEntries.id, input.toEntryId))
		.limit(1);

	if (!fromEntry || !toEntry) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "One or both entries not found",
		});
	}

	if (
		fromEntry.slug === UNKNOWN_ENTRY_SLUG ||
		toEntry.slug === UNKNOWN_ENTRY_SLUG
	) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Cannot merge to or from the Unknown entry",
		});
	}

	if (fromEntry.projectIndexTypeId !== toEntry.projectIndexTypeId) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Cannot merge entries with different index types",
		});
	}

	const count = await indexEntryRepo.transferMentions({
		fromEntryId: input.fromEntryId,
		toEntryId: input.toEntryId,
		userId,
	});

	logEvent({
		event: "cross_reference.mentions_transferred",
		context: {
			requestId,
			userId,
			metadata: {
				fromEntryId: input.fromEntryId,
				toEntryId: input.toEntryId,
				count,
			},
		},
	});

	return { count };
};

export const transferMatchers = async ({
	input,
	userId,
	requestId,
}: {
	input: TransferMatchersInput;
	userId: string;
	requestId: string;
}): Promise<{ count: number }> => {
	// Validate both entries have same index type and neither is Unknown
	const [fromEntry] = await db
		.select({
			projectIndexTypeId: indexEntries.projectIndexTypeId,
			slug: indexEntries.slug,
		})
		.from(indexEntries)
		.where(eq(indexEntries.id, input.fromEntryId))
		.limit(1);

	const [toEntry] = await db
		.select({
			projectIndexTypeId: indexEntries.projectIndexTypeId,
			slug: indexEntries.slug,
		})
		.from(indexEntries)
		.where(eq(indexEntries.id, input.toEntryId))
		.limit(1);

	if (!fromEntry || !toEntry) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "One or both entries not found",
		});
	}

	if (
		fromEntry.slug === UNKNOWN_ENTRY_SLUG ||
		toEntry.slug === UNKNOWN_ENTRY_SLUG
	) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Cannot merge to or from the Unknown entry",
		});
	}

	if (fromEntry.projectIndexTypeId !== toEntry.projectIndexTypeId) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Cannot merge entries with different index types",
		});
	}

	const count = await indexEntryRepo.transferMatchers({
		fromEntryId: input.fromEntryId,
		toEntryId: input.toEntryId,
		userId,
	});

	logEvent({
		event: "cross_reference.matchers_transferred",
		context: {
			requestId,
			userId,
			metadata: {
				fromEntryId: input.fromEntryId,
				toEntryId: input.toEntryId,
				count,
			},
		},
	});

	return { count };
};
