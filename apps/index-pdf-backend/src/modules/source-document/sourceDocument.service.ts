import type { StorageService } from "../../infrastructure/storage";
import { requireFound } from "../../lib/errors";
import { logEvent } from "../../logger";
import { insertEvent } from "../event/event.repo";
import { getProjectById } from "../project/project.repo";
import { computeFileHash, validatePdfFile } from "./pdf-utils";
import * as sourceDocumentRepo from "./sourceDocument.repo";
import type {
	SourceDocument,
	SourceDocumentListItem,
} from "./sourceDocument.types";

// ============================================================================
// Service Layer - Domain logic and orchestration
// ============================================================================

export type UploadFileInput = {
	buffer: Buffer;
	filename: string;
	mimeType: string;
};

export const uploadSourceDocument = async ({
	storageService,
	projectId,
	file,
	title,
	pageCount,
	userId,
	requestId,
}: {
	storageService: StorageService;
	projectId: string;
	file: UploadFileInput;
	title?: string;
	pageCount?: number;
	userId: string;
	requestId: string;
}): Promise<SourceDocument> => {
	const project = await getProjectById({ projectId, userId });
	const foundProject = requireFound(project);

	const validation = validatePdfFile({
		buffer: file.buffer,
		mimeType: file.mimeType,
	});

	if (!validation.valid) {
		logEvent({
			event: "source_document.upload_failed",
			context: {
				requestId,
				userId,
				metadata: {
					projectId,
					filename: file.filename,
					reason: validation.reason,
				},
			},
		});

		throw new Error(validation.reason ?? "Invalid PDF file");
	}

	const contentHash = computeFileHash({ buffer: file.buffer });

	const { storageKey, sizeBytes } = await storageService.saveFile({
		buffer: file.buffer,
		originalFilename: file.filename,
		mimeType: file.mimeType,
	});

	const documentTitle = title ?? file.filename;

	const document = await sourceDocumentRepo.createSourceDocument({
		input: {
			projectId: foundProject.id,
			title: documentTitle,
			fileName: file.filename,
			fileSize: sizeBytes,
			contentHash,
			storageKey,
			pageCount,
		},
	});

	logEvent({
		event: "source_document.uploaded",
		context: {
			requestId,
			userId,
			metadata: {
				projectId: foundProject.id,
				documentId: document.id,
				filename: file.filename,
				sizeBytes,
				storageKey,
			},
		},
	});

	await insertEvent({
		type: "document.uploaded",
		projectId: foundProject.id,
		userId,
		entityType: "SourceDocument",
		entityId: document.id,
		metadata: {
			title: document.title,
			fileName: document.file_name,
			fileSize: document.file_size,
			contentHash: document.content_hash,
		},
		requestId,
	});

	return document;
};

export const getSourceDocumentById = async ({
	documentId,
	userId,
	requestId,
}: {
	documentId: string;
	userId: string;
	requestId: string;
}): Promise<SourceDocument> => {
	const document = await sourceDocumentRepo.getSourceDocumentById({
		documentId,
		userId,
	});

	const found = requireFound(document);

	logEvent({
		event: "source_document.retrieved",
		context: {
			requestId,
			userId,
			metadata: { documentId: found.id },
		},
	});

	return found;
};

export const listSourceDocumentsByProject = async ({
	projectId,
	userId,
	requestId,
}: {
	projectId: string;
	userId: string;
	requestId: string;
}): Promise<SourceDocumentListItem[]> => {
	const project = await getProjectById({ projectId, userId });
	requireFound(project);

	logEvent({
		event: "source_document.list_requested",
		context: {
			requestId,
			userId,
			metadata: { projectId },
		},
	});

	return sourceDocumentRepo.listSourceDocumentsByProject({
		projectId,
		userId,
	});
};

export const deleteSourceDocument = async ({
	documentId,
	userId,
	requestId,
}: {
	documentId: string;
	userId: string;
	requestId: string;
}): Promise<void> => {
	const document = await sourceDocumentRepo.getSourceDocumentById({
		documentId,
		userId,
	});
	const found = requireFound(document);

	const result = await sourceDocumentRepo.softDeleteSourceDocument({
		documentId,
		userId,
	});

	const deleted = requireFound(result);

	logEvent({
		event: "source_document.deleted",
		context: {
			requestId,
			userId,
			metadata: {
				documentId: deleted.id,
				deleted_at: deleted.deleted_at,
			},
		},
	});

	await insertEvent({
		type: "document.deleted",
		projectId: found.project.id,
		userId,
		entityType: "SourceDocument",
		entityId: deleted.id,
		requestId,
	});
};
