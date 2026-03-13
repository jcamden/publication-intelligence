import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";

const NAMESPACE = "pubint-document-page-v1";

/**
 * Deterministic page id from document id and 1-based document page number.
 * Used for scope=page detection runs; backend resolves back to page number.
 * Shared between frontend and backend via @pubint/core.
 */
export function documentPageId(documentId: string, pageNumber: number): string {
	const payload = `${NAMESPACE}:${documentId}:${pageNumber}`;
	const hash = sha256(new TextEncoder().encode(payload));
	const hashHex = bytesToHex(hash);
	// Set version (position 12) to 4 and variant (position 16) to RFC 4122 (8,9,a,b)
	// so the result passes z.string().uuid() validation
	const compliantHex =
		hashHex.slice(0, 12) +
		"4" +
		hashHex.slice(13, 16) +
		((parseInt(hashHex[16], 16) & 3) | 8).toString(16) +
		hashHex.slice(17);
	// Format as UUID (8-4-4-4-12)
	return [
		compliantHex.slice(0, 8),
		compliantHex.slice(8, 12),
		compliantHex.slice(12, 16),
		compliantHex.slice(16, 20),
		compliantHex.slice(20, 32),
	].join("-");
}
