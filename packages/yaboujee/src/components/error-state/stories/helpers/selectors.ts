import type { StorybookCanvas } from "@pubint/yaboujee/_stories";

export const errorStateSelectors = {
	retryButton: (canvas: StorybookCanvas) =>
		canvas.getByRole("button", { name: /try again/i }),
};
