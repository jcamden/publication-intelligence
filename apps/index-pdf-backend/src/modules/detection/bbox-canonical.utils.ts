import crypto from "node:crypto";

// ============================================================================
// Types - aligned with index_mentions.bboxes and MatcherMentionCandidate.bboxes
// ============================================================================

export type BboxAtom = {
	x: number;
	y: number;
	width: number;
	height: number;
};

// ============================================================================
// Canonical ordering and hashing (Task 4.2)
// ============================================================================

/**
 * Canonical order: y, then x, then width, then height so equivalent bbox sets
 * produce the same key regardless of atom order. Deterministic and
 * language/runtime stable for dedupe and DB uniqueness.
 */
export function canonicalizeBboxes(
	bboxes: BboxAtom[],
): BboxAtom[] {
	if (bboxes.length === 0) return [];
	return [...bboxes].sort((a, b) => {
		if (a.y !== b.y) return a.y - b.y;
		if (a.x !== b.x) return a.x - b.x;
		if (a.width !== b.width) return a.width - b.width;
		return a.height - b.height;
	});
}

/**
 * Stable JSON string for canonical bbox array. Use for in-memory dedupe keys
 * and as input to hash. Do not use for display.
 */
export function canonicalBboxJson(bboxes: BboxAtom[]): string {
	return JSON.stringify(canonicalizeBboxes(bboxes));
}

/**
 * Deterministic SHA-256 hash of canonical bbox JSON. Stored in index_mentions.bboxes_hash
 * for DB uniqueness. Same serializer in run-time and migrations to avoid hash drift.
 */
export function bboxesHash(bboxes: BboxAtom[]): string {
	const json = canonicalBboxJson(bboxes);
	return crypto.createHash("sha256").update(json).digest("hex");
}

/**
 * In-memory dedupe key per candidate: projectIndexTypeId + matcherId + pageNumber + canonicalBboxJson.
 * Same matcher + same bbox + same index type => same key => blocked (one insert).
 * Different matcher or different bbox => different key => allowed.
 */
export function buildDedupeKey({
	projectIndexTypeId,
	matcherId,
	pageNumber,
	bboxes,
}: {
	projectIndexTypeId: string;
	matcherId: string;
	pageNumber: number;
	bboxes: BboxAtom[];
}): string {
	const canonical = canonicalBboxJson(bboxes);
	return `${projectIndexTypeId}:${matcherId}:${pageNumber}:${canonical}`;
}
