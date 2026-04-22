"use client";

import { memo, useMemo } from "react";
import type { PdfHighlight } from "../../types";
import { PdfHighlightBox } from "./components/pdf-highlight-box";

export type PdfHighlightLayerProps = {
	pageNumber: number;
	highlights: PdfHighlight[];
	pageWidth: number;
	pageHeight: number;
	scale?: number;
	onHighlightClick?: (highlight: PdfHighlight, anchorEl: HTMLElement) => void;
	/** Optional registry callback for id → DOM node mapping (see PdfHighlightBox). */
	onAnchorRef?: (id: string, el: HTMLElement | null) => void;
	style?: React.CSSProperties;
};

/**
 * Renders highlight overlays for a specific PDF page.
 *
 * Performance: memoized so it only re-renders when its props change; callers
 * should pass a stable, already-page-filtered `highlights` array (ideally
 * bucketed by page at the source) so we avoid re-walking the whole document
 * list per render.
 */
const PdfHighlightLayerImpl = ({
	pageNumber,
	highlights,
	pageWidth,
	pageHeight,
	scale = 1,
	onHighlightClick,
	onAnchorRef,
	style,
}: PdfHighlightLayerProps) => {
	// Defensive filter in case the caller passed a full-doc list. This is cheap
	// on already-bucketed arrays (hot path has the caller filter ahead of us).
	const pageHighlights = useMemo(
		() => highlights.filter((h) => h.pageNumber === pageNumber),
		[highlights, pageNumber],
	);

	if (pageHighlights.length === 0) {
		return null;
	}

	return (
		<div
			className="pointer-events-none absolute inset-0"
			data-testid="pdf-highlight-layer"
			style={{
				width: pageWidth * scale,
				height: pageHeight * scale,
				zIndex: 1,
				...style,
			}}
		>
			{pageHighlights.map((highlight) => (
				<PdfHighlightBox
					key={highlight.id}
					highlight={highlight}
					scale={scale}
					onClick={onHighlightClick}
					onAnchorRef={onAnchorRef}
				/>
			))}
		</div>
	);
};

export const PdfHighlightLayer = memo(PdfHighlightLayerImpl);
PdfHighlightLayer.displayName = "PdfHighlightLayer";
