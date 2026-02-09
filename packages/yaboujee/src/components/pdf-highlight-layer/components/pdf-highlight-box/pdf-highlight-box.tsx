"use client";

import type { PdfHighlight } from "../../../../types";
import { formatOklchColor } from "../../../../utils/index-type-colors";

/**
 * Get highlight style based on hues array from metadata
 * Computes OKLCH colors locally with PDF-specific lightness/chroma
 */
const getHighlightStyle = ({
	hues,
	isDraft = false,
}: {
	hues?: number[];
	isDraft?: boolean;
}): React.CSSProperties => {
	if (isDraft) {
		// Draft highlights handled by Tailwind classes
		return {};
	}

	// Convert hues to OKLCH colors with PDF-specific parameters
	const colors =
		hues && hues.length > 0
			? hues.map((hue) =>
					formatOklchColor({
						hue,
						lightness: 0.8, // Lighter for better contrast on PDF
						chroma: 0.2, // More saturated for visibility
					}),
				)
			: [formatOklchColor({ hue: 60, lightness: 0.8, chroma: 0.2 })]; // Fallback to yellow

	if (colors.length === 1) {
		// Single color: solid background
		return { backgroundColor: colors[0] };
	}

	// Multiple colors: diagonal stripes
	const stripeWidth = 100 / colors.length;

	const gradientStops = colors
		.map((color, i) => {
			const start = i * stripeWidth;
			const end = (i + 1) * stripeWidth;
			return `${color} ${start}%, ${color} ${end}%`;
		})
		.join(", ");

	return {
		background: `repeating-linear-gradient(
      45deg,
      ${gradientStops}
    )`,
	};
};

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
	const hues = metadata?.hues as number[] | undefined;

	const highlightStyle = getHighlightStyle({ hues, isDraft });

	return (
		<>
			{bboxes.map((bbox, index) => (
				<button
					key={`${highlight.id}-${index}`}
					type="button"
					className={`pointer-events-auto absolute cursor-pointer rounded-sm p-0 transition-opacity ${
						isDraft
							? "border-2 border-dashed border-gray-500 bg-gray-400/30 hover:bg-gray-400/50 dark:border-gray-400 dark:bg-gray-500/40 dark:hover:bg-gray-500/60"
							: "border-0 opacity-30 hover:opacity-50"
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
						...(isDraft ? {} : highlightStyle),
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
