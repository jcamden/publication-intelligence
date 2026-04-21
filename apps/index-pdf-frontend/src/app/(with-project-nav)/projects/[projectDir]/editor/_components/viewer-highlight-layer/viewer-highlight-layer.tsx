"use client";

import type { PdfHighlight } from "@pubint/yaboujee";
import { PdfHighlightLayer } from "@pubint/yaboujee";
import type { ViewerMention } from "@/app/projects/[projectDir]/editor/_types/mentions";

type ViewerHighlightLayerProps = {
	pageNumber: number;
	mentions: ViewerMention[];
	pageWidth: number;
	pageHeight: number;
	scale?: number;
	onHighlightClick?: (mention: ViewerMention) => void;
};

/**
 * Viewer-specific adapter: Converts ViewerMentions to PdfHighlights
 *
 * This adapter allows the PDF viewer to use domain-specific ViewerMention types
 * while the underlying yaboujee component works with generic PdfHighlight types.
 *
 * For comprehensive component documentation and tests, see the PdfHighlightLayer
 * component in @pubint/yaboujee.
 */
export const ViewerHighlightLayer = ({
	pageNumber,
	mentions,
	pageWidth,
	pageHeight,
	scale = 1,
	onHighlightClick,
}: ViewerHighlightLayerProps) => {
	const highlights: PdfHighlight[] = mentions.map((m) => ({
		id: m.id,
		pageNumber: m.page_number,
		bboxes: m.bboxes,
		label: m.entryLabel,
		text: m.text_span,
		metadata: { rangeType: m.range_type },
	}));

	const handleClick = onHighlightClick
		? (highlight: PdfHighlight) => {
				const mention = mentions.find((m) => m.id === highlight.id);
				if (mention) onHighlightClick(mention);
			}
		: undefined;

	return (
		<PdfHighlightLayer
			pageNumber={pageNumber}
			highlights={highlights}
			pageWidth={pageWidth}
			pageHeight={pageHeight}
			scale={scale}
			onHighlightClick={handleClick}
		/>
	);
};
