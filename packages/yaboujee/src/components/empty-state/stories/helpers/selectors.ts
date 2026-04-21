import type { StorybookCanvas } from "@pubint/yaboujee/_stories";

export const emptyStateSelectors = {
	actionButton: (canvas: StorybookCanvas) =>
		canvas.getByRole("button", { name: /create project/i }),
};
