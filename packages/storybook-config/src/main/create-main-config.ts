import type { StorybookConfig } from "@storybook/react-vite";
import type { InlineConfig } from "vite";

export type StoryType = "all" | "interaction" | "vrt";

type CreateMainConfigOptions = {
	storyType: StoryType;
	framework: "@storybook/react-vite" | "@storybook/nextjs-vite";
	/** Optional function to customize the vite config */
	customizeVite?: (
		config: InlineConfig,
	) => InlineConfig | Promise<InlineConfig>;
};

const STORY_PATTERNS: Record<StoryType, string> = {
	all: "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)",
	interaction: "../src/**/interaction-tests.stories.@(js|jsx|mjs|ts|tsx)",
	vrt: "../src/**/visual-regression-tests.stories.@(js|jsx|mjs|ts|tsx)",
};

/**
 * Creates a Storybook main.ts config based on story type
 * Reduces duplication across .storybook, .storybook-interaction, and .storybook-vrt
 */
export const createMainConfig = ({
	storyType,
	framework,
	customizeVite,
}: CreateMainConfigOptions): Partial<StorybookConfig> => {
	const baseAddons = [
		"@chromatic-com/storybook",
		"@storybook/addon-a11y",
		"@storybook/addon-docs",
		"storybook-addon-pseudo-states",
	];

	// Only include vitest addon for non-VRT configs (VRT uses Playwright)
	const addons =
		storyType === "vrt"
			? baseAddons
			: ["@storybook/addon-vitest", ...baseAddons];

	return {
		stories:
			storyType === "all" ? [STORY_PATTERNS.all] : [STORY_PATTERNS[storyType]],
		addons,
		framework,
		staticDirs: ["./public"],
		...(customizeVite && { viteFinal: customizeVite }),
	};
};
