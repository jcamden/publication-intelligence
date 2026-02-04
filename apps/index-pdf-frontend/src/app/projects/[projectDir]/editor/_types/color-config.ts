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
}: {
	lightness: number;
	chroma: number;
	hue: number;
}): string => `oklch(${lightness.toFixed(2)} ${chroma.toFixed(2)} ${hue})`;

export const parseOklch = (
	oklchString: string,
): { lightness: number; chroma: number; hue: number } | null => {
	const match = oklchString.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/);
	if (!match) return null;

	return {
		lightness: parseFloat(match[1]),
		chroma: parseFloat(match[2]),
		hue: parseFloat(match[3]),
	};
};

export type IndexTypeName = keyof ColorConfig;
