"use client";

import type { PdfHighlight } from "../../../../types";

export type PdfHighlightBoxProps = {
	highlight: PdfHighlight;
	scale: number;
	onClick?: (highlight: PdfHighlight) => void;
};

export const PdfHighlightBox = ({
	highlight,
	scale,
	onClick,
}: PdfHighlightBoxProps) => {
	const { bbox, label, text } = highlight;

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
			onClick={() => onClick?.(highlight)}
			title={text ? `${label}: ${text}` : label}
			aria-label={`Highlight: ${label}`}
			data-testid={`highlight-${highlight.id}`}
		/>
	);
};
