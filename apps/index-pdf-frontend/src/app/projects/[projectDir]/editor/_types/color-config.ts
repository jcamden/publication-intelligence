export type IndexTypeColor = {
	hue: number; // 0-360
};

export type ColorConfig = {
	author: IndexTypeColor;
	subject: IndexTypeColor;
	scripture: IndexTypeColor;
	context: IndexTypeColor;
};

export const DEFAULT_COLOR_CONFIG: ColorConfig = {
	author: { hue: 30 }, // Orange
	subject: { hue: 230 }, // Blue
	scripture: { hue: 120 }, // Green
	context: { hue: 340 }, // Pink
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

export type IndexTypeName = keyof ColorConfig;
