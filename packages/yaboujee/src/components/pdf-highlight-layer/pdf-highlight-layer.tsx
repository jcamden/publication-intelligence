"use client";

import type { PdfHighlight } from "../../types";
import { PdfHighlightBox } from "./components/pdf-highlight-box";

export type PdfHighlightLayerProps = {
	pageNumber: number;
	highlights: PdfHighlight[];
	pageWidth: number;
	pageHeight: number;
	scale?: number;
	onHighlightClick?: (highlight: PdfHighlight) => void;
	style?: React.CSSProperties;
};

/**
 * Renders highlight overlays for a specific PDF page
 *
 * KNOWN LIMITATIONS (MVP):
 * - Rectangular highlights only (no curved/rotated text support yet)
 * - Single bbox per highlight (multi-line selections not yet supported)
 * - No drag/resize interaction
 * - Assumes page rotation = 0
 *
 * FUTURE ENHANCEMENTS:
 * - Multi-bbox highlights for line-wrapped text
 * - Rotation support (rotate highlight with page)
 * - Hover preview of entry label
 * - Edit/delete actions
 * - Highlight colors by entry type
 */
export const PdfHighlightLayer = ({
	pageNumber,
	highlights,
	pageWidth,
	pageHeight,
	scale = 1,
	onHighlightClick,
	style,
}: PdfHighlightLayerProps) => {
	const pageHighlights = highlights.filter((h) => h.pageNumber === pageNumber);

	if (pageHighlights.length === 0) {
		return null;
	}

	return (
		<div
			className="pointer-events-none absolute inset-0"
			style={{
				width: pageWidth * scale,
				height: pageHeight * scale,
				zIndex: 1, // Below text layer, but highlights have pointer-events: auto
				...style,
			}}
		>
			{pageHighlights.map((highlight) => (
				<PdfHighlightBox
					key={highlight.id}
					highlight={highlight}
					scale={scale}
					onClick={onHighlightClick}
				/>
			))}
		</div>
	);
};
