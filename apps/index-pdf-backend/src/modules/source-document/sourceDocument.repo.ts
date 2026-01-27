import type { Client } from "gel";
import type {
	CreateSourceDocumentInput,
	SourceDocument,
	SourceDocumentListItem,
} from "./sourceDocument.types";

// ============================================================================
// Repository Layer - EdgeQL queries
// ============================================================================

export const createSourceDocument = async ({
	gelClient,
	input,
}: {
	gelClient: Client;
	input: CreateSourceDocumentInput;
}): Promise<SourceDocument> => {
	const document = await gelClient.querySingle<SourceDocument>(
		`
		SELECT (
			INSERT SourceDocument {
				project := (SELECT Project FILTER .id = <uuid>$projectId),
				title := <str>$title,
				file_name := <str>$fileName,
				file_size := <int64>$fileSize,
				content_hash := <str>$contentHash,
				storage_key := <str>$storageKey,
				page_count := <optional int32>$pageCount,
				status := SourceDocumentStatus.uploaded
			}
		) {
			id,
			project: { id },
			title,
			file_name,
			file_size,
			content_hash,
			page_count,
			status,
			storage_key,
			created_at,
			processed_at,
			deleted_at,
			is_deleted
		}
	`,
		{
			projectId: input.projectId,
			title: input.title,
			fileName: input.fileName,
			fileSize: input.fileSize,
			contentHash: input.contentHash,
			storageKey: input.storageKey,
			pageCount: input.pageCount ?? null,
		},
	);

	if (!document) {
		throw new Error("Failed to create source document");
	}

	return document;
};

export const getSourceDocumentById = async ({
	gelClient,
	documentId,
}: {
	gelClient: Client;
	documentId: string;
}): Promise<SourceDocument | null> => {
	const document = await gelClient.querySingle<SourceDocument | null>(
		`
		SELECT SourceDocument {
			id,
			project: { id },
			title,
			file_name,
			file_size,
			content_hash,
			page_count,
			status,
			storage_key,
			created_at,
			processed_at,
			deleted_at,
			is_deleted
		}
		FILTER .id = <uuid>$documentId AND NOT EXISTS .deleted_at
	`,
		{ documentId },
	);

	return document;
};

export const listSourceDocumentsByProject = async ({
	gelClient,
	projectId,
}: {
	gelClient: Client;
	projectId: string;
}): Promise<SourceDocumentListItem[]> => {
	const documents = await gelClient.query<SourceDocumentListItem>(
		`
		SELECT SourceDocument {
			id,
			title,
			file_name,
			file_size,
			page_count,
			status,
			created_at
		}
		FILTER .project.id = <uuid>$projectId AND NOT EXISTS .deleted_at
		ORDER BY .created_at DESC
	`,
		{ projectId },
	);

	return documents;
};

export const softDeleteSourceDocument = async ({
	gelClient,
	documentId,
}: {
	gelClient: Client;
	documentId: string;
}): Promise<{ id: string; deleted_at: Date } | null> => {
	const result = await gelClient.querySingle<{
		id: string;
		deleted_at: Date;
	}>(
		`
		SELECT (
			UPDATE SourceDocument
			FILTER .id = <uuid>$documentId AND NOT EXISTS .deleted_at
			SET {
				deleted_at := datetime_current()
			}
		) {
			id,
			deleted_at
		}
	`,
		{ documentId },
	);

	return result;
};
