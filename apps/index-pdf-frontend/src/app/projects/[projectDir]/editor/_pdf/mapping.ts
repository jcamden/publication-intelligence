/**
 * PDF Text Mapping Strategy
 *
 * This module handles mapping between:
 * 1. Canonical mentions (from PyMuPDF text atoms) - source of truth
 * 2. Viewer highlights (PDF.js coordinate system) - for display
 *
 * ARCHITECTURE PLAN:
 *
 * Phase 1 (Current - MVP):
 * - Naive text search: given page_number + text_span, find matching text on page
 * - Approximate bounding boxes from viewer's text selection API
 * - Mark unresolved mentions when text not found
 *
 * Phase 2 (Future - Robust):
 * - Store canonical atom IDs alongside viewer coordinates
 * - Reconcile by: (page, normalized text, nearby bbox)
 * - Mapping confidence score (high/medium/low)
 * - Handle multi-line selections, rotated text, columns
 *
 * Phase 3 (Advanced):
 * - Word-level alignment between PyMuPDF and viewer
 * - Store both coordinate systems for cross-validation
 * - Auto-correction when text extraction differs slightly
 * - Handle complex layouts (tables, footnotes, figures)
 *
 * COORDINATE SYSTEM NOTES:
 * - PDF.js uses: origin top-left, y increases downward
 * - PyMuPDF uses: origin bottom-left, y increases upward (PDF standard)
 * - Conversion needed: viewerY = pageHeight - pymupdfY - height
 * - Always store pageWidth/pageHeight with bboxes for round-tripping
 */

import type {
	BoundingBox,
	CoordinateMetadata,
} from "@/app/projects/[projectDir]/editor/_types/mentions";

/**
 * Normalized text for fuzzy matching (lowercase, collapse whitespace)
 */
export const normalizeText = ({ text }: { text: string }): string => {
	return text.toLowerCase().replace(/\s+/g, " ").trim();
};

/**
 * Result of attempting to map a canonical mention to viewer coordinates
 */
export type MappingResult = {
	success: boolean;
	bboxes: BoundingBox[];
	confidence: "high" | "medium" | "low" | "unresolved";
	method: "exact_match" | "fuzzy_match" | "approximate" | "failed";
	message?: string;
};

/**
 * Naive implementation: given page + text, attempt to find it in viewer
 *
 * TODO Phase 2:
 * - Accept canonical atom IDs
 * - Use stored viewer coordinates if available
 * - Fall back to text search only if no stored mapping exists
 * - Store confidence score and method used
 *
 * TODO Phase 3:
 * - Word-level alignment
 * - Handle multi-column layouts
 * - Cross-validate both coordinate systems
 */
export const mapCanonicalToViewer = ({
	pageNumber: _pageNumber,
	textSpan: _textSpan,
	canonicalBbox,
	pageMetadata,
}: {
	pageNumber: number;
	textSpan: string;
	canonicalBbox?: BoundingBox;
	pageMetadata?: CoordinateMetadata;
}): MappingResult => {
	// Phase 1: Naive approach - return unresolved, require manual selection
	// Real implementation would query viewer's text layer here

	// If we have canonical bbox and metadata, convert coordinates
	if (canonicalBbox && pageMetadata) {
		const viewerBbox = convertPyMuPDFToViewer({
			bbox: canonicalBbox,
			pageHeight: pageMetadata.pageHeight,
		});

		return {
			success: true,
			bboxes: [viewerBbox],
			confidence: "medium",
			method: "approximate",
			message: "Converted from canonical coordinates",
		};
	}

	// No stored coordinates - must find via text search
	return {
		success: false,
		bboxes: [],
		confidence: "unresolved",
		method: "failed",
		message: `No stored coordinates for text: "${_textSpan.substring(0, 50)}..."`,
	};
};

/**
 * Convert PyMuPDF coordinates (bottom-left origin) to viewer (top-left origin)
 */
export const convertPyMuPDFToViewer = ({
	bbox,
	pageHeight,
}: {
	bbox: BoundingBox;
	pageHeight: number;
}): BoundingBox => {
	return {
		x: bbox.x,
		y: pageHeight - bbox.y - bbox.height,
		width: bbox.width,
		height: bbox.height,
		rotation: bbox.rotation,
	};
};

/**
 * Convert viewer coordinates (top-left origin) to PyMuPDF (bottom-left origin)
 */
export const convertViewerToPyMuPDF = ({
	bbox,
	pageHeight,
}: {
	bbox: BoundingBox;
	pageHeight: number;
}): BoundingBox => {
	return {
		x: bbox.x,
		y: pageHeight - bbox.y - bbox.height,
		width: bbox.width,
		height: bbox.height,
		rotation: bbox.rotation,
	};
};

/**
 * Check if two bounding boxes overlap (for reconciliation)
 */
export const bboxesOverlap = ({
	a,
	b,
	threshold = 0.5,
}: {
	a: BoundingBox;
	b: BoundingBox;
	threshold?: number;
}): boolean => {
	const xOverlap = Math.max(
		0,
		Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x),
	);
	const yOverlap = Math.max(
		0,
		Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y),
	);

	const overlapArea = xOverlap * yOverlap;
	const aArea = a.width * a.height;
	const bArea = b.width * b.height;
	const minArea = Math.min(aArea, bArea);

	return overlapArea / minArea >= threshold;
};

/**
 * Future: Store mapping between canonical and viewer coordinates
 *
 * Schema (not in Gel yet, would be app-layer cache):
 * {
 *   mention_id: string
 *   canonical_atom_ids: string[]
 *   viewer_bboxes: BoundingBox[]
 *   confidence: 'high' | 'medium' | 'low'
 *   last_verified: timestamp
 *   coordinate_metadata: CoordinateMetadata
 * }
 */
export type MentionMapping = {
	mentionId: string;
	canonicalAtomIds?: string[];
	viewerBboxes: BoundingBox[];
	confidence: "high" | "medium" | "low";
	lastVerified: string;
	coordinateMetadata: CoordinateMetadata;
};
