import type {
	ColorConfig,
	IndexTypeColor,
	IndexTypeName,
} from "../_types/color-config";
import { formatOklch } from "../_types/color-config";

/**
 * Base lightness and chroma values for color generation
 * These are applied programmatically based on the shade
 */
const BASE_LIGHTNESS = 0.75;
const BASE_CHROMA = 0.15;

/**
 * Generate a color shade by applying programmatic lightness and chroma
 * @param color Base color (hue only)
 * @param shade 100-900 (100 = lightest, 900 = darkest)
 */
export const generateShade = ({
	color,
	shade,
}: {
	color: IndexTypeColor;
	shade: number;
}): string => {
	// Map shade (100-900) to lightness
	// 100 = 0.90 (very light), 500 = 0.75 (base), 900 = 0.50 (darker)
	const adjustment = 0.15 - (shade / 100 - 1) * 0.05;
	const lightness = Math.max(0.1, Math.min(0.95, BASE_LIGHTNESS + adjustment));

	return formatOklch({
		hue: color.hue,
		chroma: BASE_CHROMA,
		lightness,
	});
};

/**
 * Inject CSS variables for all index type colors and their shades
 */
export const injectColorVariables = ({ config }: { config: ColorConfig }) => {
	const root = document.documentElement;

	Object.entries(config).forEach(([typeName, color]) => {
		// Base color (apply base lightness and chroma)
		root.style.setProperty(
			`--color-${typeName}`,
			formatOklch({
				hue: color.hue,
				chroma: BASE_CHROMA,
				lightness: BASE_LIGHTNESS,
			}),
		);

		// Generate shades 100-900
		for (let i = 1; i <= 9; i++) {
			const shade = i * 100;
			const shadeColor = generateShade({ color, shade });
			root.style.setProperty(`--color-${typeName}-${shade}`, shadeColor);
		}
	});
};

/**
 * Get Tailwind class name for an index type color
 */
export const getIndexTypeColorClass = ({
	indexType,
	shade = 500,
	property = "bg",
}: {
	indexType: IndexTypeName;
	shade?: number;
	property?: "bg" | "text" | "border";
}): string => {
	return `${property}-${indexType}-${shade}`;
};
