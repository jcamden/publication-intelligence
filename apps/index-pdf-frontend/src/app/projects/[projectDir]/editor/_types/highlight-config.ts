// Unified configuration for all highlight types (both index types and region types)

export type HighlightColor = {
	hue: number; // 0-360
};

export type HighlightType =
	| "subject"
	| "author"
	| "scripture"
	| "exclude"
	| "page_number";

export type HighlightColorConfig = {
	[K in HighlightType]: HighlightColor;
};

export const DEFAULT_HIGHLIGHT_COLOR_CONFIG: HighlightColorConfig = {
	// Index types
	subject: { hue: 230 }, // Blue
	author: { hue: 270 }, // Purple
	scripture: { hue: 160 }, // Green
	// Region types
	exclude: { hue: 17 }, // Orange
	page_number: { hue: 293 }, // Magenta
};

export const formatOklch = ({
	lightness,
	chroma,
	hue,
	alpha,
}: {
	lightness: number;
	chroma: number;
	hue: number;
	alpha?: number; // 0-1, optional
}): string => {
	const base = `oklch(${lightness.toFixed(2)} ${chroma.toFixed(2)} ${hue}`;
	return alpha !== undefined ? `${base} / ${alpha.toFixed(2)})` : `${base})`;
};

export const parseOklch = (
	oklchString: string,
): {
	lightness: number;
	chroma: number;
	hue: number;
	alpha?: number;
} | null => {
	// Match with optional alpha: oklch(L C H) or oklch(L C H / A)
	const match = oklchString.match(
		/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)/,
	);
	if (!match) return null;

	return {
		lightness: parseFloat(match[1]),
		chroma: parseFloat(match[2]),
		hue: parseFloat(match[3]),
		alpha: match[4] ? parseFloat(match[4]) : undefined,
	};
};

// Backward compatibility exports
export type IndexTypeColor = HighlightColor;
export type IndexTypeName = "subject" | "author" | "scripture";
export type ColorConfig = Pick<HighlightColorConfig, IndexTypeName>;
export const DEFAULT_COLOR_CONFIG: ColorConfig = {
	subject: DEFAULT_HIGHLIGHT_COLOR_CONFIG.subject,
	author: DEFAULT_HIGHLIGHT_COLOR_CONFIG.author,
	scripture: DEFAULT_HIGHLIGHT_COLOR_CONFIG.scripture,
};

export type RegionTypeColor = HighlightColor;
export type RegionTypeName = "exclude" | "page_number";
export type RegionTypeColorConfig = Pick<HighlightColorConfig, RegionTypeName>;
export const DEFAULT_REGION_TYPE_COLOR_CONFIG: RegionTypeColorConfig = {
	exclude: DEFAULT_HIGHLIGHT_COLOR_CONFIG.exclude,
	page_number: DEFAULT_HIGHLIGHT_COLOR_CONFIG.page_number,
};
