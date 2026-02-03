"use client";

import type { PdfHighlight } from "../../../../types";

const INDEX_TYPE_COLORS: Record<string, string> = {
	subject: "#FCD34D",
	author: "#86EFAC",
	scripture: "#93C5FD",
};

const getColorForType = (indexType: string): string => {
	return INDEX_TYPE_COLORS[indexType] || "#FCD34D"; // Default to yellow
};

const getHighlightStyle = (indexTypes?: string[]) => {
	if (!indexTypes || indexTypes.length === 0) {
		// No index types: use default yellow
		return { backgroundColor: "#FCD34D" };
	}

	if (indexTypes.length === 1) {
		// Single type: solid color
		return { backgroundColor: getColorForType(indexTypes[0]) };
	}

	// Multi-type: diagonal stripes
	const colors = indexTypes.map(getColorForType);
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
	const indexTypes = metadata?.indexTypes as string[] | undefined;

	const highlightStyle = getHighlightStyle(indexTypes);

	return (
		<>
			{bboxes.map((bbox, index) => (
				<button
					key={`${highlight.id}-${index}`}
					type="button"
					className={`pointer-events-auto absolute cursor-pointer rounded-sm p-0 transition-opacity ${
						isDraft
							? "border-2 border-dashed border-blue-500 bg-blue-400/30 hover:bg-blue-400/50 dark:border-blue-400 dark:bg-blue-500/40 dark:hover:bg-blue-500/60"
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
