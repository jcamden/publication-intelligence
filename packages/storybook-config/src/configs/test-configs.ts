import type { Parameters } from "@storybook/react";

/**
 * Default globals for all stories to ensure consistent reset between stories
 * - theme: "light" - default to light theme
 * - viewport: undefined - default to full viewport (no override)
 */
export const defaultGlobals = {
	theme: "light",
	viewport: undefined,
} as const;

/**
 * Common configuration for interaction test stories
 * Disables docs generation, hides the docs panel, and disables controls
 */
export const interactionTestConfig: Parameters = {
	docs: { disable: true },
	previewTabs: { "storybook/docs/panel": { hidden: true } },
	controls: { disable: true },
};

/**
 * Common configuration for visual regression test stories
 * Includes Chromatic settings, disables docs, and disables controls
 */
export const visualRegressionTestConfig: Parameters = {
	chromatic: { disableSnapshot: false },
	docs: { disable: true },
	previewTabs: { "storybook/docs/panel": { hidden: true } },
	controls: { disable: true },
};
