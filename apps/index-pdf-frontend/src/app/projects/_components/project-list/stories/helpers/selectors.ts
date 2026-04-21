import type { StorybookCanvas } from "@pubint/yaboujee/_stories";

export const projectListSelectors = {
	projectTitle: (canvas: StorybookCanvas, text: string | RegExp) =>
		canvas.getByText(text),

	emptyMessage: (canvas: StorybookCanvas) =>
		canvas.getByText(/no projects yet/i),

	createProjectButton: (canvas: StorybookCanvas) =>
		canvas.getByRole("button", { name: /create.*project/i }),

	settingsButtons: (canvas: StorybookCanvas) =>
		canvas.getAllByRole("button", { name: /project settings/i }),

	cardLinks: (canvas: StorybookCanvas) => canvas.getAllByRole("link"),

	skeletonPulseElements: (root: HTMLElement) =>
		root.querySelectorAll(".animate-pulse"),
};
