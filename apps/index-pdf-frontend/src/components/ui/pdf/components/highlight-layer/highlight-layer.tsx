"use client";

import type { ViewerMention } from "@/types/mentions";

type HighlightLayerProps = {
	pageNumber: number;
	mentions: ViewerMention[];
	pageWidth: number;
	pageHeight: number;
	scale?: number;
	onHighlightClick?: (mention: ViewerMention) => void;
};

/**
 * Renders highlight overlays for mentions on a specific PDF page
 *
 * KNOWN LIMITATIONS (MVP):
 * - Rectangular highlights only (no curved/rotated text support yet)
 * - Single bbox per mention (multi-line selections not yet supported)
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
export const HighlightLayer = ({
	pageNumber,
	mentions,
	pageWidth,
	pageHeight,
	scale = 1,
	onHighlightClick,
}: HighlightLayerProps) => {
	const pageMentions = mentions.filter((m) => m.page_number === pageNumber);

	if (pageMentions.length === 0) {
		return null;
	}

	return (
		<div
			className="pointer-events-none absolute inset-0"
			style={{
				width: pageWidth * scale,
				height: pageHeight * scale,
			}}
		>
			{pageMentions.map((mention) => (
				<HighlightBox
					key={mention.id}
					mention={mention}
					scale={scale}
					onClick={onHighlightClick}
				/>
			))}
		</div>
	);
};

type HighlightBoxProps = {
	mention: ViewerMention;
	scale: number;
	onClick?: (mention: ViewerMention) => void;
};

const HighlightBox = ({ mention, scale, onClick }: HighlightBoxProps) => {
	const { bbox } = mention;

	return (
		<button
			type="button"
			className="pointer-events-auto absolute cursor-pointer rounded-sm border-0 bg-yellow-400/30 p-0 transition-colors hover:bg-yellow-400/50 dark:bg-yellow-500/40 dark:hover:bg-yellow-500/60"
			style={{
				left: bbox.x * scale,
				top: bbox.y * scale,
				width: bbox.width * scale,
				height: bbox.height * scale,
				transform: bbox.rotation ? `rotate(${bbox.rotation}deg)` : undefined,
				transformOrigin: "top left",
			}}
			onClick={() => onClick?.(mention)}
			title={`${mention.entryLabel}: ${mention.text_span}`}
			aria-label={`Highlight: ${mention.entryLabel}`}
		/>
	);
};
