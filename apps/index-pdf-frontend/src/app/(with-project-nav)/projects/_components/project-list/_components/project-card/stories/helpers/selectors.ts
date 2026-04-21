import type { StorybookCanvas } from "@pubint/yaboujee/_stories";

export const projectCardSelectors = {
	cardLink: (canvas: StorybookCanvas) => canvas.getByRole("link"),

	settingsButton: (canvas: StorybookCanvas) =>
		canvas.getByRole("button", { name: /project settings/i }),
};
