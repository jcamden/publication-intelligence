import { and, desc, eq, isNull } from "drizzle-orm";
import { db, withUserContext } from "../../db/client";
import { sourceDocuments } from "../../db/schema";
import type {
	CreateSourceDocumentInput,
	SourceDocument,
	SourceDocumentListItem,
} from "./sourceDocument.types";

// ============================================================================
// Repository Layer - Drizzle ORM queries
// ============================================================================

export const createSourceDocument = async ({
	input,
}: {
	input: CreateSourceDocumentInput;
}): Promise<SourceDocument> => {
	const [document] = await db
		.insert(sourceDocuments)
		.values({
			projectId: input.projectId,
			title: input.title,
			fileName: input.fileName,
			fileSize: input.fileSize,
			contentHash: input.contentHash,
			storageKey: input.storageKey,
			pageCount: input.pageCount ?? null,
			status: "uploaded",
		})
		.returning();

	if (!document) {
		throw new Error("Failed to create source document");
	}

	return {
		id: document.id,
		project: { id: document.projectId },
		title: document.title,
		file_name: document.fileName,
		file_size: document.fileSize,
		content_hash: document.contentHash,
		page_count: document.pageCount,
		status: document.status,
		storage_key: document.storageKey,
		created_at: document.createdAt,
		processed_at: document.processedAt,
		deleted_at: document.deletedAt,
		is_deleted: document.deletedAt !== null,
	};
};

export const getSourceDocumentById = async ({
	documentId,
	userId,
}: {
	documentId: string;
	userId: string;
}): Promise<SourceDocument | null> => {
	return await withUserContext({
		userId,
		fn: async (tx) => {
			// RLS policies automatically filter based on project access
			const result = await tx
				.select({
					id: sourceDocuments.id,
					title: sourceDocuments.title,
					file_name: sourceDocuments.fileName,
					file_size: sourceDocuments.fileSize,
					content_hash: sourceDocuments.contentHash,
					page_count: sourceDocuments.pageCount,
					storage_key: sourceDocuments.storageKey,
					status: sourceDocuments.status,
					project_id: sourceDocuments.projectId,
					created_at: sourceDocuments.createdAt,
					processed_at: sourceDocuments.processedAt,
					deleted_at: sourceDocuments.deletedAt,
				})
				.from(sourceDocuments)
				.where(
					and(
						eq(sourceDocuments.id, documentId),
						isNull(sourceDocuments.deletedAt),
					),
				)
				.limit(1);

			if (result.length === 0) {
				return null;
			}

			const document = result[0];

			return {
				id: document.id,
				project: { id: document.project_id },
				title: document.title,
				file_name: document.file_name,
				file_size: document.file_size,
				content_hash: document.content_hash,
				page_count: document.page_count,
				status: document.status,
				storage_key: document.storage_key,
				created_at: document.created_at,
				processed_at: document.processed_at,
				deleted_at: document.deleted_at,
				is_deleted: document.deleted_at !== null,
			};
		},
	});
};

export const listSourceDocumentsByProject = async ({
	projectId,
	userId,
}: {
	projectId: string;
	userId: string;
}): Promise<SourceDocumentListItem[]> => {
	return await withUserContext({
		userId,
		fn: async (tx) => {
			// RLS policies automatically filter based on project access
			const documents = await tx
				.select({
					id: sourceDocuments.id,
					title: sourceDocuments.title,
					file_name: sourceDocuments.fileName,
					file_size: sourceDocuments.fileSize,
					page_count: sourceDocuments.pageCount,
					status: sourceDocuments.status,
					created_at: sourceDocuments.createdAt,
				})
				.from(sourceDocuments)
				.where(
					and(
						eq(sourceDocuments.projectId, projectId),
						isNull(sourceDocuments.deletedAt),
					),
				)
				.orderBy(desc(sourceDocuments.createdAt));

			return documents;
		},
	});
};

export const softDeleteSourceDocument = async ({
	documentId,
	userId,
}: {
	documentId: string;
	userId: string;
}): Promise<{ id: string; deleted_at: Date } | null> => {
	return await withUserContext({
		userId,
		fn: async (tx) => {
			// RLS policies automatically enforce authorization
			const result = await tx
				.update(sourceDocuments)
				.set({
					deletedAt: new Date(),
				})
				.where(
					and(
						eq(sourceDocuments.id, documentId),
						isNull(sourceDocuments.deletedAt),
					),
				)
				.returning({
					id: sourceDocuments.id,
					deleted_at: sourceDocuments.deletedAt,
				});

			if (result.length === 0) {
				return null;
			}

			if (!result[0].deleted_at) {
				throw new Error("Soft delete failed: deleted_at is null");
			}

			return {
				id: result[0].id,
				deleted_at: result[0].deleted_at,
			};
		},
	});
};
