import { documentPageId } from "@pubint/core";

export { documentPageId };

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
