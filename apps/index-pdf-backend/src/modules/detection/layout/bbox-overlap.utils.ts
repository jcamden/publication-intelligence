import type { BboxAtom } from "./bbox-canonical.utils";

// ============================================================================
// AABB and IoU for fuzzy bbox dedupe (detection vs pre-existing mentions)
// ============================================================================

/**
 * Axis-aligned bounding box of a set of pdfjs-style rects.
 * Single rect covering the union: min x/y, then width/height to max x+width / y+height.
 * Returns null if bboxes is empty or all invalid.
 */
export function aabbFromBboxes(bboxes: BboxAtom[]): BboxAtom | null {
	if (bboxes.length === 0) return null;
	const valid = bboxes.filter(
		(b) =>
			typeof b.width === "number" &&
			typeof b.height === "number" &&
			b.width > 0 &&
			b.height > 0,
	);
	if (valid.length === 0) return null;
	let minX = valid[0].x;
	let minY = valid[0].y;
	let maxRight = valid[0].x + valid[0].width;
	let maxBottom = valid[0].y + valid[0].height;
	for (let i = 1; i < valid.length; i++) {
		const b = valid[i];
		minX = Math.min(minX, b.x);
		minY = Math.min(minY, b.y);
		maxRight = Math.max(maxRight, b.x + b.width);
		maxBottom = Math.max(maxBottom, b.y + b.height);
	}
	return {
		x: minX,
		y: minY,
		width: maxRight - minX,
		height: maxBottom - minY,
	};
}

/**
 * Intersection-over-union of two pdfjs-style rects.
 * Returns 0 if no overlap; 1 if identical.
 */
export function iouPdfJs(a: BboxAtom, b: BboxAtom): number {
	const left = Math.max(a.x, b.x);
	const right = Math.min(a.x + a.width, b.x + b.width);
	const top = Math.max(a.y, b.y);
	const bottom = Math.min(a.y + a.height, b.y + b.height);
	if (left >= right || top >= bottom) return 0;
	const intersection = (right - left) * (bottom - top);
	const areaA = a.width * a.height;
	const areaB = b.width * b.height;
	const union = areaA + areaB - intersection;
	return union <= 0 ? 0 : intersection / union;
}

/**
 * IoU of the AABBs of two bbox sets. Use for fuzzy dedupe: if ≥ threshold, treat as same location.
 * Returns 0 if either set is empty or yields no AABB.
 */
export function bboxOverlapRatio(
	bboxesA: BboxAtom[],
	bboxesB: BboxAtom[],
): number {
	const aabbA = aabbFromBboxes(bboxesA);
	const aabbB = aabbFromBboxes(bboxesB);
	if (!aabbA || !aabbB) return 0;
	return iouPdfJs(aabbA, aabbB);
}

// ============================================================================
// Fuzzy duplicate filter (detection candidates vs pre-existing mentions)
// ============================================================================

export type FuzzyCandidate = {
	pageNumber: number;
	textSpan: string;
	bboxes: BboxAtom[];
	projectIndexTypeId?: string;
};

export type FuzzyExistingMention = {
	pageNumber: number;
	textSpan: string;
	bboxes: BboxAtom[] | null;
	projectIndexTypeId: string;
};

/**
 * IoU threshold for fuzzy bbox dedupe. PyMuPDF vs pdfjs text layer produce
 * slightly different coordinate systems (e.g. 89.5% overlap for same text).
 * 0.85 catches near-matches while avoiding false positives.
 */
export const DEFAULT_OVERLAP_THRESHOLD = 0.85;

function normalizeTextForMatch(text: string): string {
	return text.trim().replace(/\s+/g, " ");
}

export type FuzzyDedupeDebugLog = (info: {
	candidate: { pageNumber: number; textSpan: string; bboxes: BboxAtom[] };
	existing: { pageNumber: number; textSpan: string; bboxes: BboxAtom[] };
	overlapRatio: number;
	matched: boolean;
}) => void;

/**
 * Filter out candidates that fuzzy-match any existing mention (same page, same
 * projectIndexTypeId when provided, same normalized text, bbox IoU ≥ threshold).
 * Existing mentions with null/empty bboxes are ignored. Candidates with empty
 * bboxes are kept (no fuzzy dedupe applied).
 */
export function filterFuzzyDuplicateCandidates(
	candidates: FuzzyCandidate[],
	existingMentions: FuzzyExistingMention[],
	options: {
		overlapThreshold?: number;
		debugLog?: FuzzyDedupeDebugLog;
	} = {},
): FuzzyCandidate[] {
	const threshold = options.overlapThreshold ?? DEFAULT_OVERLAP_THRESHOLD;
	const debugLog = options.debugLog;
	const existingWithBboxes = existingMentions.filter(
		(e): e is FuzzyExistingMention & { bboxes: BboxAtom[] } =>
			e.bboxes != null && e.bboxes.length > 0,
	);

	return candidates.filter((candidate) => {
		if (candidate.bboxes.length === 0) return true;
		const candidateNormText = normalizeTextForMatch(candidate.textSpan);
		const samePage = existingWithBboxes.filter(
			(e) => e.pageNumber === candidate.pageNumber,
		);
		const sameType =
			candidate.projectIndexTypeId != null
				? samePage.filter(
						(e) => e.projectIndexTypeId === candidate.projectIndexTypeId,
					)
				: samePage;
		for (const existing of sameType) {
			const normText = normalizeTextForMatch(existing.textSpan);
			if (normText !== candidateNormText) continue;
			const ratio = bboxOverlapRatio(candidate.bboxes, existing.bboxes);
			const matched = ratio >= threshold;
			debugLog?.({
				candidate: {
					pageNumber: candidate.pageNumber,
					textSpan: candidate.textSpan,
					bboxes: candidate.bboxes,
				},
				existing: {
					pageNumber: existing.pageNumber,
					textSpan: existing.textSpan,
					bboxes: existing.bboxes,
				},
				overlapRatio: ratio,
				matched,
			});
			if (matched) return false;
		}
		return true;
	});
}
