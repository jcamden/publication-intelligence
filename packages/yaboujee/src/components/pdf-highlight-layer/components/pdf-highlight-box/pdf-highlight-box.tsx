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
	const { bboxes, label, text, metadata } = highlight;
	const isDraft = metadata?.isDraft === true;

	return (
		<>
			{bboxes.map((bbox, index) => (
				<button
					key={`${highlight.id}-${index}`}
					type="button"
					className={`pointer-events-auto absolute cursor-pointer rounded-sm p-0 transition-colors ${
						isDraft
							? "border-2 border-dashed border-blue-500 bg-blue-400/30 hover:bg-blue-400/50 dark:border-blue-400 dark:bg-blue-500/40 dark:hover:bg-blue-500/60"
							: "border-0 bg-yellow-400/30 hover:bg-yellow-400/50 dark:bg-yellow-500/40 dark:hover:bg-yellow-500/60"
					}`}
					style={{
						left: bbox.x * scale,
						top: bbox.y * scale,
						width: bbox.width * scale,
						height: bbox.height * scale,
						transform: bbox.rotation
							? `rotate(${bbox.rotation}deg)`
							: undefined,
						transformOrigin: "top left",
					}}
					onClick={() => onClick?.(highlight)}
					title={text ? `${label}: ${text}` : label}
					aria-label={index === 0 ? `Highlight: ${label}` : undefined}
					data-testid={`highlight-${highlight.id}`}
				/>
			))}
		</>
	);
};
