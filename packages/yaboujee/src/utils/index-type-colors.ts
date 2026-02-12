/**
 * Utility for mapping index types to their OKLCH colors
 *
 * This ensures colors are tied to specific index types by name,
 * not by ordinal position in an array.
 */

export type IndexTypeName = "subject" | "author" | "scripture" | "region";

export type IndexTypeHue = {
	hue: number; // 0-360
};

/**
 * Default hue assignments for index types
 * These match the defaults in the backend's index type config
 */
export const DEFAULT_INDEX_TYPE_HUES: Record<IndexTypeName, IndexTypeHue> = {
	author: { hue: 270 }, // Purple
	subject: { hue: 230 }, // Blue
	scripture: { hue: 160 }, // Green
	region: { hue: 340 }, // Pink
};

/**
 * Generate OKLCH color string from hue with specified lightness, chroma, and alpha
 */
export const formatOklchColor = ({
	hue,
	lightness = 0.8,
	chroma = 0.2,
	alpha,
}: {
	hue: number;
	lightness?: number;
	chroma?: number;
	alpha?: number; // 0-1, optional
}): string => {
	const base = `oklch(${lightness.toFixed(2)} ${chroma.toFixed(2)} ${hue}`;
	return alpha !== undefined ? `${base} / ${alpha.toFixed(2)})` : `${base})`;
};

/**
 * Map index type names to their OKLCH color strings
 * Preserves the association between index type and color
 */
export const mapIndexTypesToColors = ({
	indexTypes,
	hueConfig = DEFAULT_INDEX_TYPE_HUES,
	lightness = 0.8,
	chroma = 0.2,
}: {
	indexTypes: IndexTypeName[];
	hueConfig?: Record<IndexTypeName, IndexTypeHue>;
	lightness?: number;
	chroma?: number;
}): string[] => {
	return indexTypes.map((typeName) => {
		const typeHue = hueConfig[typeName];
		return formatOklchColor({
			hue: typeHue.hue,
			lightness,
			chroma,
		});
	});
};

type ColorContext = "sidebar" | "pdf" | "badge";

/**
 * Get context-specific lightness and chroma parameters
 */
const getContextParams = ({
	context,
}: {
	context: ColorContext;
}): { lightness: number; chroma: number } => {
	switch (context) {
		case "sidebar":
			return { lightness: 0.95, chroma: 0.15 };
		case "pdf":
			return { lightness: 0.8, chroma: 0.2 };
		case "badge":
			return { lightness: 0.85, chroma: 0.18 };
		default:
			return { lightness: 0.75, chroma: 0.15 };
	}
};

/**
 * Derive OKLCH color string for a specific context
 */
export const deriveColorForContext = ({
	hue,
	context,
}: {
	hue: number;
	context: ColorContext;
}): string => {
	const params = getContextParams({ context });
	return formatOklchColor({
		hue,
		...params,
	});
};
