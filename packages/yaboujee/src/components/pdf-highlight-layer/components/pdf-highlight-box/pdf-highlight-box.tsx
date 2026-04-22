"use client";

import { memo, useCallback, useMemo, useRef } from "react";
import type { PdfHighlight } from "../../../../types/pdf-highlight";
import { formatOklchColor } from "../../../../utils/index-type-colors";

/**
 * Get highlight style based on hues array or region color from metadata
 * Computes OKLCH colors locally with PDF-specific lightness/chroma
 */
const getHighlightStyle = ({
	hues,
	regionColor,
	isDraft = false,
}: {
	hues?: number[];
	regionColor?: string;
	isDraft?: boolean;
}): React.CSSProperties => {
	if (isDraft) {
		// Draft highlights handled by Tailwind classes
		return {};
	}

	if (regionColor) {
		return { backgroundColor: regionColor };
	}

	const colors =
		hues && hues.length > 0
			? hues.map((hue) =>
					formatOklchColor({
						hue,
						lightness: 0.8,
						chroma: 0.2,
					}),
				)
			: [formatOklchColor({ hue: 60, lightness: 0.8, chroma: 0.2 })];

	if (colors.length === 1) {
		return { backgroundColor: colors[0] };
	}

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
	onClick?: (highlight: PdfHighlight, anchorEl: HTMLElement) => void;
	/**
	 * Optional ref-callback invoked with the first bbox's DOM node (the anchor
	 * used for popovers). Lets parents build an O(1) id → element registry for
	 * click handlers from sidebars without touching the DOM.
	 */
	onAnchorRef?: (id: string, el: HTMLElement | null) => void;
};

/**
 * Renders the visual rectangles for a single highlight.
 *
 * PERFORMANCE: previously every bbox rendered as its own `<button>`. For a
 * multi-line mention that's N focusable interactive nodes, and documents with
 * thousands of mentions turned the highlight layer into a tax on every
 * interaction. This revision renders a single focusable `<button>` as the
 * anchor/hit target for the first bbox and plain `<div>`s for the remaining
 * bboxes that share the same click handler. Visual fidelity is preserved, DOM
 * and focus-ring work drops by up to 1 node per extra bbox.
 */
export const PdfHighlightBox = memo(
	({ highlight, scale, onClick, onAnchorRef }: PdfHighlightBoxProps) => {
		const { bboxes, label, text, metadata, id } = highlight;
		const isDraft = metadata?.isDraft === true;
		const hues = metadata?.hues as number[] | undefined;
		const regionColor = metadata?.regionColor as string | undefined;

		const highlightStyle = useMemo(
			() => getHighlightStyle({ hues, regionColor, isDraft }),
			[hues, regionColor, isDraft],
		);

		const anchorRef = useRef<HTMLButtonElement | null>(null);

		const setAnchor = useCallback(
			(el: HTMLButtonElement | null) => {
				anchorRef.current = el;
				onAnchorRef?.(id, el);
			},
			[id, onAnchorRef],
		);

		const handleClick = useCallback(() => {
			if (!anchorRef.current || !onClick) return;
			onClick(highlight, anchorRef.current);
		}, [highlight, onClick]);

		if (bboxes.length === 0) return null;

		const commonClass = `pointer-events-auto absolute cursor-pointer rounded-sm transition-opacity ${
			isDraft
				? "border-2 border-dashed border-gray-500 bg-gray-400/30 hover:bg-gray-400/50 dark:border-gray-400 dark:bg-gray-500/40 dark:hover:bg-gray-500/60"
				: "border-0 opacity-30 hover:opacity-50"
		}`;

		const styleFor = (bbox: (typeof bboxes)[number]): React.CSSProperties => ({
			left: bbox.x * scale,
			top: bbox.y * scale,
			width: bbox.width * scale,
			height: bbox.height * scale,
			transform: bbox.rotation ? `rotate(${bbox.rotation}deg)` : undefined,
			transformOrigin: "top left",
			...(isDraft ? {} : highlightStyle),
		});

		const [first, ...rest] = bboxes;

		return (
			<>
				<button
					key={`${id}-0`}
					ref={setAnchor}
					type="button"
					className={`${commonClass} p-0`}
					style={styleFor(first)}
					onClick={handleClick}
					title={text ? `${label}: ${text}` : label}
					aria-label={`Highlight: ${label}`}
					data-testid={`highlight-${id}`}
					data-highlight-id={id}
				/>
				{rest.map((bbox, i) => (
					<div
						key={`${id}-${i + 1}`}
						className={commonClass}
						style={styleFor(bbox)}
						onClick={handleClick}
						onKeyDown={(e) => {
							if (e.key === "Enter" || e.key === " ") handleClick();
						}}
						title={text ? `${label}: ${text}` : label}
						role="presentation"
						aria-hidden="true"
						data-testid={`highlight-${id}`}
						data-highlight-id={id}
					/>
				))}
			</>
		);
	},
);

PdfHighlightBox.displayName = "PdfHighlightBox";
