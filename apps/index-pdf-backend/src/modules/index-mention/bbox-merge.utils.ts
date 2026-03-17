/**
 * Merge bboxes that lie on the same line (same y within tolerance) into a single
 * bbox per line, using the leftmost and rightmost coordinates of the merged boxes.
 * Bboxes on different lines (different y) are not merged.
 */
import type { BoundingBox } from "./index-mention.types";

const SAME_LINE_Y_TOLERANCE = 1;

/**
 * Group bboxes by line (y), then merge each group into one bbox spanning
 * min(x) to max(x+width), with y/height covering the line.
 * Returns bboxes sorted by y (top to bottom).
 */
export function mergeBboxesOnSameLine(
	bboxes: BoundingBox[] | null,
): BoundingBox[] | null {
	if (!bboxes || bboxes.length <= 1) return bboxes;

	// Sort by y then x for stable grouping
	const sorted = [...bboxes].sort(
		(a, b) => a.y - b.y || a.x - b.x,
	);

	// Group by same line (y within tolerance)
	const groups: BoundingBox[][] = [];
	let currentGroup: BoundingBox[] = [sorted[0]];
	let currentY = sorted[0].y;

	for (let i = 1; i < sorted.length; i++) {
		const b = sorted[i];
		if (Math.abs(b.y - currentY) <= SAME_LINE_Y_TOLERANCE) {
			currentGroup.push(b);
		} else {
			groups.push(currentGroup);
			currentGroup = [b];
			currentY = b.y;
		}
	}
	groups.push(currentGroup);

	// Merge each group into one bbox (leftmost x, rightmost x+width, combined y/height)
	return groups.map((group) => {
		const left = Math.min(...group.map((b) => b.x));
		const right = Math.max(...group.map((b) => b.x + b.width));
		const top = Math.min(...group.map((b) => b.y));
		const bottom = Math.max(...group.map((b) => b.y + b.height));
		return {
			x: left,
			y: top,
			width: right - left,
			height: bottom - top,
		};
	});
}
