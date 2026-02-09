import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { db } from "../../db/client";
import { indexEntries } from "../../db/schema";
import { requireFound } from "../../lib/errors";
import { logEvent } from "../../logger";
import { insertEvent } from "../event/event.repo";
import * as indexEntryRepo from "./index-entry.repo";
import type {
	CreateIndexEntryInput,
	DeleteIndexEntryInput,
	IndexEntry,
	IndexEntryListItem,
	IndexEntrySearchResult,
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

	logEvent({
		event: "index_entry.created",
		context: {
			requestId,
			userId,
			metadata: {
				entryId: entry.id,
				projectId: input.projectId,
				projectIndexTypeId: input.projectIndexTypeId,
				label: input.label,
				slug: input.slug,
				parentId: input.parentId,
				variantCount: input.variants?.length || 0,
			},
		},
	});

	await insertEvent({
		type: "index_entry.created",
		projectId: input.projectId,
		userId,
		entityType: "IndexEntry",
		entityId: entry.id,
		metadata: {
			label: entry.label,
			slug: entry.slug,
			projectIndexTypeId: entry.projectIndexTypeId,
		},
		requestId,
	});

	return entry;
};

export const updateIndexEntry = async ({
	input,
	userId,
	requestId,
}: {
	input: UpdateIndexEntryInput;
	userId: string;
	requestId: string;
}): Promise<IndexEntry> => {
	const updated = await indexEntryRepo.updateIndexEntry({
		input,
		userId,
	});

	const entry = requireFound(updated);

	logEvent({
		event: "index_entry.updated",
		context: {
			requestId,
			userId,
			metadata: {
				entryId: input.id,
				changes: input,
			},
		},
	});

	await insertEvent({
		type: "index_entry.updated",
		projectId: entry.projectId,
		userId,
		entityType: "IndexEntry",
		entityId: entry.id,
		metadata: {
			label: entry.label,
			revision: entry.revision,
		},
		requestId,
	});

	return entry;
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

			const entry = await tx
				.select({
					projectIndexTypeId: indexEntries.projectIndexTypeId,
				})
				.from(indexEntries)
				.where(eq(indexEntries.id, input.id))
				.limit(1);

			if (entry.length === 0) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Entry not found",
				});
			}

			const isValidParent = await validateParentIndexType({
				projectIndexTypeId: entry[0].projectIndexTypeId,
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

	logEvent({
		event: "index_entry.parent_updated",
		context: {
			requestId,
			userId,
			metadata: {
				entryId: input.id,
				parentId: input.parentId,
			},
		},
	});

	await insertEvent({
		type: "index_entry.parent_updated",
		projectId: entry.projectId,
		userId,
		entityType: "IndexEntry",
		entityId: entry.id,
		metadata: {
			label: entry.label,
			parentId: entry.parentId,
		},
		requestId,
	});

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

	logEvent({
		event: "index_entry.deleted",
		context: {
			requestId,
			userId,
			metadata: {
				entryId: input.id,
				cascadeToChildren: input.cascadeToChildren,
			},
		},
	});

	await insertEvent({
		type: "index_entry.deleted",
		projectId: entry.projectId,
		userId,
		entityType: "IndexEntry",
		entityId: entry.id,
		metadata: {
			label: entry.label,
			cascaded: input.cascadeToChildren,
		},
		requestId,
	});

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
