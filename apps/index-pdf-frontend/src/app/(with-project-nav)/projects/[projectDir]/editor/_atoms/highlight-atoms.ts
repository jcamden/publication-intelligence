import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import type {
	ColorConfig,
	HighlightColorConfig,
	RegionTypeColorConfig,
} from "../_types/highlight-config";
import { DEFAULT_HIGHLIGHT_COLOR_CONFIG } from "../_types/highlight-config";

export const highlightColorConfigAtom = atomWithStorage<HighlightColorConfig>(
	"highlight-color-config",
	DEFAULT_HIGHLIGHT_COLOR_CONFIG,
	{
		getItem: (key, initialValue) => {
			const stored = localStorage.getItem(key);
			if (stored) {
				try {
					const parsed = JSON.parse(stored);
					if (
						parsed.subject &&
						parsed.author &&
						parsed.scripture &&
						parsed.exclude &&
						parsed.page_number
					) {
						return parsed as HighlightColorConfig;
					}
				} catch {
					// Fall through to migration
				}
			}

			const oldColorConfig = localStorage.getItem("color-config");
			const oldRegionConfig = localStorage.getItem("region-type-color-config");

			let migrated = { ...initialValue };

			if (oldColorConfig) {
				try {
					const parsed = JSON.parse(oldColorConfig);
					migrated = {
						...migrated,
						subject: { hue: parsed.subject?.hue ?? initialValue.subject.hue },
						author: { hue: parsed.author?.hue ?? initialValue.author.hue },
						scripture: {
							hue: parsed.scripture?.hue ?? initialValue.scripture.hue,
						},
					};
				} catch {
					// Keep defaults
				}
			}

			if (oldRegionConfig) {
				try {
					const parsed = JSON.parse(oldRegionConfig);
					migrated = {
						...migrated,
						exclude: { hue: parsed.exclude?.hue ?? initialValue.exclude.hue },
						page_number: {
							hue: parsed.page_number?.hue ?? initialValue.page_number.hue,
						},
					};
				} catch {
					// Keep defaults
				}
			}

			return migrated;
		},
		setItem: (key, value) => {
			localStorage.setItem(key, JSON.stringify(value));
		},
		removeItem: (key) => localStorage.removeItem(key),
	},
);

export type IndexEntryGroupsEnabledConfig = {
	subject: boolean;
	author: boolean;
	scripture: boolean;
};

export const indexEntryGroupsEnabledAtom =
	atomWithStorage<IndexEntryGroupsEnabledConfig>(
		"editor-index-entry-groups-enabled",
		{ subject: true, author: true, scripture: true },
	);

export const colorConfigAtom = atom(
	(get) => {
		const config = get(highlightColorConfigAtom);
		return {
			subject: config.subject,
			author: config.author,
			scripture: config.scripture,
		} as ColorConfig;
	},
	(get, set, update: ColorConfig | ((prev: ColorConfig) => ColorConfig)) => {
		const current = get(highlightColorConfigAtom);
		const currentColorConfig = {
			subject: current.subject,
			author: current.author,
			scripture: current.scripture,
		} as ColorConfig;
		const newConfig =
			typeof update === "function" ? update(currentColorConfig) : update;
		set(highlightColorConfigAtom, {
			...current,
			...newConfig,
		});
	},
);

export const regionTypeColorConfigAtom = atom(
	(get) => {
		const config = get(highlightColorConfigAtom);
		return {
			exclude: config.exclude,
			page_number: config.page_number,
		} as RegionTypeColorConfig;
	},
	(
		get,
		set,
		update:
			| RegionTypeColorConfig
			| ((prev: RegionTypeColorConfig) => RegionTypeColorConfig),
	) => {
		const current = get(highlightColorConfigAtom);
		const currentRegionConfig = {
			exclude: current.exclude,
			page_number: current.page_number,
		} as RegionTypeColorConfig;
		const newConfig =
			typeof update === "function" ? update(currentRegionConfig) : update;
		set(highlightColorConfigAtom, {
			...current,
			...newConfig,
		});
	},
);
