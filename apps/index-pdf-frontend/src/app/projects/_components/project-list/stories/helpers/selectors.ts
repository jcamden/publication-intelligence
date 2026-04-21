import type { StorybookCanvas } from "@pubint/yaboujee/_stories";

export const projectListSelectors = {
	cardLinks: (canvas: StorybookCanvas) => canvas.getAllByRole("link"),
	createProjectButton: (canvas: StorybookCanvas) =>
		canvas.getByRole("button", { name: /create.*project/i }),
	emptyMessage: (canvas: StorybookCanvas) =>
		canvas.getByText(/no projects yet/i),
	projectTitle: (canvas: StorybookCanvas, text: string | RegExp) =>
		canvas.getByText(text),
	settingsButtons: (canvas: StorybookCanvas) =>
		canvas.getAllByRole("button", { name: /project settings/i }),
	skeletonPulseElements: (root: HTMLElement) =>
		root.querySelectorAll(".animate-pulse"),
};
