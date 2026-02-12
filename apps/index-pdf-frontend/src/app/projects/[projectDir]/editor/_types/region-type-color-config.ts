import type { RegionType } from "@pubint/core";

export type RegionTypeColor = {
	hue: number; // 0-360
};

export type RegionTypeColorConfig = {
	[K in RegionType]: RegionTypeColor;
};

export const DEFAULT_REGION_TYPE_COLOR_CONFIG: RegionTypeColorConfig = {
	exclude: { hue: 0 }, // Red
	page_number: { hue: 270 }, // Purple
};
