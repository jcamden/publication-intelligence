/**
 * Utility for mapping index types to their OKLCH colors
 *
 * This ensures colors are tied to specific index types by name,
 * not by ordinal position in an array.
 */

export type IndexTypeName = "subject" | "author" | "scripture" | "context";

export type IndexTypeHue = {
	hue: number; // 0-360
};

/**
 * Default hue assignments for index types
 * These match the defaults in the editor's colorConfig
 */
export const DEFAULT_INDEX_TYPE_HUES: Record<IndexTypeName, IndexTypeHue> = {
	author: { hue: 30 }, // Orange
	subject: { hue: 230 }, // Blue
	scripture: { hue: 120 }, // Green
	context: { hue: 340 }, // Pink
};

/**
 * Generate OKLCH color string from hue with specified lightness and chroma
 */
export const formatOklchColor = ({
	hue,
	lightness = 0.8,
	chroma = 0.2,
}: {
	hue: number;
	lightness?: number;
	chroma?: number;
}): string => `oklch(${lightness.toFixed(2)} ${chroma.toFixed(2)} ${hue})`;

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
