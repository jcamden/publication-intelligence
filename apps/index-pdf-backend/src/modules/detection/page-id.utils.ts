import crypto from "node:crypto";

const NAMESPACE = "pubint-document-page-v1";

/**
 * Deterministic page id from document id and 1-based document page number.
 * Frontend can use this to send pageId for scope=page runs; backend resolves back to page number.
 */
export function documentPageId(documentId: string, pageNumber: number): string {
	const payload = `${NAMESPACE}:${documentId}:${pageNumber}`;
	const hash = crypto.createHash("sha256").update(payload).digest("hex");
	// Format as UUID (8-4-4-4-12)
	return [
		hash.slice(0, 8),
		hash.slice(8, 12),
		hash.slice(12, 16),
		hash.slice(16, 20),
		hash.slice(20, 32),
	].join("-");
}

/**
 * Resolve pageId to 1-based document page number by trying 1..totalPages.
 * Returns null if no page matches (invalid pageId or out of range).
 */
export function resolvePageIdToDocumentPageNumber(
	documentId: string,
	pageId: string,
	totalPages: number,
): number | null {
	for (let p = 1; p <= totalPages; p++) {
		if (documentPageId(documentId, p) === pageId) return p;
	}
	return null;
}
