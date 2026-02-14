import type { BBox, TextAtom } from "@pubint/core";
import type { LLMMention } from "./detection.types";

// ============================================================================
// Types
// ============================================================================

type PdfJsBBox = {
	x: number;
	y: number;
	width: number;
	height: number;
};

export type MentionWithBBox = LLMMention & {
	bboxes: PdfJsBBox[];
};

// ============================================================================
// BBox Conversion
// ============================================================================

/**
 * Convert {x0, y0, x1, y1} to {x, y, width, height} format for PDF.js
 */
const convertToPdfJsFormat = (bbox: BBox): PdfJsBBox => {
	return {
		x: bbox.x0,
		y: bbox.y0,
		width: bbox.x1 - bbox.x0,
		height: bbox.y1 - bbox.y0,
	};
};

// ============================================================================
// Position to BBox Mapping
// ============================================================================

/**
 * Map a position range to bounding boxes from TextAtoms
 */
const mapPositionToBBox = ({
	mention,
	charStart,
	charEnd,
	textAtoms,
}: {
	mention: LLMMention;
	charStart: number;
	charEnd: number;
	textAtoms: TextAtom[];
}): MentionWithBBox => {
	// Find all atoms that overlap with the charAt range
	const matchingAtoms = textAtoms.filter((atom) => {
		// Atom overlaps if its range intersects with the mention's range
		const atomStart = atom.charStart;
		const atomEnd = atom.charEnd;

		// Check for overlap
		return atomStart < charEnd && atomEnd > charStart;
	});

	if (matchingAtoms.length === 0) {
		throw new Error(
			`No TextAtoms found for mention "${mention.textSpan}" at [${charStart}, ${charEnd}]`,
		);
	}

	// Extract bboxes from matching atoms and convert to PDF.js format
	const bboxes = matchingAtoms.map((atom) => convertToPdfJsFormat(atom.bbox));

	return {
		...mention,
		bboxes,
	};
};

/**
 * Batch map mentions with positions to bboxes
 */
export const mapPositionsToBBoxes = ({
	mentionsWithPositions,
	textAtoms,
}: {
	mentionsWithPositions: Array<{
		mention: LLMMention;
		charStart: number;
		charEnd: number;
	}>;
	textAtoms: TextAtom[];
}): {
	mapped: MentionWithBBox[];
	failed: Array<{ mention: LLMMention; error: string }>;
} => {
	const mapped: MentionWithBBox[] = [];
	const failed: Array<{ mention: LLMMention; error: string }> = [];

	for (const { mention, charStart, charEnd } of mentionsWithPositions) {
		try {
			const withBBox = mapPositionToBBox({
				mention,
				charStart,
				charEnd,
				textAtoms,
			});
			mapped.push(withBBox);
		} catch (error) {
			failed.push({
				mention,
				error: error instanceof Error ? error.message : String(error),
			});
		}
	}

	return { mapped, failed };
};
