import type { MatcherMentionCandidate } from "../detection.types";
import { buildDedupeKey } from "../layout/bbox-canonical.utils";

/**
 * Deterministic order: pageNumber asc, charStart asc, longer span first (charEnd - charStart desc), stable groupId tiebreaker (Task 6.2).
 * Exported for tests (determinism and ordering).
 */
export function sortMatcherCandidates(
	candidates: MatcherMentionCandidate[],
): void {
	candidates.sort((a, b) => {
		if (a.pageNumber !== b.pageNumber) return a.pageNumber - b.pageNumber;
		if (a.charStart !== b.charStart) return a.charStart - b.charStart;
		const lenA = a.charEnd - a.charStart;
		const lenB = b.charEnd - b.charStart;
		if (lenA !== lenB) return lenB - lenA;
		return a.groupId.localeCompare(b.groupId);
	});
}

/**
 * In-memory dedupe: same projectIndexTypeId + matcherId + pageNumber + canonical bbox => one candidate.
 * When parsed and fallback collide on same key, prefer parsed (Task 4.3). Exported for tests.
 */
export function dedupeMatcherCandidates(
	candidates: MatcherMentionCandidate[],
	projectIndexTypeId: string,
): MatcherMentionCandidate[] {
	const candidateByKey = new Map<string, MatcherMentionCandidate>();
	for (const c of candidates) {
		const key = buildDedupeKey({
			projectIndexTypeId,
			matcherId: c.matcherId,
			pageNumber: c.pageNumber,
			charStart: c.charStart,
			bboxes: c.bboxes,
		});
		const existing = candidateByKey.get(key);
		if (!existing) {
			candidateByKey.set(key, c);
		} else if (c.fallbackBookLevel && !existing.fallbackBookLevel) {
			// Keep existing (parsed)
		} else if (!c.fallbackBookLevel && existing.fallbackBookLevel) {
			candidateByKey.set(key, c);
		}
	}
	const out = Array.from(candidateByKey.values());
	sortMatcherCandidates(out);
	return out;
}
