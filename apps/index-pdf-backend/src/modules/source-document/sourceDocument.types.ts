import { z } from "zod";

// ============================================================================
// DTOs - Data Transfer Objects
// ============================================================================

export const UploadSourceDocumentSchema = z.object({
	projectId: z.string().uuid("Invalid project ID"),
	title: z.string().min(1, "Title is required").max(500).optional(),
});

export type UploadSourceDocumentInput = z.infer<
	typeof UploadSourceDocumentSchema
>;

// ============================================================================
// Domain Types
// ============================================================================

export type SourceDocumentStatus =
	| "uploaded"
	| "processing"
	| "processed"
	| "failed";

export type SourceDocument = {
	id: string;
	project: { id: string };
	title: string;
	file_name: string;
	file_size: number | null;
	content_hash: string | null;
	page_count: number | null;
	status: SourceDocumentStatus;
	storage_key: string;
	created_at: Date;
	processed_at: Date | null;
	deleted_at: Date | null;
	is_deleted: boolean;
};

export type SourceDocumentListItem = {
	id: string;
	title: string;
	file_name: string;
	file_size: number | null;
	page_count: number | null;
	status: SourceDocumentStatus;
	created_at: Date;
};

// ============================================================================
// Repository Input Types
// ============================================================================

export type CreateSourceDocumentInput = {
	projectId: string;
	title: string;
	fileName: string;
	fileSize: number;
	contentHash: string;
	storageKey: string;
	pageCount?: number;
};
