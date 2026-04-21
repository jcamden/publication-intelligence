import type { BBox, TextAtom } from "@pubint/core";
import type { LLMMention } from "../detection.types";

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
 * Compute the sub-bbox of an atom that covers only [overlapStart, overlapEnd)
 * within the atom's [atomStart, atomEnd). This gives distinct bboxes per
 * (charStart, charEnd) so multiple mentions on the same line get distinct
 * bboxes_hash and can all be inserted (unique constraint is entry+page+bboxes_hash).
 */
const subBboxFromAtom = (
	atom: TextAtom,
	overlapStart: number,
	overlapEnd: number,
): BBox => {
	const { bbox, charStart: atomStart, charEnd: atomEnd } = atom;
	const span = atomEnd - atomStart;
	if (span <= 0) return bbox;
	const t0 = (overlapStart - atomStart) / span;
	const t1 = (overlapEnd - atomStart) / span;
	const w = bbox.x1 - bbox.x0;
	return {
		x0: bbox.x0 + t0 * w,
		y0: bbox.y0,
		x1: bbox.x0 + t1 * w,
		y1: bbox.y1,
	};
};

/**
 * Map a position range to bounding boxes from TextAtoms. Uses sub-bboxes
 * by character offset so different (charStart, charEnd) get distinct bboxes
 * even when they share the same atoms (e.g. multiple "Qumran" on one line).
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
		const atomStart = atom.charStart;
		const atomEnd = atom.charEnd;
		return atomStart < charEnd && atomEnd > charStart;
	});

	if (matchingAtoms.length === 0) {
		throw new Error(
			`No TextAtoms found for mention "${mention.textSpan}" at [${charStart}, ${charEnd}]`,
		);
	}

	// Sub-bbox per atom for the overlap range so each occurrence has a distinct bbox
	const bboxes = matchingAtoms.map((atom) => {
		const overlapStart = Math.max(atom.charStart, charStart);
		const overlapEnd = Math.min(atom.charEnd, charEnd);
		const sub = subBboxFromAtom(atom, overlapStart, overlapEnd);
		return convertToPdfJsFormat(sub);
	});

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
