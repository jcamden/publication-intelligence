/**
 * Shared interaction test helper functions for Storybook tests
 */

import { expect, waitFor, type within } from "@storybook/test";

/**
 * Wait for PDF highlights to render in the highlight layer
 * Useful when testing Editor component stories that depend on highlights being visible
 *
 * @example
 * await awaitHighlights({ canvas });
 */
export const awaitHighlights = async ({
	canvas,
}: {
	canvas: ReturnType<typeof within>;
}) => {
	await waitFor(
		async () => {
			const highlightLayer = canvas.getByTestId("pdf-highlight-layer");
			const highlights = highlightLayer.querySelectorAll(
				"[data-testid^='highlight-']",
			);
			await expect(highlights.length).toBeGreaterThan(0);
		},
		{ timeout: 10000 },
	);
};
